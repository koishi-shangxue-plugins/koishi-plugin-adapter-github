# 监听 GitHub 事件

本页面提供了监听和处理 GitHub 事件的实用示例。

## 基础示例

### 监听所有消息

```typescript
import { Context } from 'koishi'

export function apply(ctx: Context) {
  ctx.on('message', (session) => {
    const { content, channelId, userId } = session
    ctx.logger.info(`收到消息: ${content}`)
    ctx.logger.info(`频道: ${channelId}`)
    ctx.logger.info(`用户: ${userId}`)
  })
}
```

### 自动回复

```typescript
ctx.on('message', async (session) => {
  if (session.content.includes('你好')) {
    await session.send('你好！有什么可以帮助你的吗？')
  }
})
```

## GitHub 特殊事件

### 监听 Issue 创建

```typescript
ctx.on('github/issue-opened', async (data) => {
  const { owner, repo, issue, actor } = data

  ctx.logger.info(`新 Issue: ${owner}/${repo}#${issue.number}`)
  ctx.logger.info(`标题: ${issue.title}`)
  ctx.logger.info(`创建者: ${actor.login}`)

  // 自动回复欢迎消息
  const channelId = `${owner}/${repo}:issues:${issue.number}`
  await bot.sendMessage(channelId, '感谢您提交 Issue！我们会尽快处理。')
})
```

### 监听 PR 合并

```typescript
ctx.on('github/pull-request-closed', (data) => {
  const { pullRequest, owner, repo, actor } = data

  if (pullRequest.merged) {
    ctx.logger.info(`PR 已合并: ${owner}/${repo}#${pullRequest.number}`)
    ctx.logger.info(`合并者: ${actor.login}`)

    // 发送通知到其他平台
    // ...
  }
})
```

### 监听 Issue 评论

```typescript
ctx.on('github/issue-comment-created', async (data) => {
  const { owner, repo, issue, comment, actor } = data

  ctx.logger.info(`新评论: ${owner}/${repo}#${issue.number}`)
  ctx.logger.info(`评论者: ${actor.login}`)
  ctx.logger.info(`内容: ${comment.body}`)
})
```

## 实战案例

### 自动标签管理

根据 Issue 内容自动添加标签：

```typescript
ctx.on('github/issue-opened', async (data) => {
  const { owner, repo, issue } = data
  const content = `${issue.title} ${issue.body}`.toLowerCase()

  const labels = []
  if (content.includes('bug')) labels.push('bug')
  if (content.includes('feature')) labels.push('enhancement')
  if (content.includes('help')) labels.push('question')

  if (labels.length > 0) {
    // 使用 GitHub API 添加标签
    // await bot.octokit.issues.addLabels({ owner, repo, issue_number: issue.number, labels })
  }
})
```

### Issue 统计

统计每个仓库的 Issue 数量：

```typescript
const issueStats = new Map<string, { opened: number, closed: number }>()

ctx.on('github/issue', (data) => {
  const { repoKey, action } = data

  if (!issueStats.has(repoKey)) {
    issueStats.set(repoKey, { opened: 0, closed: 0 })
  }

  const stats = issueStats.get(repoKey)!
  if (action === 'opened') stats.opened++
  if (action === 'closed') stats.closed++
})

// 定时输出统计信息
ctx.setInterval(() => {
  for (const [repo, stats] of issueStats) {
    ctx.logger.info(`${repo}: 打开 ${stats.opened}, 关闭 ${stats.closed}`)
  }
}, 3600000) // 每小时
```

### 关键词提醒

当 Issue 或评论包含特定关键词时发送提醒：

```typescript
const keywords = ['紧急', 'urgent', '严重', 'critical']

ctx.on('github/issue-opened', async (data) => {
  const { issue, owner, repo } = data
  const content = `${issue.title} ${issue.body}`.toLowerCase()

  for (const keyword of keywords) {
    if (content.includes(keyword)) {
      ctx.logger.warn(`⚠️ 紧急 Issue: ${owner}/${repo}#${issue.number}`)
      // 发送通知到其他平台
      break
    }
  }
})

ctx.on('github/issue-comment-created', async (data) => {
  const { comment, issue, owner, repo } = data
  const content = comment.body.toLowerCase()

  for (const keyword of keywords) {
    if (content.includes(keyword)) {
      ctx.logger.warn(`⚠️ 紧急评论: ${owner}/${repo}#${issue.number}`)
      break
    }
  }
})
```

### PR 审查提醒

当 PR 收到审查评论时提醒相关人员：

```typescript
ctx.on('github/pull-request-review-comment', async (data) => {
  const { pullRequest, comment, actor, owner, repo } = data

  ctx.logger.info(`PR 审查评论: ${owner}/${repo}#${pullRequest.number}`)
  ctx.logger.info(`评论者: ${actor.login}`)

  // 提醒 PR 作者
  const author = pullRequest.user.login
  if (author !== actor.login) {
    ctx.logger.info(`提醒 ${author} 查看评论`)
    // 发送通知
  }
})
```

## 事件过滤

### 按仓库过滤

```typescript
const targetRepo = 'koishi-shangxue-plugins/koishi-plugin-adapter-github'

ctx.on('github/issue-opened', (data) => {
  if (data.repoKey === targetRepo) {
    // 只处理特定仓库的事件
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

  // 只处理特定用户的评论
  if (data.actor.login === 'specific-user') {
    // 处理事件
  }
})
```

### 按标签过滤

```typescript
ctx.on('github/issue-opened', (data) => {
  const labels = data.issue.labels.map(l => l.name)

  // 只处理带有 bug 标签的 Issue
  if (labels.includes('bug')) {
    // 处理 bug Issue
  }
})
```

## 组合使用

### 智能回复机器人

```typescript
export function apply(ctx: Context) {
  // 监听 Issue 评论
  ctx.on('message', async (session) => {
    const { content, channelId } = session

    // 检查是否是 Issue 频道
    if (!channelId.includes(':issues:')) return

    // 简单的关键词回复
    if (content.includes('如何安装')) {
      await session.send('请参考文档：https://...')
    } else if (content.includes('报错')) {
      await session.send('请提供完整的错误日志和环境信息。')
    }
  })

  // 监听新 Issue
  ctx.on('github/issue-opened', async (data) => {
    const { issue, owner, repo } = data
    const channelId = `${owner}/${repo}:issues:${issue.number}`

    // 发送欢迎消息
    await bot.sendMessage(channelId,
      '感谢您提交 Issue！\n\n' +
      '为了更快地解决问题，请确保提供：\n' +
      '1. 详细的问题描述\n' +
      '2. 复现步骤\n' +
      '3. 环境信息\n' +
      '4. 错误日志'
    )
  })
}
```

## 注意事项

1. **避免死循环**：不要让机器人回复自己的消息
2. **性能考虑**：避免在事件处理中执行耗时操作
3. **错误处理**：使用 try-catch 捕获异常
4. **速率限制**：注意 GitHub API 的速率限制
