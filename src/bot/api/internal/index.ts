import type { GitHubBotComplete } from '../../webhook';
import {
  addIssueAssignees,
  addIssueLabels,
  closeIssue,
  createIssue,
  removeIssueAssignees,
  removeIssueLabel,
  reopenIssue,
} from './issues';
import {
  addPullRequestAssignees,
  addPullRequestLabels,
  closePullRequest,
  createPullRequest,
  mergePullRequest,
  requestPullRequestReviewers,
} from './pulls';
import {
  createIssueCommentReaction,
  createIssueReaction,
  deleteIssueCommentReaction,
  deleteIssueReaction,
} from './reactions';
import { type ReactionContent, type WorkflowRunStatus } from './shared';
import {
  cancelWorkflowRun,
  getWorkflow,
  getWorkflowRun,
  listWorkflowRuns,
  listWorkflows,
  rerunWorkflow,
  triggerWorkflow,
} from './workflows';

export class GitHubInternal
{
  constructor(private bot: GitHubBotComplete) { }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[], assignees?: string[])
  {
    return createIssue(this.bot, owner, repo, title, body, labels, assignees);
  }

  async closeIssue(owner: string, repo: string, issueNumber: number)
  {
    return closeIssue(this.bot, owner, repo, issueNumber);
  }

  async reopenIssue(owner: string, repo: string, issueNumber: number)
  {
    return reopenIssue(this.bot, owner, repo, issueNumber);
  }

  async addIssueLabels(owner: string, repo: string, issueNumber: number, labels: string[])
  {
    return addIssueLabels(this.bot, owner, repo, issueNumber, labels);
  }

  async removeIssueLabel(owner: string, repo: string, issueNumber: number, label: string)
  {
    return removeIssueLabel(this.bot, owner, repo, issueNumber, label);
  }

  async addIssueAssignees(owner: string, repo: string, issueNumber: number, assignees: string[])
  {
    return addIssueAssignees(this.bot, owner, repo, issueNumber, assignees);
  }

  async removeIssueAssignees(owner: string, repo: string, issueNumber: number, assignees: string[])
  {
    return removeIssueAssignees(this.bot, owner, repo, issueNumber, assignees);
  }

  async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string)
  {
    return createPullRequest(this.bot, owner, repo, title, head, base, body);
  }

  async closePullRequest(owner: string, repo: string, pullNumber: number)
  {
    return closePullRequest(this.bot, owner, repo, pullNumber);
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    commitTitle?: string,
    commitMessage?: string,
    mergeMethod?: 'merge' | 'squash' | 'rebase',
  )
  {
    return mergePullRequest(this.bot, owner, repo, pullNumber, commitTitle, commitMessage, mergeMethod);
  }

  async addPullRequestLabels(owner: string, repo: string, pullNumber: number, labels: string[])
  {
    return addPullRequestLabels(this.bot, owner, repo, pullNumber, labels);
  }

  async requestPullRequestReviewers(
    owner: string,
    repo: string,
    pullNumber: number,
    reviewers?: string[],
    teamReviewers?: string[],
  )
  {
    return requestPullRequestReviewers(this.bot, owner, repo, pullNumber, reviewers, teamReviewers);
  }

  async addPullRequestAssignees(owner: string, repo: string, pullNumber: number, assignees: string[])
  {
    return addPullRequestAssignees(this.bot, owner, repo, pullNumber, assignees);
  }

  async createIssueReaction(owner: string, repo: string, issueNumber: number, content: ReactionContent)
  {
    return createIssueReaction(this.bot, owner, repo, issueNumber, content);
  }

  async createIssueCommentReaction(owner: string, repo: string, commentId: number, content: ReactionContent)
  {
    return createIssueCommentReaction(this.bot, owner, repo, commentId, content);
  }

  async deleteIssueReaction(owner: string, repo: string, issueNumber: number, reactionId: number)
  {
    return deleteIssueReaction(this.bot, owner, repo, issueNumber, reactionId);
  }

  async deleteIssueCommentReaction(owner: string, repo: string, commentId: number, reactionId: number)
  {
    return deleteIssueCommentReaction(this.bot, owner, repo, commentId, reactionId);
  }

  async listWorkflows(owner: string, repo: string)
  {
    return listWorkflows(this.bot, owner, repo);
  }

  async getWorkflow(owner: string, repo: string, workflowId: number | string)
  {
    return getWorkflow(this.bot, owner, repo, workflowId);
  }

  async triggerWorkflow(owner: string, repo: string, workflowId: number | string, ref: string, inputs?: Record<string, string>)
  {
    return triggerWorkflow(this.bot, owner, repo, workflowId, ref, inputs);
  }

  async listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number | string,
    status?: WorkflowRunStatus,
  )
  {
    return listWorkflowRuns(this.bot, owner, repo, workflowId, status);
  }

  async getWorkflowRun(owner: string, repo: string, runId: number)
  {
    return getWorkflowRun(this.bot, owner, repo, runId);
  }

  async cancelWorkflowRun(owner: string, repo: string, runId: number)
  {
    return cancelWorkflowRun(this.bot, owner, repo, runId);
  }

  async rerunWorkflow(owner: string, repo: string, runId: number)
  {
    return rerunWorkflow(this.bot, owner, repo, runId);
  }
}
