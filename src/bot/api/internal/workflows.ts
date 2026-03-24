import { checkSilentMode, type InternalBot, type WorkflowRunStatus } from './shared';

export async function listWorkflows(bot: InternalBot, owner: string, repo: string)
{
  try
  {
    const { data } = await bot.octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });
    return data.workflows;
  } catch (error)
  {
    bot.logError('获取工作流列表失败', error);
    throw error;
  }
}

export async function getWorkflow(bot: InternalBot, owner: string, repo: string, workflowId: number | string)
{
  try
  {
    const { data } = await bot.octokit.actions.getWorkflow({
      owner,
      repo,
      workflow_id: workflowId,
    });
    return data;
  } catch (error)
  {
    bot.logError('获取工作流详情失败', error);
    throw error;
  }
}

export async function triggerWorkflow(
  bot: InternalBot,
  owner: string,
  repo: string,
  workflowId: number | string,
  ref: string,
  inputs?: Record<string, string>,
)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs: inputs || {},
    });
    bot.logInfo(`触发工作流成功: ${workflowId}`);
  } catch (error)
  {
    bot.logError('触发工作流失败', error);
    throw error;
  }
}

export async function listWorkflowRuns(
  bot: InternalBot,
  owner: string,
  repo: string,
  workflowId?: number | string,
  status?: WorkflowRunStatus,
)
{
  try
  {
    if (workflowId)
    {
      const params: {
        owner: string;
        repo: string;
        per_page: number;
        workflow_id: number | string;
        status?: WorkflowRunStatus;
      } = {
        owner,
        repo,
        per_page: 30,
        workflow_id: workflowId,
      };

      if (status) params.status = status;

      const { data } = await bot.octokit.actions.listWorkflowRuns(params);
      return data.workflow_runs;
    }

    const params: {
      owner: string;
      repo: string;
      per_page: number;
      status?: WorkflowRunStatus;
    } = {
      owner,
      repo,
      per_page: 30,
    };

    if (status) params.status = status;

    const { data } = await bot.octokit.actions.listWorkflowRunsForRepo(params);
    return data.workflow_runs;
  } catch (error)
  {
    bot.logError('获取工作流运行列表失败', error);
    throw error;
  }
}

export async function getWorkflowRun(bot: InternalBot, owner: string, repo: string, runId: number)
{
  try
  {
    const { data } = await bot.octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return data;
  } catch (error)
  {
    bot.logError('获取工作流运行详情失败', error);
    throw error;
  }
}

export async function cancelWorkflowRun(bot: InternalBot, owner: string, repo: string, runId: number)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    bot.logInfo(`取消工作流运行成功: ${runId}`);
  } catch (error)
  {
    bot.logError('取消工作流运行失败', error);
    throw error;
  }
}

export async function rerunWorkflow(bot: InternalBot, owner: string, repo: string, runId: number)
{
  if (checkSilentMode(bot)) return;

  try
  {
    await bot.octokit.actions.reRunWorkflow({
      owner,
      repo,
      run_id: runId,
    });
    bot.logInfo(`重新运行工作流成功: ${runId}`);
  } catch (error)
  {
    bot.logError('重新运行工作流失败', error);
    throw error;
  }
}
