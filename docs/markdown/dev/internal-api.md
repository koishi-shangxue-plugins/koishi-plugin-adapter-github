# GitHub Internal API

GitHub 适配器提供了 `bot.internal` API，用于访问 GitHub 特有的功能。

## Issue 管理

### createIssue

创建 Issue。

```typescript
async bot.internal.createIssue(
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[],
  assignees?: string[]
): Promise<any>
```

| 参数      | 类型     | 必填 | 说明             |
| --------- | -------- | ---- | ---------------- |
| owner     | string   | 是   | 仓库所有者       |
| repo      | string   | 是   | 仓库名称         |
| title     | string   | 是   | Issue 标题       |
| body      | string   | 否   | Issue 内容       |
| labels    | string[] | 否   | 标签列表         |
| assignees | string[] | 否   | 分配给的用户列表 |

```typescript
const issue = await bot.internal.createIssue(
  'owner', 'repo', 'Bug: 登录失败',
  '详细描述...', ['bug', 'priority-high'], ['developer1']
)
```

---

### closeIssue / reopenIssue

关闭或重新打开 Issue。

```typescript
async bot.internal.closeIssue(owner: string, repo: string, issueNumber: number)
async bot.internal.reopenIssue(owner: string, repo: string, issueNumber: number)
```

```typescript
await bot.internal.closeIssue('owner', 'repo', 123)
await bot.internal.reopenIssue('owner', 'repo', 123)
```

---

### addIssueLabels / removeIssueLabel

管理 Issue 标签。

```typescript
async bot.internal.addIssueLabels(owner: string, repo: string, issueNumber: number, labels: string[])
async bot.internal.removeIssueLabel(owner: string, repo: string, issueNumber: number, label: string)
```

```typescript
await bot.internal.addIssueLabels('owner', 'repo', 123, ['bug', 'help-wanted'])
await bot.internal.removeIssueLabel('owner', 'repo', 123, 'bug')
```

---

### addIssueAssignees / removeIssueAssignees

管理 Issue 分配用户。

```typescript
async bot.internal.addIssueAssignees(owner: string, repo: string, issueNumber: number, assignees: string[])
async bot.internal.removeIssueAssignees(owner: string, repo: string, issueNumber: number, assignees: string[])
```

```typescript
await bot.internal.addIssueAssignees('owner', 'repo', 123, ['developer1', 'developer2'])
await bot.internal.removeIssueAssignees('owner', 'repo', 123, ['developer1'])
```

---

## Pull Request 管理

### createPullRequest

创建 Pull Request。

```typescript
async bot.internal.createPullRequest(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
): Promise<any>
```

| 参数  | 类型   | 必填 | 说明                                        |
| ----- | ------ | ---- | ------------------------------------------- |
| owner | string | 是   | 仓库所有者                                  |
| repo  | string | 是   | 仓库名称                                    |
| title | string | 是   | PR 标题                                     |
| head  | string | 是   | 源分支（格式：`用户名:分支名` 或 `分支名`） |
| base  | string | 是   | 目标分支                                    |
| body  | string | 否   | PR 内容                                     |

```typescript
const pr = await bot.internal.createPullRequest(
  'owner', 'repo', 'Feature: 添加新功能',
  'feature-branch', 'main', '详细描述...'
)
```

---

### closePullRequest / mergePullRequest

关闭或合并 Pull Request。

```typescript
async bot.internal.closePullRequest(owner: string, repo: string, pullNumber: number)
async bot.internal.mergePullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  commitTitle?: string,
  commitMessage?: string,
  mergeMethod?: 'merge' | 'squash' | 'rebase'
)
```

**合并方式**：

| 方式   | 说明                       |
| ------ | -------------------------- |
| merge  | 标准合并（保留所有提交）   |
| squash | 压缩合并（合并为单个提交） |
| rebase | 变基合并（线性历史）       |

```typescript
await bot.internal.closePullRequest('owner', 'repo', 456)
await bot.internal.mergePullRequest('owner', 'repo', 456, 'Merge feature', 'Closes #123', 'squash')
```

---

### addPullRequestLabels

为 Pull Request 添加标签。

```typescript
async bot.internal.addPullRequestLabels(owner: string, repo: string, pullNumber: number, labels: string[])
```

```typescript
await bot.internal.addPullRequestLabels('owner', 'repo', 456, ['enhancement'])
```

---

### requestPullRequestReviewers

为 Pull Request 分配审查者。

```typescript
async bot.internal.requestPullRequestReviewers(
  owner: string,
  repo: string,
  pullNumber: number,
  reviewers?: string[],
  teamReviewers?: string[]
)
```

| 参数          | 类型     | 必填 | 说明             |
| ------------- | -------- | ---- | ---------------- |
| reviewers     | string[] | 否   | 审查者用户名列表 |
| teamReviewers | string[] | 否   | 审查团队名称列表 |

```typescript
await bot.internal.requestPullRequestReviewers(
  'owner', 'repo', 456,
  ['reviewer1', 'reviewer2'],
  ['team-leads']
)
```

---

### addPullRequestAssignees

为 Pull Request 分配用户。

```typescript
async bot.internal.addPullRequestAssignees(owner: string, repo: string, pullNumber: number, assignees: string[])
```

```typescript
await bot.internal.addPullRequestAssignees('owner', 'repo', 456, ['developer1'])
```

---

## 反应管理

### createIssueReaction

为 Issue/PR 添加反应。

```typescript
async bot.internal.createIssueReaction(
  owner: string,
  repo: string,
  issueNumber: number,
  content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'
): Promise<number>
```

**支持的反应类型**：

| 类型     | 说明 | Emoji |
| -------- | ---- | ----- |
| +1       | 赞同 | 👍     |
| -1       | 反对 | 👎     |
| laugh    | 大笑 | 😄     |
| confused | 困惑 | 😕     |
| heart    | 喜欢 | ❤️     |
| hooray   | 庆祝 | 🎉     |
| rocket   | 火箭 | 🚀     |
| eyes     | 关注 | 👀     |

```typescript
const reactionId = await bot.internal.createIssueReaction('owner', 'repo', 123, '+1')
```

---

### createIssueCommentReaction

为 Issue 评论添加反应。

```typescript
async bot.internal.createIssueCommentReaction(
  owner: string,
  repo: string,
  commentId: number,
  content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'
): Promise<number>
```

```typescript
const reactionId = await bot.internal.createIssueCommentReaction('owner', 'repo', 789, 'heart')
```

---

### deleteIssueReaction / deleteIssueCommentReaction

删除反应。

```typescript
async bot.internal.deleteIssueReaction(owner: string, repo: string, issueNumber: number, reactionId: number)
async bot.internal.deleteIssueCommentReaction(owner: string, repo: string, commentId: number, reactionId: number)
```

:::warning 注意
只能删除当前认证用户自己创建的反应。
:::

```typescript
await bot.internal.deleteIssueReaction('owner', 'repo', 123, reactionId)
await bot.internal.deleteIssueCommentReaction('owner', 'repo', 789, reactionId)
```
