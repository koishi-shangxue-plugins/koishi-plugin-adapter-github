import type { GitHubBotComplete } from '../../webhook';

export type InternalBot = GitHubBotComplete;
export type ReactionContent = '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes';
export type WorkflowRunStatus =
  | 'completed'
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'skipped'
  | 'stale'
  | 'success'
  | 'timed_out'
  | 'in_progress'
  | 'queued'
  | 'requested'
  | 'waiting';

export function checkSilentMode(bot: InternalBot): boolean
{
  if (bot.config.silentMode)
  {
    bot.loggerWarn('静默模式已启用，internal API 方法不可用');
    return true;
  }
  return false;
}
