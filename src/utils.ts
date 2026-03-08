import { sleep } from 'koishi';
import { Config } from './config';
import { logger } from './index';
import { fetchWithProxy } from './bot/http';

/**
 * 计算第 attempt 次失败后的等待时间（毫秒）
 * 每次递增 5 秒，最大 60 秒
 */
function getRetryDelay(attempt: number): number
{
  return Math.min((attempt + 1) * 5 * 1000, 60 * 1000);
}

/**
 * 尝试获取 GitHub 用户名
 * - autoDispose=true（默认）：最多重试 maxRetries 次，全部失败返回 null 后关闭插件
 * - autoDispose=false：永远重试，不返回 null，直到成功或插件被销毁
 * @returns 用户名字符串，或 null（仅在 autoDispose=true 且全部失败时）
 */
export async function fetchUsernameWithRetry(
  config: Config,
  signal: AbortSignal
): Promise<string | null>
{
  const autoDispose = config.autoDispose ?? true;
  const maxRetries = config.maxRetries ?? 10;
  // attempt 从 0 开始，表示第几次失败
  let attempt = 0;

  while (true)
  {
    // 插件已被销毁，立即退出
    if (signal.aborted) return null;

    try
    {
      const { Octokit } = await import('@octokit/rest');
      // 根据配置决定是否使用代理
      const proxy = config.useProxy ? config.proxyUrl : undefined;
      const octokit = new Octokit({
        auth: config.token,
        request: {
          fetch: (url, init) => fetchWithProxy(url, init, proxy)
        }
      });
      const { data: user } = await octokit.users.getAuthenticated();
      return user.login;
    } catch (error)
    {
      if (signal.aborted) return null;

      if (autoDispose)
      {
        // 有限重试模式：达到最大次数则放弃
        if (attempt >= maxRetries)
        {
          logger.error(`获取 GitHub 用户信息失败，已重试 ${maxRetries} 次，放弃:`, error);
          return null;
        }
        const delay = getRetryDelay(attempt);
        const delaySec = Math.round(delay / 1000);
        logger.warn(`获取 GitHub 用户信息失败（第 ${attempt + 1}/${maxRetries} 次），${delaySec} 秒后重试:`, error);
        await sleep(delay);
        if (signal.aborted) return null;
      } else
      {
        // 永久重试模式：不限次数，延迟最大叠加到 60 秒
        const delay = getRetryDelay(attempt);
        const delaySec = Math.round(delay / 1000);
        logger.warn(`获取 GitHub 用户信息失败（第 ${attempt + 1} 次），${delaySec} 秒后重试:`, error);
        await sleep(delay);
        if (signal.aborted) return null;
        // 延迟达到上限后保持 60 秒间隔，不再递增 attempt
        if (delay < 60 * 1000) attempt++;
        // 成功后 attempt 会在下次循环 try 成功时直接 return，无需重置
        continue;
      }

      attempt++;
    }
  }
}
