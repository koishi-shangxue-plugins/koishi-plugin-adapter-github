# API 接口

GitHub 适配器实现了 Koishi 的标准 Bot API，并提供了一些 GitHub 特有的功能。

## 标准消息 API

### sendMessage

发送消息到指定频道。

**签名**：

```typescript
async sendMessage(channelId: string, content: Fragment, guildId?: string): Promise<string[]>
```

**参数**：

- `channelId`: 频道 ID（格式：`owner/repo:type:number`）
- `content`: 消息内容（支持 Satori 元素）
- `guildId`: 群组 ID（可选）

**返回值**：

- 消息 ID 数组

**示例**：

```typescript
// 发送文本消息
await bot.sendMessage('owner/repo:issues:123', '这是一条消息')

// 发送富文本消息
await bot.sendMessage('owner/repo:issues:123', h('p', [
  '这是',
  h('b', '粗体'),
  '文本'
]))
```

**支持的频道类型**：

- `issues` - Issue 评论
- `pull` - PR 评论
- `discussions` - Discussion 评论

---

### getMessage

获取指定消息的详细信息。

**签名**：

```typescript
async getMessage(channelId: string, messageId: string): Promise<Message>
```

**参数**：

- `channelId`: 频道 ID
- `messageId`: 消息 ID

**返回值**：

```typescript
{
  id: string
  content: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: number
}
```

**示例**：

```typescript
const message = await bot.getMessage('owner/repo:issues:123', '456789')
console.log(message.content)
```

---

### editMessage

编辑已发送的消息。

**签名**：

```typescript
async editMessage(channelId: string, messageId: string, content: Fragment): Promise<void>
```

**参数**：

- `channelId`: 频道 ID
- `messageId`: 消息 ID
- `content`: 新的消息内容

**示例**：

```typescript
await bot.editMessage('owner/repo:issues:123', '456789', '修改后的内容')
```

**限制**：

- 只能编辑机器人自己发送的消息
- 仅支持 Issue 和 PR 评论

---

### deleteMessage

删除已发送的消息。

**签名**：

```typescript
async deleteMessage(channelId: string, messageId: string): Promise<void>
```

**参数**：

- `channelId`: 频道 ID
- `messageId`: 消息 ID

**示例**：

```typescript
await bot.deleteMessage('owner/repo:issues:123', '456789')
```

**限制**：

- 只能删除机器人自己发送的消息
- 仅支持 Issue 和 PR 评论

---

## 用户 API

### getUser

获取用户信息。

**签名**：

```typescript
async getUser(userId: string): Promise<Universal.User>
```

**参数**：

- `userId`: GitHub 用户名

**返回值**：

```typescript
{
  id: string        // 用户名
  name: string      // 显示名称
  avatar?: string   // 头像 URL
}
```

**示例**：

```typescript
const user = await bot.getUser('octocat')
console.log(user.name)
```

---

### getLogin

获取当前登录信息。

**签名**：

```typescript
async getLogin(): Promise<Universal.Login>
```

**返回值**：

```typescript
{
  user: Universal.User
  selfId: string
  platform: 'github'
  status: Universal.Status
}
```

**示例**：

```typescript
const login = await bot.getLogin()
console.log(login.selfId)
```

---

## 群组/频道 API

### getGuild

获取群组信息（对应 Issue/PR/Discussion）。

**签名**：

```typescript
async getGuild(guildId: string): Promise<Universal.Guild>
```

**参数**：

- `guildId`: 群组 ID（格式：`owner/repo:type:number`）

**返回值**：

```typescript
{
  id: string
  name: string
}
```

**示例**：

```typescript
const guild = await bot.getGuild('owner/repo:issues:123')
console.log(guild.name)  // [owner/repo] Issue 标题
```

---

### getChannel

获取频道信息。

**签名**：

```typescript
async getChannel(channelId: string, guildId?: string): Promise<Universal.Channel>
```

**参数**：

- `channelId`: 频道 ID
- `guildId`: 群组 ID（可选）

**返回值**：

```typescript
{
  id: string
  name: string
  type: Universal.Channel.Type
}
```

---

### getGuildList

获取群组列表（监听的仓库）。

**签名**：

```typescript
async getGuildList(): Promise<Universal.List<Universal.Guild>>
```

**返回值**：

```typescript
{
  data: Array<{
    id: string      // owner/repo
    name: string    // 仓库全名
  }>
}
```

**示例**：

```typescript
const guilds = await bot.getGuildList()
for (const guild of guilds.data) {
  console.log(guild.name)
}
```

---

### getChannelList

获取频道列表（仓库的 Issues 和 PRs）。

**签名**：

```typescript
async getChannelList(guildId: string): Promise<Universal.List<Universal.Channel>>
```

**参数**：

- `guildId`: 群组 ID（格式：`owner/repo`）

**返回值**：

```typescript
{
  data: Array<{
    id: string      // owner/repo:type:number
    name: string    // Issue/PR 标题
    type: Universal.Channel.Type
  }>
}
```

**示例**：

```typescript
const channels = await bot.getChannelList('owner/repo')
for (const channel of channels.data) {
  console.log(channel.name)
}
```

**限制**：

- 默认只返回前 50 个开放的 Issues 和 PRs
- 不包括 Discussions

---

### createChannel

创建频道（创建 Issue）。

**签名**：

```typescript
async createChannel(guildId: string, data: Partial<Universal.Channel>): Promise<Universal.Channel>
```

**参数**：

- `guildId`: 群组 ID（格式：`owner/repo`）
- `data`: 频道数据
  - `name`: Issue 标题

**返回值**：

```typescript
{
  id: string      // owner/repo:issues:number
  name: string    // Issue 标题
  type: Universal.Channel.Type
}
```

**示例**：

```typescript
const channel = await bot.createChannel('owner/repo', {
  name: '新的 Issue'
})
console.log(channel.id)
```

---

### updateChannel

更新频道（更新 Issue/PR 标题）。

**签名**：

```typescript
async updateChannel(channelId: string, data: Partial<Universal.Channel>): Promise<void>
```

**参数**：

- `channelId`: 频道 ID
- `data`: 更新数据
  - `name`: 新标题

**示例**：

```typescript
await bot.updateChannel('owner/repo:issues:123', {
  name: '更新后的标题'
})
```

---

### deleteChannel

删除频道（关闭 Issue/PR）。

**签名**：

```typescript
async deleteChannel(channelId: string): Promise<void>
```

**参数**：

- `channelId`: 频道 ID

**示例**：

```typescript
await bot.deleteChannel('owner/repo:issues:123')
```

**注意**：

- 此操作会关闭 Issue/PR，而不是真正删除

---

## 注意事项

1. **权限要求**：确保 Token 具有相应的权限
2. **速率限制**：注意 GitHub API 的速率限制
3. **错误处理**：所有 API 调用都可能抛出异常，建议使用 try-catch
4. **异步操作**：所有 API 都是异步的，需要使用 await
