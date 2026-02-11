# 频道 ID 说明

在 GitHub 适配器中，频道 ID 用于标识 Issue、Pull Request 或 Discussion。

## 频道 ID 格式

频道 ID 由三部分组成，使用冒号 `:` 分隔：

```bash
{owner}/{repo}:{type}:{number}
```

### 组成部分

- **owner**: 仓库所有者（用户名或组织名）
- **repo**: 仓库名称
- **type**: 类型标识
  - `issues` - Issue
  - `pull` - Pull Request
  - `discussions` - Discussion
- **number**: Issue/PR/Discussion 的编号

## 示例

### Issue 频道

```bash
koishi-shangxue-plugins/koishi-plugin-adapter-github:issues:123
```

表示：

- 仓库：`koishi-shangxue-plugins/koishi-plugin-adapter-github`
- 类型：Issue
- 编号：123

### PR 频道

```bash
koishi-shangxue-plugins/koishi-plugin-adapter-github:pull:456
```

表示：

- 仓库：`koishi-shangxue-plugins/koishi-plugin-adapter-github`
- 类型：Pull Request
- 编号：456

### Discussion 频道

```bash
koishi-shangxue-plugins/koishi-plugin-adapter-github:discussions:789
```

表示：

- 仓库：`koishi-shangxue-plugins/koishi-plugin-adapter-github`
- 类型：Discussion
- 编号：789

## 使用场景

### 发送消息

```typescript
const channelId = 'owner/repo:issues:123'
await bot.sendMessage(channelId, '这是一条消息')
```

### 监听特定频道

```typescript
ctx.on('message', (session) => {
  if (session.channelId === 'owner/repo:issues:123') {
    // 处理特定 Issue 的消息
  }
})
```

### 解析频道 ID

```typescript
function parseChannelId(channelId: string) {
  const parts = channelId.split(':')
  if (parts.length !== 3) return null

  const [repoPrefix, type, numberStr] = parts
  const [owner, repo] = repoPrefix.split('/')
  const number = parseInt(numberStr)

  if (isNaN(number) || !owner || !repo) return null

  return { owner, repo, type, number }
}

// 使用示例
const parsed = parseChannelId('owner/repo:issues:123')
console.log(parsed)
// { owner: 'owner', repo: 'repo', type: 'issues', number: 123 }
```

## 群组 ID

群组 ID 与频道 ID 相同，都使用 `owner/repo:type:number` 格式。

在某些 API 中，也可以使用简化的仓库标识：

```bash
owner/repo
```

例如：

```typescript
// 获取仓库的所有频道
const channels = await bot.getChannelList('owner/repo')
```

## 注意事项

1. **大小写敏感**：仓库所有者和名称区分大小写
2. **编号唯一性**：同一仓库内，Issue 和 PR 的编号是共享的
3. **类型区分**：Issue 和 PR 使用不同的类型标识（`issues` vs `pull`）
4. **格式验证**：在使用前建议验证频道 ID 格式是否正确
