import { checkSilentMode, type InternalBot } from './shared';

export async function createPullRequest(
  bot: InternalBot,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string,
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body: body || '',
    });
    return data;
  } catch (error)
  {
    bot.logError('创建 Pull Request 失败:', error);
    throw error;
  }
}

export async function closePullRequest(bot: InternalBot, owner: string, repo: string, pullNumber: number)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.pulls.update({
      owner,
      repo,
      pull_number: pullNumber,
      state: 'closed',
    });
    return data;
  } catch (error)
  {
    bot.logError('关闭 Pull Request 失败:', error);
    throw error;
  }
}

export async function mergePullRequest(
  bot: InternalBot,
  owner: string,
  repo: string,
  pullNumber: number,
  commitTitle?: string,
  commitMessage?: string,
  mergeMethod?: 'merge' | 'squash' | 'rebase',
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      commit_title: commitTitle,
      commit_message: commitMessage,
      merge_method: mergeMethod || 'merge',
    });
    return data;
  } catch (error)
  {
    bot.logError('合并 Pull Request 失败:', error);
    throw error;
  }
}

export async function addPullRequestLabels(
  bot: InternalBot,
  owner: string,
  repo: string,
  pullNumber: number,
  labels: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.addLabels({
      owner,
      repo,
      issue_number: pullNumber,
      labels,
    });
    return data;
  } catch (error)
  {
    bot.logError('添加 PR 标签失败:', error);
    throw error;
  }
}

export async function requestPullRequestReviewers(
  bot: InternalBot,
  owner: string,
  repo: string,
  pullNumber: number,
  reviewers?: string[],
  teamReviewers?: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pullNumber,
      reviewers: reviewers || [],
      team_reviewers: teamReviewers || [],
    });
    return data;
  } catch (error)
  {
    bot.logError('请求 PR 审查失败:', error);
    throw error;
  }
}

export async function addPullRequestAssignees(
  bot: InternalBot,
  owner: string,
  repo: string,
  pullNumber: number,
  assignees: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.addAssignees({
      owner,
      repo,
      issue_number: pullNumber,
      assignees,
    });
    return data;
  } catch (error)
  {
    bot.logError('分配 PR 用户失败:', error);
    throw error;
  }
}
