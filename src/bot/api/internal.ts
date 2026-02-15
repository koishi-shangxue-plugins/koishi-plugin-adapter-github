import { GitHubBotComplete } from '../webhook';

/**
 * GitHub 平台特有的 API
 * 通过 bot.internal 调用
 */
export class GitHubInternal
{
  constructor(private bot: GitHubBotComplete) { }

  /**
   * 检查静默模式
   * @returns 如果处于静默模式返回 true
   */
  private checkSilentMode(): boolean
  {
    if (this.bot.config.silentMode)
    {
      this.bot.loggerWarn('静默模式已启用，internal API 方法不可用');
      return true;
    }
    return false;
  }

  /**
   * 创建 Issue
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param title Issue 标题
   * @param body Issue 内容
   * @param labels 标签列表
   * @param assignees 分配给的用户列表
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.create({
        owner,
        repo,
        title,
        body: body || '',
        labels: labels || [],
        assignees: assignees || [],
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`创建 Issue 失败:`, e);
      throw e;
    }
  }

  /**
   * 关闭 Issue
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   */
  async closeIssue(owner: string, repo: string, issueNumber: number)
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: 'closed',
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`关闭 Issue 失败:`, e);
      throw e;
    }
  }

  /**
   * 重新打开 Issue
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   */
  async reopenIssue(owner: string, repo: string, issueNumber: number)
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: 'open',
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`重新打开 Issue 失败:`, e);
      throw e;
    }
  }

  /**
   * 为 Issue 添加标签
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   * @param labels 标签列表
   */
  async addIssueLabels(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`添加标签失败:`, e);
      throw e;
    }
  }

  /**
   * 移除 Issue 的标签
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   * @param label 标签名称
   */
  async removeIssueLabel(
    owner: string,
    repo: string,
    issueNumber: number,
    label: string
  )
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
    } catch (e)
    {
      this.bot.logError(`移除标签失败:`, e);
      throw e;
    }
  }

  /**
   * 为 Issue 分配用户
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   * @param assignees 用户列表
   */
  async addIssueAssignees(
    owner: string,
    repo: string,
    issueNumber: number,
    assignees: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.addAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`分配用户失败:`, e);
      throw e;
    }
  }

  /**
   * 移除 Issue 的分配用户
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue 编号
   * @param assignees 用户列表
   */
  async removeIssueAssignees(
    owner: string,
    repo: string,
    issueNumber: number,
    assignees: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.removeAssignees({
        owner,
        repo,
        issue_number: issueNumber,
        assignees,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`移除分配用户失败:`, e);
      throw e;
    }
  }

  /**
   * 创建 Pull Request
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param title PR 标题
   * @param head 源分支（格式：用户名:分支名 或 分支名）
   * @param base 目标分支
   * @param body PR 内容
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body: body || '',
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`创建 Pull Request 失败:`, e);
      throw e;
    }
  }

  /**
   * 关闭 Pull Request
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR 编号
   */
  async closePullRequest(owner: string, repo: string, pullNumber: number)
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        state: 'closed',
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`关闭 Pull Request 失败:`, e);
      throw e;
    }
  }

  /**
   * 合并 Pull Request
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR 编号
   * @param commitTitle 合并提交标题
   * @param commitMessage 合并提交消息
   * @param mergeMethod 合并方式（merge/squash/rebase）
   */
  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    commitTitle?: string,
    commitMessage?: string,
    mergeMethod?: 'merge' | 'squash' | 'rebase'
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.pulls.merge({
        owner,
        repo,
        pull_number: pullNumber,
        commit_title: commitTitle,
        commit_message: commitMessage,
        merge_method: mergeMethod || 'merge',
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`合并 Pull Request 失败:`, e);
      throw e;
    }
  }

  /**
   * 为 Pull Request 添加标签
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR 编号
   * @param labels 标签列表
   */
  async addPullRequestLabels(
    owner: string,
    repo: string,
    pullNumber: number,
    labels: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pullNumber,
        labels,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`添加 PR 标签失败:`, e);
      throw e;
    }
  }

  /**
   * 为 Pull Request 分配审查者
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR 编号
   * @param reviewers 审查者用户名列表
   * @param teamReviewers 审查团队名称列表
   */
  async requestPullRequestReviewers(
    owner: string,
    repo: string,
    pullNumber: number,
    reviewers?: string[],
    teamReviewers?: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.pulls.requestReviewers({
        owner,
        repo,
        pull_number: pullNumber,
        reviewers: reviewers || [],
        team_reviewers: teamReviewers || [],
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`请求 PR 审查失败:`, e);
      throw e;
    }
  }

  /**
   * 为 Pull Request 分配用户
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param pullNumber PR 编号
   * @param assignees 用户列表
   */
  async addPullRequestAssignees(
    owner: string,
    repo: string,
    pullNumber: number,
    assignees: string[]
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.issues.addAssignees({
        owner,
        repo,
        issue_number: pullNumber,
        assignees,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`分配 PR 用户失败:`, e);
      throw e;
    }
  }

  /**
   * 创建 Issue/PR 的反应
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue/PR 编号
   * @param content 反应类型（+1/-1/laugh/confused/heart/hooray/rocket/eyes）
   * @returns 返回反应 ID
   */
  async createIssueReaction(
    owner: string,
    repo: string,
    issueNumber: number,
    content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.reactions.createForIssue({
        owner,
        repo,
        issue_number: issueNumber,
        content,
      });
      this.bot.logInfo(`创建 Issue 反应成功，反应数据: ${JSON.stringify(data)}`);
      return data.id;
    } catch (e)
    {
      this.bot.logError(`创建 Issue 反应失败`, e);
      throw e;
    }
  }

  /**
   * 创建 Issue 评论的反应
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param commentId 评论 ID
   * @param content 反应类型（+1/-1/laugh/confused/heart/hooray/rocket/eyes）
   * @returns 返回反应 ID
   */
  async createIssueCommentReaction(
    owner: string,
    repo: string,
    commentId: number,
    content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'
  )
  {
    if (this.checkSilentMode()) return null;

    try
    {
      const { data } = await this.bot.octokit.reactions.createForIssueComment({
        owner,
        repo,
        comment_id: commentId,
        content,
      });
      this.bot.logInfo(`创建评论反应成功，反应数据: ${JSON.stringify(data)}`);
      return data.id;
    } catch (e)
    {
      this.bot.logError(`创建评论反应失败`, e);
      throw e;
    }
  }

  /**
   * 删除 Issue/PR 的反应
   * 注意：只能删除当前认证用户自己创建的反应
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param issueNumber Issue/PR 编号
   * @param reactionId 反应 ID
   */
  async deleteIssueReaction(owner: string, repo: string, issueNumber: number, reactionId: number)
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}', {
        owner,
        repo,
        issue_number: issueNumber,
        reaction_id: reactionId,
      });
      this.bot.logInfo(`删除 Issue 反应成功: ${reactionId}`);
    } catch (e)
    {
      this.bot.logError(`删除 Issue 反应失败: ${reactionId}`, e);
      throw e;
    }
  }

  /**
   * 删除 Issue 评论的反应
   * 注意：只能删除当前认证用户自己创建的反应
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param commentId 评论 ID
   * @param reactionId 反应 ID
   */
  async deleteIssueCommentReaction(owner: string, repo: string, commentId: number, reactionId: number)
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.request('DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}', {
        owner,
        repo,
        comment_id: commentId,
        reaction_id: reactionId,
      });
      this.bot.logInfo(`删除评论反应成功: ${reactionId}`);
    } catch (e)
    {
      this.bot.logError(`删除评论反应失败: ${reactionId}`, e);
      throw e;
    }
  }

  /**
   * 获取仓库的工作流列表
   * @param owner 仓库所有者
   * @param repo 仓库名称
   */
  async listWorkflows(owner: string, repo: string)
  {
    try
    {
      const { data } = await this.bot.octokit.actions.listRepoWorkflows({
        owner,
        repo,
      });
      return data.workflows;
    } catch (e)
    {
      this.bot.logError(`获取工作流列表失败:`, e);
      throw e;
    }
  }

  /**
   * 获取工作流详情
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param workflowId 工作流 ID 或文件名
   */
  async getWorkflow(owner: string, repo: string, workflowId: number | string)
  {
    try
    {
      const { data } = await this.bot.octokit.actions.getWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`获取工作流详情失败:`, e);
      throw e;
    }
  }

  /**
   * 触发工作流运行
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param workflowId 工作流 ID 或文件名
   * @param ref 分支或标签名称
   * @param inputs 工作流输入参数
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    ref: string,
    inputs?: Record<string, string>
  )
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs: inputs || {},
      });
      this.bot.logInfo(`触发工作流成功: ${workflowId}`);
    } catch (e)
    {
      this.bot.logError(`触发工作流失败:`, e);
      throw e;
    }
  }

  /**
   * 获取工作流运行列表
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param workflowId 工作流 ID（可选）
   * @param status 运行状态（可选）
   */
  async listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number | string,
    status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued' | 'requested' | 'waiting'
  )
  {
    try
    {
      const params: any = { owner, repo, per_page: 30 };
      if (workflowId) params.workflow_id = workflowId;
      if (status) params.status = status;

      const { data } = await this.bot.octokit.actions.listWorkflowRuns(params);
      return data.workflow_runs;
    } catch (e)
    {
      this.bot.logError(`获取工作流运行列表失败:`, e);
      throw e;
    }
  }

  /**
   * 获取工作流运行详情
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param runId 运行 ID
   */
  async getWorkflowRun(owner: string, repo: string, runId: number)
  {
    try
    {
      const { data } = await this.bot.octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });
      return data;
    } catch (e)
    {
      this.bot.logError(`获取工作流运行详情失败:`, e);
      throw e;
    }
  }

  /**
   * 取消工作流运行
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param runId 运行 ID
   */
  async cancelWorkflowRun(owner: string, repo: string, runId: number)
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.actions.cancelWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });
      this.bot.logInfo(`取消工作流运行成功: ${runId}`);
    } catch (e)
    {
      this.bot.logError(`取消工作流运行失败:`, e);
      throw e;
    }
  }

  /**
   * 重新运行工作流
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param runId 运行 ID
   */
  async rerunWorkflow(owner: string, repo: string, runId: number)
  {
    if (this.checkSilentMode()) return;

    try
    {
      await this.bot.octokit.actions.reRunWorkflow({
        owner,
        repo,
        run_id: runId,
      });
      this.bot.logInfo(`重新运行工作流成功: ${runId}`);
    } catch (e)
    {
      this.bot.logError(`重新运行工作流失败:`, e);
      throw e;
    }
  }
}
