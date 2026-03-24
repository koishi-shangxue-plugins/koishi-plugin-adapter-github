import { GitHubBot } from '../base';

export async function handleGitHubWebhookEvent(
  bot: GitHubBot,
  event: any,
  owner: string,
  repo: string,
  handleEvent: (event: any, owner: string, repo: string) => Promise<void>,
): Promise<void>
{
  let eventType = '';
  let payload: any = {};
  let actor: any = event.sender;

  if (event.issue && event.comment)
  {
    eventType = 'IssueCommentEvent';
    payload = { issue: event.issue, comment: event.comment, action: event.action };
  } else if (event.issue)
  {
    eventType = 'IssuesEvent';
    payload = { issue: event.issue, action: event.action };
  } else if (event.pull_request && event.comment)
  {
    eventType = 'PullRequestReviewCommentEvent';
    payload = { pull_request: event.pull_request, comment: event.comment };
  } else if (event.pull_request)
  {
    eventType = 'PullRequestEvent';
    payload = { pull_request: event.pull_request, action: event.action };
  } else if (event.discussion && event.comment)
  {
    eventType = 'DiscussionCommentEvent';
    payload = { discussion: event.discussion, comment: event.comment };
  } else if (event.discussion)
  {
    eventType = 'DiscussionEvent';
    payload = { discussion: event.discussion, action: event.action };
  } else if (event.forkee)
  {
    eventType = 'ForkEvent';
    payload = { forkee: event.forkee };
    actor = event.forkee.owner;
  } else if ((event.action === 'started' || event.action === 'deleted') && event.repository && !event.issue && !event.pull_request && !event.discussion)
  {
    eventType = 'WatchEvent';
    payload = { action: event.action };
  } else if (event.workflow_run)
  {
    eventType = 'WorkflowRunEvent';
    payload = { workflow_run: event.workflow_run, workflow: event.workflow, action: event.action };
  } else if (event.workflow_job)
  {
    eventType = 'WorkflowJobEvent';
    payload = { workflow_job: event.workflow_job, action: event.action };
  } else if (event.ref && event.commits)
  {
    eventType = 'PushEvent';
    payload = {
      ref: event.ref,
      before: event.before,
      after: event.after,
      commits: event.commits,
      head_commit: event.head_commit,
      pusher: event.pusher,
    };
    actor = event.pusher || event.sender;
  } else if (event.release)
  {
    eventType = 'ReleaseEvent';
    payload = { release: event.release, action: event.action };
  } else
  {
    bot.logInfo(`未处理的 webhook 事件类型，payload keys: ${Object.keys(event).join(', ')}`);
    return;
  }

  const eventDesc = event.action || eventType.replace('Event', '') || '未知';
  bot.logInfo(`收到 Webhook 事件: ${eventDesc}`);

  await handleEvent({
    id: `webhook-${Date.now()}`,
    type: eventType,
    actor,
    payload,
    created_at: new Date().toISOString(),
  }, owner, repo);
}
