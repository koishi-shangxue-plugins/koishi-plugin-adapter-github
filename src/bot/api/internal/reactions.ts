import { checkSilentMode, type InternalBot, type ReactionContent } from './shared';

export async function createIssueReaction(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  content: ReactionContent,
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.reactions.createForIssue({
      owner,
      repo,
      issue_number: issueNumber,
      content,
    });
    bot.logInfo(`创建 Issue 反应成功，反应数据: ${JSON.stringify(data)}`);
    return data.id;
  } catch (error)
  {
    bot.logError('创建 Issue 反应失败', error);
    throw error;
  }
}

export async function createIssueCommentReaction(
  bot: InternalBot,
  owner: string,
  repo: string,
  commentId: number,
  content: ReactionContent,
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: commentId,
      content,
    });
    bot.logInfo(`创建评论反应成功，反应数据: ${JSON.stringify(data)}`);
    return data.id;
  } catch (error)
  {
    bot.logError('创建评论反应失败', error);
    throw error;
  }
}

export async function deleteIssueReaction(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  reactionId: number,
)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}', {
      owner,
      repo,
      issue_number: issueNumber,
      reaction_id: reactionId,
    });
    bot.logInfo(`删除 Issue 反应成功: ${reactionId}`);
  } catch (error)
  {
    bot.logError(`删除 Issue 反应失败: ${reactionId}`, error);
    throw error;
  }
}

export async function deleteIssueCommentReaction(
  bot: InternalBot,
  owner: string,
  repo: string,
  commentId: number,
  reactionId: number,
)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.request('DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}', {
      owner,
      repo,
      comment_id: commentId,
      reaction_id: reactionId,
    });
    bot.logInfo(`删除评论反应成功: ${reactionId}`);
  } catch (error)
  {
    bot.logError(`删除评论反应失败: ${reactionId}`, error);
    throw error;
  }
}
