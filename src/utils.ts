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
  const maxRetries = Math.max(config.maxRetries ?? 10, 1);
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

      const currentAttempt = attempt + 1;
      const effectiveAttempt = Math.min(attempt, maxRetries - 1);
      const delay = getRetryDelay(effectiveAttempt);
      const delaySec = Math.round(delay / 1000);

      if (!config.ignoreNetworkWarnings)
      {
        if (currentAttempt <= maxRetries)
        {
          logger.warn(`获取 GitHub 用户信息失败（第 ${currentAttempt}/${maxRetries} 次），${delaySec} 秒后重试：${detail}`);
        } else
        {
          logger.warn(`获取 GitHub 用户信息失败（已超过 ${maxRetries} 次），${delaySec} 秒后继续重试：${detail}`);
        }
      }

      await sleep(delay);
      if (attempt < maxRetries - 1) attempt++;
    } finally
    {
      requestClient.dispose();
    }
  }
}
