import { GitHubBot } from '../base';

type EmitFunction = (name: string, payload: unknown) => void;

function emitGitHubEvent(bot: GitHubBot, name: string, payload: unknown): void
{
  const emit = bot.ctx.emit as EmitFunction;
  emit(name, payload);
}

export function dispatchGitHubEvent(bot: GitHubBot, event: any, owner: string, repo: string): void
{
  const repoKey = `${owner}/${repo}`;
  const eventData = {
    owner,
    repo,
    repoKey,
    actor: event.actor,
    payload: event.payload,
    type: event.type,
    action: event.payload?.action,
    timestamp: new Date(event.created_at).getTime(),
    botId: bot.selfId,
    platform: bot.platform,
  };

  switch (event.type)
  {
    case 'IssuesEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/issue-${event.payload.action}`, {
          ...eventData,
          issue: event.payload.issue,
        });
      }
      emitGitHubEvent(bot, 'github/issue', {
        ...eventData,
        issue: event.payload.issue,
      });
      break;

    case 'IssueCommentEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/issue-comment-${event.payload.action}`, {
          ...eventData,
          issue: event.payload.issue,
          comment: event.payload.comment,
        });
      }
      emitGitHubEvent(bot, 'github/issue-comment', {
        ...eventData,
        issue: event.payload.issue,
        comment: event.payload.comment,
      });
      break;

    case 'PullRequestEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/pull-request-${event.payload.action}`, {
          ...eventData,
          pullRequest: event.payload.pull_request,
        });
      }
      emitGitHubEvent(bot, 'github/pull-request', {
        ...eventData,
        pullRequest: event.payload.pull_request,
      });
      break;

    case 'PullRequestReviewCommentEvent':
      emitGitHubEvent(bot, 'github/pull-request-review-comment', {
        ...eventData,
        pullRequest: event.payload.pull_request,
        comment: event.payload.comment,
      });
      break;

    case 'DiscussionEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/discussion-${event.payload.action}`, {
          ...eventData,
          discussion: event.payload.discussion,
        });
      }
      emitGitHubEvent(bot, 'github/discussion', {
        ...eventData,
        discussion: event.payload.discussion,
      });
      break;

    case 'DiscussionCommentEvent':
      emitGitHubEvent(bot, 'github/discussion-comment', {
        ...eventData,
        discussion: event.payload.discussion,
        comment: event.payload.comment,
      });
      break;

    case 'WorkflowRunEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/workflow-run-${event.payload.action}`, {
          ...eventData,
          workflowRun: event.payload.workflow_run,
          workflow: event.payload.workflow,
        });
      }
      emitGitHubEvent(bot, 'github/workflow-run', {
        ...eventData,
        workflowRun: event.payload.workflow_run,
        workflow: event.payload.workflow,
      });
      break;

    case 'WorkflowJobEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/workflow-job-${event.payload.action}`, {
          ...eventData,
          workflowJob: event.payload.workflow_job,
        });
      }
      emitGitHubEvent(bot, 'github/workflow-job', {
        ...eventData,
        workflowJob: event.payload.workflow_job,
      });
      break;

    case 'WatchEvent':
      emitGitHubEvent(bot, 'github/star', {
        ...eventData,
        action: event.payload.action || 'started',
      });
      break;

    case 'ForkEvent':
      emitGitHubEvent(bot, 'github/fork', {
        ...eventData,
        forkee: event.payload.forkee,
      });
      break;

    case 'PushEvent':
      emitGitHubEvent(bot, 'github/push', {
        ...eventData,
        ref: event.payload.ref,
        before: event.payload.before,
        after: event.payload.after,
        commits: event.payload.commits,
        headCommit: event.payload.head_commit,
      });
      break;

    case 'ReleaseEvent':
      if (event.payload.action)
      {
        emitGitHubEvent(bot, `github/release-${event.payload.action}`, {
          ...eventData,
          release: event.payload.release,
        });
      }
      emitGitHubEvent(bot, 'github/release', {
        ...eventData,
        release: event.payload.release,
      });
      break;
  }

  emitGitHubEvent(bot, 'github/event', eventData);
}
