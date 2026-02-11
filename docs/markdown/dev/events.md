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
