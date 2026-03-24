import { GitHubBot } from '../base';

export async function handleGitHubNotification(
  bot: GitHubBot,
  notification: any,
  owner: string,
  repo: string,
  handleEvent: (event: any, owner: string, repo: string) => Promise<void>,
): Promise<void>
{
  bot.logInfo(`处理通知: ${notification.subject.type} - ${notification.subject.title}`);

  try
  {
    const subjectType = notification.subject.type;
    const subjectUrl = notification.subject.url;

    if (!subjectUrl)
    {
      bot.logInfo(`通知类型 ${subjectType} 没有 URL，跳过处理`);
      return;
    }

    const urlParts = subjectUrl.split('/');
    const number = parseInt(urlParts[urlParts.length - 1]);

    if (Number.isNaN(number))
    {
      bot.logError(`无法从 URL 解析编号: ${subjectUrl}`);
      return;
    }

    const lastReadAt = notification.last_read_at ? new Date(notification.last_read_at) : null;

    if (subjectType === 'Issue')
    {
      const { data: issue } = await bot.octokit.issues.get({
        owner,
        repo,
        issue_number: number,
      });

      const { data: allComments } = await bot.octokit.issues.listComments({
        owner,
        repo,
        issue_number: number,
        per_page: 100,
        since: lastReadAt ? lastReadAt.toISOString() : undefined,
      });

      for (const comment of allComments)
      {
        const commentTime = new Date(comment.created_at);
        if (lastReadAt && commentTime <= lastReadAt) continue;

        await handleEvent({
          id: `notif-${notification.id}-${comment.id}`,
          type: 'IssueCommentEvent',
          actor: {
            login: comment.user.login,
            avatar_url: comment.user.avatar_url,
          },
          payload: {
            action: 'created',
            issue,
            comment,
          },
          created_at: comment.created_at,
        }, owner, repo);
      }
    } else if (subjectType === 'PullRequest')
    {
      const { data: pull } = await bot.octokit.pulls.get({
        owner,
        repo,
        pull_number: number,
      });

      const { data: allComments } = await bot.octokit.issues.listComments({
        owner,
        repo,
        issue_number: number,
        per_page: 100,
        since: lastReadAt ? lastReadAt.toISOString() : undefined,
      });

      for (const comment of allComments)
      {
        const commentTime = new Date(comment.created_at);
        if (lastReadAt && commentTime <= lastReadAt) continue;

        await handleEvent({
          id: `notif-${notification.id}-${comment.id}`,
          type: 'IssueCommentEvent',
          actor: {
            login: comment.user.login,
            avatar_url: comment.user.avatar_url,
          },
          payload: {
            action: 'created',
            issue: pull,
            comment,
          },
          created_at: comment.created_at,
        }, owner, repo);
      }
    }
  } catch (error)
  {
    bot.logError(`处理通知失败: ${notification.id}`, error);
  }
}
