import { h, Universal } from 'koishi';
import { decodeMarkdown } from '../../message/markdown';
import { GitHubBot } from '../base';
import { dispatchGitHubEvent } from './dispatch';

export async function handleGitHubEvent(
  bot: GitHubBot,
  event: any,
  owner: string,
  repo: string,
): Promise<void>
{
  const actorLogin = event.actor?.login || event.actor?.name;
  if (actorLogin === bot.selfId)
  {
    bot.logInfo(`忽略机器人自己产生的事件: ${event.type}`);
    return;
  }

  bot.logInfo(`事件详情: ${JSON.stringify(event, null, 2)}`);

  if (
    event.type === 'WorkflowRunEvent'
    || event.type === 'WorkflowJobEvent'
    || event.type === 'WatchEvent'
    || event.type === 'ForkEvent'
    || event.type === 'PushEvent'
    || event.type === 'ReleaseEvent'
  )
  {
    dispatchGitHubEvent(bot, event, owner, repo);
    return;
  }

  const session = bot.session({
    type: 'message',
    timestamp: new Date(event.created_at).getTime(),
    user: {
      id: event.actor.login,
      name: event.actor.login,
      avatar: event.actor.avatar_url,
    },
  });

  let content = '';
  let channelId = '';
  const repoPrefix = `${owner}/${repo}`;

  switch (event.type)
  {
    case 'IssueCommentEvent':
      channelId = `${repoPrefix}:issues:${event.payload.issue.number}`;
      content = event.payload.comment.body;
      break;

    case 'IssuesEvent':
      if (['opened', 'closed', 'reopened'].includes(event.payload.action))
      {
        channelId = `${repoPrefix}:issues:${event.payload.issue.number}`;
        content = `[Issue ${event.payload.action}] ${event.payload.issue.title}`;
        if (event.payload.action === 'opened')
        {
          content += `\n${event.payload.issue.body || ''}`;
        }
      }
      break;

    case 'PullRequestEvent':
      if (['opened', 'closed', 'reopened'].includes(event.payload.action))
      {
        channelId = `${repoPrefix}:pull:${event.payload.pull_request.number}`;
        content = `[PR ${event.payload.action}] ${event.payload.pull_request.title}`;
        if (event.payload.action === 'opened')
        {
          content += `\n${event.payload.pull_request.body || ''}`;
        }
      }
      break;

    case 'PullRequestReviewCommentEvent':
      channelId = `${repoPrefix}:pull:${event.payload.pull_request.number}`;
      content = event.payload.comment.body;
      break;

    case 'DiscussionEvent':
      channelId = `${repoPrefix}:discussions:${event.payload.discussion.number}`;
      content = `[Discussion ${event.payload.action}] ${event.payload.discussion.title}`;
      break;

    case 'DiscussionCommentEvent':
      channelId = `${repoPrefix}:discussions:${event.payload.discussion.number}`;
      content = event.payload.comment.body;
      break;
  }

  if (!channelId || !content) return;

  session.channelId = channelId;
  session.guildId = channelId;

  const elements = decodeMarkdown(content);
  const normalized = h.normalize(elements);
  session.content = normalized.join('');
  session.elements = normalized;

  let messageId = event.id;
  if (
    (event.type === 'IssueCommentEvent'
      || event.type === 'PullRequestReviewCommentEvent'
      || event.type === 'DiscussionCommentEvent')
    && event.payload.comment
  )
  {
    messageId = String(event.payload.comment.id);
  } else if (event.type === 'IssuesEvent')
  {
    messageId = 'issue';
  } else if (event.type === 'PullRequestEvent')
  {
    messageId = 'pull';
  } else if (event.type === 'DiscussionEvent')
  {
    messageId = 'discussion';
  }
  session.messageId = messageId;

  if (event.type === 'IssueCommentEvent' || event.type === 'IssuesEvent')
  {
    session.event.guild = {
      id: channelId,
      name: event.payload.issue.title,
    };
    session.event.channel = {
      id: channelId,
      name: event.payload.issue.title,
      type: Universal.Channel.Type.TEXT,
    };
  } else if (event.type === 'PullRequestEvent' || event.type === 'PullRequestReviewCommentEvent')
  {
    session.event.guild = {
      id: channelId,
      name: event.payload.pull_request.title,
    };
    session.event.channel = {
      id: channelId,
      name: event.payload.pull_request.title,
      type: Universal.Channel.Type.TEXT,
    };
  } else if (event.type === 'DiscussionEvent' || event.type === 'DiscussionCommentEvent')
  {
    session.event.guild = {
      id: channelId,
      name: event.payload.discussion.title,
    };
    session.event.channel = {
      id: channelId,
      name: event.payload.discussion.title,
      type: Universal.Channel.Type.TEXT,
    };
  }

  bot.dispatch(session);
  dispatchGitHubEvent(bot, event, owner, repo);
}
