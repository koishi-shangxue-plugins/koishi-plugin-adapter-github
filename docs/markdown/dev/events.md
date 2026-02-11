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

## 使用示例

### 监听特定事件

```typescript
import { Context } from 'koishi'

export function apply(ctx: Context) {
  // 监听 Issue 被创建事件
  ctx.on('github/issue-opened', (data) => {
    const { owner, repo, issue, actor } = data
    ctx.logger.info(`新 Issue: ${owner}/${repo}#${issue.number}`)
    ctx.logger.info(`标题: ${issue.title}`)
    ctx.logger.info(`创建者: ${actor.login}`)
  })
}
```

### 监听所有 Issue 事件

```typescript
ctx.on('github/issue', (data) => {
  const { owner, repo, issue, action } = data
  ctx.logger.info(`Issue ${action}: ${owner}/${repo}#${issue.number}`)
})
```

### 监听 PR 评论

```typescript
ctx.on('github/pull-request-review-comment', (data) => {
  const { owner, repo, pullRequest, comment, actor } = data
  ctx.logger.info(`PR 评论: ${owner}/${repo}#${pullRequest.number}`)
  ctx.logger.info(`评论者: ${actor.login}`)
  ctx.logger.info(`内容: ${comment.body}`)
})
```

### 监听所有事件

```typescript
ctx.on('github/event', (data) => {
  const { type, owner, repo, action } = data
  ctx.logger.info(`GitHub 事件: ${type} - ${owner}/${repo} (${action})`)
})
```

## 事件过滤

### 按仓库过滤

```typescript
ctx.on('github/issue-opened', (data) => {
  // 只处理特定仓库的事件
  if (data.repoKey === 'koishi-shangxue-plugins/koishi-plugin-adapter-github') {
    // 处理事件
  }
})
```

### 按用户过滤

```typescript
ctx.on('github/issue-comment-created', (data) => {
  // 忽略机器人的评论
  if (data.actor.type === 'Bot') {
    return
  }
  // 处理事件
})
```

### 按标签过滤

```typescript
ctx.on('github/issue-opened', (data) => {
  // 只处理带有特定标签的 Issue
  const labels = data.issue.labels.map(l => l.name)
  if (labels.includes('bug')) {
    // 处理 bug 相关的 Issue
  }
})
```

## 实战案例

### 自动回复新 Issue

```typescript
ctx.on('github/issue-opened', async (data) => {
  const { owner, repo, issue } = data

  // 发送欢迎消息
  const channelId = `${owner}/${repo}:issues:${issue.number}`
  await bot.sendMessage(channelId, '感谢您提交 Issue！我们会尽快处理。')
})
```

### PR 合并通知

```typescript
ctx.on('github/pull-request-closed', (data) => {
  const { pullRequest, owner, repo } = data

  if (pullRequest.merged) {
    ctx.logger.info(`PR 已合并: ${owner}/${repo}#${pullRequest.number}`)
    // 发送通知到其他平台
  }
})
```

### Issue 统计

```typescript
const issueStats = new Map()

ctx.on('github/issue', (data) => {
  const { repoKey, action } = data

  if (!issueStats.has(repoKey)) {
    issueStats.set(repoKey, { opened: 0, closed: 0 })
  }

  const stats = issueStats.get(repoKey)
  if (action === 'opened') stats.opened++
  if (action === 'closed') stats.closed++
})
```

## 注意事项

1. **事件顺序**：事件按时间顺序派发，但网络延迟可能导致顺序略有偏差
2. **重复事件**：在极少数情况下，同一事件可能被派发多次，建议做好幂等性处理
3. **事件丢失**：Pull 模式下，如果轮询间隔过长，可能错过某些事件
4. **性能考虑**：监听 `github/event` 会接收所有事件，注意性能影响
