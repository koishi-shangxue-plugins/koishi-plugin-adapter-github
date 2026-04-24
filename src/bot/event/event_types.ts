import { Session } from 'koishi';

/**
 * GitHub 用户信息简表
 */
export interface GitHubUser
{
  login: string;
  id: number;
  avatar_url: string;
  type: string;
  [key: string]: any;
}

/**
 * GitHub Issue 数据结构
 */
export interface GitHubIssue
{
  url: string;
  id: number;
  number: number;
  title: string;
  user: GitHubUser;
  labels: any[];
  state: string;
  body?: string;
  [key: string]: any;
}

/**
 * GitHub 评论数据结构
 */
export interface GitHubComment
{
  url: string;
  id: number;
  user: GitHubUser;
  body: string;
  [key: string]: any;
}

/**
 * GitHub Pull Request 数据结构
 */
export interface GitHubPullRequest
{
  url: string;
  id: number;
  number: number;
  title: string;
  user: GitHubUser;
  state: string;
  body?: string;
  [key: string]: any;
}

/**
 * GitHub Discussion 数据结构
 */
export interface GitHubDiscussion
{
  id: number;
  number: number;
  title: string;
  user: GitHubUser;
  body: string;
  [key: string]: any;
}

/**
 * GitHub WorkflowRun 数据结构
 */
export interface GitHubWorkflowRun
{
  id: number;
  name: string;
  status: string;
  conclusion: string;
  workflow_id: number;
  [key: string]: any;
}

/**
 * GitHub Workflow 数据结构
 */
export interface GitHubWorkflow
{
  id: number;
  name: string;
  path: string;
  state: string;
  [key: string]: any;
}

/**
 * GitHub WorkflowJob 数据结构
 */
export interface GitHubWorkflowJob
{
  id: number;
  run_id: number;
  status: string;
  conclusion: string;
  name: string;
  [key: string]: any;
}

/**
 * GitHub Commit 数据结构
 */
export interface GitHubCommit
{
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  [key: string]: any;
}

/**
 * GitHub Release 数据结构
 */
export interface GitHubRelease
{
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  [key: string]: any;
}

/**
 * GitHub 事件的基础数据结构
 */
export interface GitHubEventData
{
  /** 仓库所有者 */
  owner: string;
  /** 仓库名称 */
  repo: string;
  /** 仓库全名 (owner/repo) */
  repoKey: string;
  /** 事件触发者 */
  actor: GitHubUser;
  /** 原始负载 */
  payload: any;
  /** GitHub 事件类型 */
  type: string;
  /** 事件动作 (opened, closed, etc.) */
  action: string;
  /** 事件触发的时间戳 */
  timestamp: number;
  /** 机器人 ID */
  botId: string;
  /** 平台名称 (github) */
  platform: string;
}

/**
 * Issue 相关事件负载
 */
export interface GitHubIssueEvent extends GitHubEventData
{
  issue: GitHubIssue;
}

/**
 * Issue 评论相关事件负载
 */
export interface GitHubIssueCommentEvent extends GitHubEventData
{
  issue: GitHubIssue;
  comment: GitHubComment;
}

/**
 * Pull Request 相关事件负载
 */
export interface GitHubPullRequestEvent extends GitHubEventData
{
  pullRequest: GitHubPullRequest;
}

/**
 * Pull Request 评论相关事件负载
 */
export interface GitHubPullRequestReviewCommentEvent extends GitHubEventData
{
  pullRequest: GitHubPullRequest;
  comment: GitHubComment;
}

/**
 * Discussion 相关事件负载
 */
export interface GitHubDiscussionEvent extends GitHubEventData
{
  discussion: GitHubDiscussion;
}

/**
 * Discussion 评论相关事件负载
 */
export interface GitHubDiscussionCommentEvent extends GitHubEventData
{
  discussion: GitHubDiscussion;
  comment: GitHubComment;
}

/**
 * Workflow Run 相关事件负载
 */
export interface GitHubWorkflowRunEvent extends GitHubEventData
{
  workflowRun: GitHubWorkflowRun;
  workflow: GitHubWorkflow;
}

/**
 * Workflow Job 相关事件负载
 */
export interface GitHubWorkflowJobEvent extends GitHubEventData
{
  workflowJob: GitHubWorkflowJob;
}

/**
 * Star 相关事件负载
 */
export interface GitHubStarEvent extends GitHubEventData
{
}

/**
 * Fork 相关事件负载
 */
export interface GitHubForkEvent extends GitHubEventData
{
  /** 被派生的新仓库信息 */
  forkee: any;
}

/**
 * Push 相关事件负载
 */
