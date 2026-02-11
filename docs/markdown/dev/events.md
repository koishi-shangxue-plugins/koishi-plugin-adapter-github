# 事件系统

GitHub 适配器除了标准的 Koishi 消息事件外，还提供了 GitHub 特有的事件系统，方便其他插件监听特定的 GitHub 操作。

## 事件类型

### Issue 相关事件

#### `github/issue`

所有 Issue 事件的通用事件。

**事件数据**：

```typescript
{
  owner: string          // 仓库所有者
  repo: string           // 仓库名称
  repoKey: string        // 完整仓库标识 (owner/repo)
  actor: object          // 触发事件的用户信息
  issue: object          // Issue 对象
  action: string         // 事件动作 (opened, closed, reopened)
  timestamp: number      // 事件时间戳
}
```

#### `github/issue-opened`

Issue 被创建时触发。

#### `github/issue-closed`

Issue 被关闭时触发。

#### `github/issue-reopened`

Issue 被重新打开时触发。

---

### Issue 评论相关事件

#### `github/issue-comment`

所有 Issue 评论事件的通用事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  issue: object          // Issue 对象
  comment: object        // 评论对象
  action: string         // 事件动作 (created, edited, deleted)
  timestamp: number
}
```

#### `github/issue-comment-created`

Issue 评论被创建时触发。

---

### Pull Request 相关事件

#### `github/pull-request`

所有 PR 事件的通用事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  pullRequest: object    // PR 对象
  action: string         // 事件动作 (opened, closed, reopened)
  timestamp: number
}
```

#### `github/pull-request-opened`

PR 被创建时触发。

#### `github/pull-request-closed`

PR 被关闭时触发（包括合并）。

#### `github/pull-request-reopened`

PR 被重新打开时触发。

---

### PR 审查评论事件

#### `github/pull-request-review-comment`

PR 审查评论事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  pullRequest: object    // PR 对象
  comment: object        // 评论对象
  timestamp: number
}
```

---

### Discussion 相关事件

:::warning 注意
Discussion 事件仅在 **Webhook 模式** 下支持，Pull 模式无法获取这些事件。
:::

#### `github/discussion`

所有 Discussion 事件的通用事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  discussion: object     // Discussion 对象
  action: string         // 事件动作 (created, closed, reopened)
  timestamp: number
}
```

#### `github/discussion-created`

Discussion 被创建时触发。

---

### Discussion 评论事件

#### `github/discussion-comment`

Discussion 评论事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  discussion: object     // Discussion 对象
  comment: object        // 评论对象
  timestamp: number
}
```

---

### Star 事件

:::warning 注意
Star 事件在不同模式下的支持情况：

- **Webhook 模式**：完整支持 star/unstar 事件
- **Pull 模式**：仅自己拥有的仓库可以通过 Events API 获取 star 事件
- 别人的仓库无法通过 Notifications API 获取 star 事件（GitHub 限制）
:::

#### `github/star`

Star 事件（添加或取消 star）。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object          // 触发事件的用户信息
  action: string         // 事件动作 (started=添加star, deleted=取消star)
  type: string           // 'WatchEvent'
  payload: object        // 原始事件载荷
  timestamp: number
}
```

**示例**：

```typescript
ctx.on('github/star', (eventData) => {
  const { owner, repo, actor, action } = eventData
  if (action === 'started') {
    console.log(`${actor.login} 给 ${owner}/${repo} 添加了 star`)
  } else if (action === 'deleted') {
    console.log(`${actor.login} 取消了 ${owner}/${repo} 的 star`)
  }
})
```

---

### Fork 事件

:::warning 注意
Fork 事件在不同模式下的支持情况：

- **Webhook 模式**：完整支持 fork 事件
- **Pull 模式**：仅自己拥有的仓库可以通过 Events API 获取 fork 事件
- 别人的仓库无法通过 Notifications API 获取 fork 事件（GitHub 限制）
:::

#### `github/fork`

Fork 事件（仓库被 fork）。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object          // 触发事件的用户信息
  forkee: object         // Fork 后的仓库信息
  type: string           // 'ForkEvent'
  payload: object        // 原始事件载荷
  timestamp: number
}
```

**示例**：

```typescript
ctx.on('github/fork', (eventData) => {
  const { owner, repo, actor, forkee } = eventData
  console.log(`${actor.login} fork 了 ${owner}/${repo}`)
  console.log(`新仓库地址: ${forkee.html_url}`)
})
```

---

### Workflow 事件

:::warning 注意
Workflow 事件仅在 **Webhook 模式** 下支持，Pull 模式无法获取这些事件。
:::

#### `github/workflow-run`

Workflow 运行事件的通用事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object          // 触发事件的用户信息
  workflowRun: object    // Workflow 运行对象
  workflow: object       // Workflow 对象
  action: string         // 事件动作 (requested, in_progress, completed)
  type: string           // 'WorkflowRunEvent'
  payload: object        // 原始事件载荷
  timestamp: number
}
```

#### `github/workflow-run-{action}`

特定动作的 Workflow 运行事件。

**支持的动作**：

- `requested` - Workflow 被请求运行
- `in_progress` - Workflow 正在运行
- `completed` - Workflow 运行完成

**示例**：

```typescript
// 监听所有 workflow 运行事件
ctx.on('github/workflow-run', (eventData) => {
  const { owner, repo, workflowRun, action } = eventData
  console.log(`Workflow ${workflowRun.name} 状态: ${action}`)
})

// 监听 workflow 完成事件
ctx.on('github/workflow-run-completed', (eventData) => {
  const { workflowRun } = eventData
  console.log(`Workflow 完成，结论: ${workflowRun.conclusion}`)
})
```

---

#### `github/workflow-job`

Workflow Job 事件的通用事件。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object          // 触发事件的用户信息
  workflowJob: object    // Workflow Job 对象
  action: string         // 事件动作 (queued, in_progress, completed)
  type: string           // 'WorkflowJobEvent'
  payload: object        // 原始事件载荷
  timestamp: number
}
```

#### `github/workflow-job-{action}`

特定动作的 Workflow Job 事件。

**支持的动作**：

- `queued` - Job 进入队列
- `in_progress` - Job 正在运行
- `completed` - Job 运行完成

**示例**：

```typescript
// 监听所有 workflow job 事件
ctx.on('github/workflow-job', (eventData) => {
  const { owner, repo, workflowJob, action } = eventData
  console.log(`Job ${workflowJob.name} 状态: ${action}`)
})

// 监听 job 完成事件
ctx.on('github/workflow-job-completed', (eventData) => {
  const { workflowJob } = eventData
  console.log(`Job 完成，结论: ${workflowJob.conclusion}`)
})
```

---

### 通用事件

#### `github/event`

所有 GitHub 事件的通用事件，包含上述所有类型。

**事件数据**：

```typescript
{
  owner: string
  repo: string
  repoKey: string
  actor: object
  payload: object        // 原始事件载荷
  type: string           // 事件类型
  action: string         // 事件动作
  timestamp: number
}
```
