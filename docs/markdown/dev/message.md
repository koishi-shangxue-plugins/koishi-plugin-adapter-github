# 消息处理

GitHub 适配器会将 GitHub 事件转换为 Koishi 消息，并自动处理 Markdown 格式。

## 消息转换

### Issue 评论

当 Issue 收到新评论时，适配器会：

1. 提取评论内容（Markdown 格式）
2. 转换为 Koishi 消息元素
3. 派发到对应的频道

**频道 ID 格式**：

```bash
{owner}/{repo}:issues:{issue_number}
```

示例：

```bash
koishi-shangxue-plugins/koishi-plugin-adapter-github:issues:123
```

### PR 评论

PR 评论的处理方式与 Issue 类似。

**频道 ID 格式**：

```bash
{owner}/{repo}:pull:{pr_number}
```

### Discussion 评论

Discussion 评论的处理方式与 Issue 类似。

**频道 ID 格式**：

```bash
{owner}/{repo}:discussions:{discussion_number}
```

## Markdown 解析

GitHub 使用 Markdown 格式，适配器会自动将其转换为 Koishi 的消息元素。

### 支持的元素

#### 文本样式

| Markdown     | 转换结果   |
| ------------ | ---------- |
| `**粗体**`   | 粗体文本   |
| `*斜体*`     | 斜体文本   |
| `~~删除线~~` | 删除线文本 |
| `` `代码` `` | 行内代码   |

#### 链接

```markdown
[链接文本](https://example.com)
```

转换为 Koishi 的 `<a>` 元素。

#### 图片

```markdown
![图片描述](https://example.com/image.png)
```

转换为 Koishi 的 `<img>` 元素。

#### 代码块

````markdown
```javascript
console.log('Hello World')
```
````

转换为 Koishi 的 `<code>` 元素。

#### 引用

```markdown
> 这是引用内容
```

转换为 Koishi 的 `<quote>` 元素。

#### 列表

```markdown
- 项目 1
- 项目 2
- 项目 3
```

转换为文本格式（保留结构）。

## 发送消息

### 使用标准 API

```typescript
// 发送消息到 Issue
const channelId = 'owner/repo:issues:123'
await bot.sendMessage(channelId, '这是一条消息')
```

### 使用 Satori 元素

```typescript
import { h } from 'koishi'

// 发送富文本消息
await bot.sendMessage(channelId, h('p', [
  '这是',
  h('b', '粗体'),
  '文本'
]))
```

### 发送图片

```typescript
// 通过 URL
await bot.sendMessage(channelId, h.image('https://example.com/image.png'))

// 通过本地文件
await bot.sendMessage(channelId, h.image('file:///path/to/image.png'))
```

## 消息 ID

每条消息都有唯一的 ID，用于标识和引用。

### ID 格式

- **Issue 评论**: 评论的 ID（数字）
- **PR 评论**: 评论的 ID（数字）
- **Discussion 评论**: 评论的 ID（数字）
- **Issue 事件**: `"issue"`
- **PR 事件**: `"pull"`
- **Discussion 事件**: `"discussion"`

### 获取消息 ID

```typescript
ctx.on('message', (session) => {
  const messageId = session.messageId
  ctx.logger.info(`收到消息: ${messageId}`)
})
```

## 注意事项

1. **Markdown 限制**：某些复杂的 Markdown 语法可能无法完美转换
2. **图片大小**：GitHub 对图片大小有限制
3. **消息长度**：GitHub API 对评论长度有限制（最大 65536 字符）
4. **频率限制**：注意 GitHub API 的速率限制
