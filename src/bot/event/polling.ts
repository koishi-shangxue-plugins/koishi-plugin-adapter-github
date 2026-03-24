import { parseRepository, type RepoConfig } from '../../config';
import { GitHubBot } from '../base';

function isTransientPollError(error: any): boolean
{
  return error?.status === 500
    || error?.status === 502
    || error?.status === 503
    || error?.code === 'EHOSTUNREACH'
    || error?.code === 'ETIMEDOUT'
    || error?.code === 'ECONNRESET';
}

export async function processRepositoryPoll(
  bot: GitHubBot,
  repo: RepoConfig,
  isFirstPoll: boolean,
  hasOwnedRepo: (repoKey: string) => boolean,
  getProcessedIds: (repoKey: string) => Set<string> | undefined,
  setProcessedIds: (repoKey: string, ids: Set<string>) => void,
  handleEvent: (event: any, owner: string, repo: string) => Promise<void>,
): Promise<void>
{
  const parsed = parseRepository(repo.repository);
  if (!parsed)
  {
    bot.loggerWarn(`仓库格式错误: ${repo.repository}，跳过轮询`);
    return;
  }

  const { owner, repo: repoName } = parsed;
  const repoKey = `${owner}/${repoName}`;

  if (!hasOwnedRepo(repoKey)) return;

  try
  {
    const { data: events } = await bot.octokit.activity.listRepoEvents({
      owner,
      repo: repoName,
      per_page: 20,
    });

    if (isFirstPoll)
    {
      const processedIds = new Set<string>();
      events.forEach(event => processedIds.add(event.id));
      setProcessedIds(repoKey, processedIds);
      bot.logInfo(`仓库 ${repoKey} 首次轮询，记录 ${processedIds.size} 个历史事件 ID 作为基线`);
      return;
    }

    let processedIds = getProcessedIds(repoKey);
    if (!processedIds)
    {
      processedIds = new Set<string>();
      setProcessedIds(repoKey, processedIds);
    }

    const newEvents = events.filter(event => !processedIds.has(event.id));
    if (newEvents.length <= 0) return;

    bot.logInfo(`仓库 ${repoKey} 发现 ${newEvents.length} 个新事件`);
    newEvents.forEach(event => processedIds.add(event.id));

    if (processedIds.size > 100)
    {
      setProcessedIds(repoKey, new Set(Array.from(processedIds).slice(-100)));
    }

    for (const event of newEvents.reverse())
    {
      bot.logInfo(`处理事件: ${event.type} - ${event.actor.login}`);
      await handleEvent(event, owner, repoName);
    }
  } catch (error: any)
  {
    if (isTransientPollError(error))
    {
      if (!bot.config.ignoreNetworkWarnings)
      {
        bot.loggerWarn(`轮询仓库 ${repoKey} 事件时网络异常 (${error.status || error.code})，将在下次轮询重试`);
      }
      return;
    }

    bot.logError(`轮询仓库 ${repoKey} 事件时出错`, error);
  }
}

export async function processNotificationPoll(
  bot: GitHubBot,
  hasOwnedRepo: (repoKey: string) => boolean,
  handleNotification: (notification: any, owner: string, repo: string) => Promise<void>,
): Promise<void>
{
  try
  {
    const { data: notifications } = await bot.octokit.activity.listNotificationsForAuthenticatedUser({
      all: false,
      per_page: 50,
    });

    for (const notification of notifications)
    {
      const owner = notification.repository.owner.login;
      const repo = notification.repository.name;
      const repoKey = `${owner}/${repo}`;

      if (hasOwnedRepo(repoKey))
      {
        try
        {
          await bot.octokit.activity.markThreadAsRead({
            thread_id: parseInt(notification.id),
          });
        } catch (error: any)
        {
          if (isTransientPollError(error))
          {
            if (!bot.config.ignoreNetworkWarnings)
            {
              bot.loggerWarn(`标记通知已读时网络异常: ${notification.id}`);
            }
          } else
          {
            bot.logError(`标记通知已读失败: ${notification.id}`, error);
          }
        }
        continue;
      }

      bot.logInfo(`处理仓库通知: ${repoKey}`);
      await handleNotification(notification, owner, repo);

      try
      {
        await bot.octokit.activity.markThreadAsRead({
          thread_id: parseInt(notification.id),
        });
      } catch (error: any)
      {
        if (isTransientPollError(error))
        {
          if (!bot.config.ignoreNetworkWarnings)
          {
            bot.loggerWarn(`标记通知已读时网络异常: ${notification.id}`);
          }
        } else
        {
          bot.logError(`标记通知已读失败: ${notification.id}`, error);
        }
      }
    }
  } catch (error: any)
  {
    if (isTransientPollError(error))
    {
      if (!bot.config.ignoreNetworkWarnings)
      {
        bot.loggerWarn(`轮询通知时网络异常 (${error.status || error.code})，将在下次轮询重试`);
      }
      return;
    }

    bot.logError('轮询通知时出错', error);
  }
}
