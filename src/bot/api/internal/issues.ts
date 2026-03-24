import { checkSilentMode, type InternalBot } from './shared';

export async function createIssue(
  bot: InternalBot,
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[],
  assignees?: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.create({
      owner,
      repo,
      title,
      body: body || '',
      labels: labels || [],
      assignees: assignees || [],
    });
    return data;
  } catch (error)
  {
    bot.logError('创建 Issue 失败:', error);
    throw error;
  }
}

export async function closeIssue(bot: InternalBot, owner: string, repo: string, issueNumber: number)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: 'closed',
    });
    return data;
  } catch (error)
  {
    bot.logError('关闭 Issue 失败:', error);
    throw error;
  }
}

export async function reopenIssue(bot: InternalBot, owner: string, repo: string, issueNumber: number)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: 'open',
    });
    return data;
  } catch (error)
  {
    bot.logError('重新打开 Issue 失败:', error);
    throw error;
  }
}

export async function addIssueLabels(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels,
    });
    return data;
  } catch (error)
  {
    bot.logError('添加 Issue 标签失败:', error);
    throw error;
  }
}

export async function removeIssueLabel(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  label: string,
)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.issues.removeLabel({
      owner,
      repo,
      issue_number: issueNumber,
      name: label,
    });
  } catch (error)
  {
    bot.logError('移除 Issue 标签失败:', error);
    throw error;
  }
}

export async function addIssueAssignees(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  assignees: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.addAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees,
    });
    return data;
  } catch (error)
  {
    bot.logError('分配 Issue 用户失败:', error);
    throw error;
  }
}

export async function removeIssueAssignees(
  bot: InternalBot,
  owner: string,
  repo: string,
  issueNumber: number,
  assignees: string[],
)
{
  if (checkSilentMode(bot)) return null;

  try
  {
    const { data } = await bot.octokit.issues.removeAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees,
    });
    return data;
  } catch (error)
  {
    bot.logError('移除 Issue 分配用户失败:', error);
    throw error;
  }
}