export interface GitHubPushEvent extends GitHubEventData
{
  /** 引用路径 (refs/heads/master) */
  ref: string;
  /** 推送前的 commit SHA */
  before: string;
  /** 推送后的 commit SHA */
  after: string;
  /** 包含的 commits */
  commits: GitHubCommit[];
  /** 最新的 commit */
  headCommit: GitHubCommit;
}

/**
 * Release 相关事件负载
 */
export interface GitHubReleaseEvent extends GitHubEventData
{
  release: GitHubRelease;
}

declare module 'koishi' {
  interface Events
  {
    /** GitHub 事件：任意事件 */
    'github/event'(payload: GitHubEventData): void;

    /** GitHub 事件：Issue 相关 */
    'github/issue'(payload: GitHubIssueEvent): void;
    'github/issue-opened'(payload: GitHubIssueEvent): void;
    'github/issue-closed'(payload: GitHubIssueEvent): void;
    'github/issue-reopened'(payload: GitHubIssueEvent): void;
    'github/issue-edited'(payload: GitHubIssueEvent): void;
    'github/issue-assigned'(payload: GitHubIssueEvent): void;
    'github/issue-unassigned'(payload: GitHubIssueEvent): void;
    'github/issue-labeled'(payload: GitHubIssueEvent): void;
    'github/issue-unlabeled'(payload: GitHubIssueEvent): void;

    /** GitHub 事件：Issue 评论 */
    'github/issue-comment'(payload: GitHubIssueCommentEvent): void;
    'github/issue-comment-created'(payload: GitHubIssueCommentEvent): void;
    'github/issue-comment-edited'(payload: GitHubIssueCommentEvent): void;
    'github/issue-comment-deleted'(payload: GitHubIssueCommentEvent): void;

    /** GitHub 事件：Pull Request 相关 */
    'github/pull-request'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-opened'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-closed'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-reopened'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-edited'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-assigned'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-unassigned'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-labeled'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-unlabeled'(payload: GitHubPullRequestEvent): void;
    'github/pull-request-synchronize'(payload: GitHubPullRequestEvent): void;

    /** GitHub 事件：Pull Request 评论 */
    'github/pull-request-review-comment'(payload: GitHubPullRequestReviewCommentEvent): void;

    /** GitHub 事件：Discussion 相关 */
    'github/discussion'(payload: GitHubDiscussionEvent): void;
    'github/discussion-created'(payload: GitHubDiscussionEvent): void;
    'github/discussion-closed'(payload: GitHubDiscussionEvent): void;
    'github/discussion-reopened'(payload: GitHubDiscussionEvent): void;
    'github/discussion-edited'(payload: GitHubDiscussionEvent): void;
    'github/discussion-deleted'(payload: GitHubDiscussionEvent): void;

    /** GitHub 事件：Discussion 评论 */
    'github/discussion-comment'(payload: GitHubDiscussionCommentEvent): void;

    /** GitHub 事件：Workflow Run 相关 */
    'github/workflow-run'(payload: GitHubWorkflowRunEvent): void;
    'github/workflow-run-requested'(payload: GitHubWorkflowRunEvent): void;
    'github/workflow-run-completed'(payload: GitHubWorkflowRunEvent): void;
    'github/workflow-run-in_progress'(payload: GitHubWorkflowRunEvent): void;

    /** GitHub 事件：Workflow Job 相关 */
    'github/workflow-job'(payload: GitHubWorkflowJobEvent): void;
    'github/workflow-job-queued'(payload: GitHubWorkflowJobEvent): void;
    'github/workflow-job-in_progress'(payload: GitHubWorkflowJobEvent): void;
    'github/workflow-job-completed'(payload: GitHubWorkflowJobEvent): void;

    /** GitHub 事件：Star 相关 */
    'github/star'(payload: GitHubStarEvent): void;

    /** GitHub 事件：Fork 相关 */
    'github/fork'(payload: GitHubForkEvent): void;

    /** GitHub 事件：Push 相关 */
    'github/push'(payload: GitHubPushEvent): void;

    /** GitHub 事件：Release 相关 */
    'github/release'(payload: GitHubReleaseEvent): void;
    'github/release-published'(payload: GitHubReleaseEvent): void;
    'github/release-unpublished'(payload: GitHubReleaseEvent): void;
    'github/release-created'(payload: GitHubReleaseEvent): void;
    'github/release-edited'(payload: GitHubReleaseEvent): void;
    'github/release-deleted'(payload: GitHubReleaseEvent): void;
    'github/release-prereleased'(payload: GitHubReleaseEvent): void;
    'github/release-released'(payload: GitHubReleaseEvent): void;
  }
}
