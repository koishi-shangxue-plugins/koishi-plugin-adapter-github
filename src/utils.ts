import { sleep } from 'koishi';
import { Config } from './config';
import { logger } from './index';
import { createGitHubRequestClient } from './bot/http';
import { formatGitHubError, summarizeGitHubError } from './network';

function getRetryDelay(attempt: number): number
{
  return Math.min((attempt + 1) * 5 * 1000, 60 * 1000);
}

export async function fetchUsernameWithRetry(
  config: Config,
  signal: AbortSignal
): Promise<string | null>
{
  const autoDispose = config.autoDispose ?? true;
  const maxRetries = config.maxRetries ?? 10;
  let attempt = 0;

  while (true)
  {
    if (signal.aborted) return null;

    const requestClient = createGitHubRequestClient(config);

    try
    {
      const { Octokit } = await import('@octokit/rest');
      const octokit = new Octokit({
        auth: config.token,
        log: requestClient.log,
        request: {
          fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          {
            return requestClient.fetch(url, init);
          },
        },
      });

      const { data: user } = await octokit.users.getAuthenticated();
      return user.login;
    } catch (error)
    {
      if (signal.aborted) return null;

      const summary = summarizeGitHubError(error);
      const detail = formatGitHubError(error);

      // 鉴权类错误没有继续重试的意义，直接结束启动流程。
      if (!summary.retryable)
      {
        logger.error(`获取 GitHub 用户信息失败，错误不可重试：${detail}`);
        return null;
      }

      if (autoDispose)
      {
        if (attempt >= maxRetries)
        {
          logger.error(`获取 GitHub 用户信息失败，已重试 ${maxRetries} 次，放弃：${detail}`);
          return null;
        }

        const delay = getRetryDelay(attempt);
        const delaySec = Math.round(delay / 1000);
        if (!config.ignoreNetworkWarnings)
        {
          logger.warn(`获取 GitHub 用户信息失败（第 ${attempt + 1}/${maxRetries} 次），${delaySec} 秒后重试：${detail}`);
        }
        await sleep(delay);
      } else
      {
        const delay = getRetryDelay(attempt);
        const delaySec = Math.round(delay / 1000);
        if (!config.ignoreNetworkWarnings)
        {
          logger.warn(`获取 GitHub 用户信息失败（第 ${attempt + 1} 次），${delaySec} 秒后重试：${detail}`);
        }
        await sleep(delay);
        if (delay < 60 * 1000) attempt++;
        continue;
      }

      attempt++;
    } finally
    {
      requestClient.dispose();
    }
  }
}
