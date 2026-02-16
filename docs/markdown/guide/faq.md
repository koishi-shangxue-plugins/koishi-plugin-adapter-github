# 常见问题

本页面收集了使用 GitHub 适配器时的常见问题和解决方案。

## 安装和配置

### Q: 如何获取 GitHub Token？

A: 请参考 [快速开始](/markdown/guide/start) 中的详细步骤。简要流程：

1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens)
2. 生成 Classic Token
3. 勾选必要的权限（repo, read:user, read:discussion, write:discussion）
4. 复制并保存 Token

### Q: Token 需要哪些权限？

A: 必需的权限：

- `repo` - 访问仓库和创建评论
- `read:user` - 读取用户信息
- `read:discussion` - 读取 Discussions
- `write:discussion` - 发表 Discussion 评论

### Q: 可以同时监听多个仓库吗？

A: 可以。在 Pull 模式下，可以在配置中添加多个仓库：

```json
{
  "mode": "pull",
  "repositories": [
    { "owner": "user1", "repo": "repo1" },
    { "owner": "user2", "repo": "repo2" }
  ]
}
```

:::tip 提示
仓库列表配置仅在 Pull 模式下需要配置。
:::

### Q: 什么是静默模式？

A: 静默模式是一个安全功能，开启后适配器只接收 GitHub 事件，不会向 GitHub 发送任何内容（如评论、回复等）。

适用场景：

- 测试和调试环境
- 只需要监听事件而不需要回复
- 避免误操作的保护模式

配置方法：

```json
{
  "silentMode": true
}
```

详见：[配置说明 - 静默模式](/markdown/guide/config#silentmode)

---

## 通信模式

### Q: Pull 模式和 Webhook 模式有什么区别？

A: 主要区别：

| 特性     | Pull 模式 | Webhook 模式 |
| -------- | --------- | ------------ |
| 公网 IP  | 不需要    | 需要         |
| 实时性   | 较差      | 实时         |
| 事件支持 | 部分受限  | 完整支持     |
| 代理支持 | 支持      | 不支持       |

详见：[Pull 模式](/markdown/mode/pull) 和 [Webhook 模式](/markdown/mode/webhook)

### Q: 如何选择通信模式？

A: 建议：

- **本地开发/内网环境**：使用 Pull 模式
- **生产环境/有公网 IP**：使用 Webhook 模式
- **需要代理访问**：使用 Pull 模式
- **需要 Discussion 事件**：使用 Webhook 模式

### Q: Pull 模式收不到 Discussion 事件？

A: 这是正常的。GitHub Events API 不支持 Discussion 事件，只能通过 Webhook 模式接收。

---

## 连接问题

### Q: 收不到任何消息？

A: 请按以下步骤排查：

1. **检查 Token 权限**
   - 确保 Token 具有必要的权限
   - 尝试重新生成 Token

2. **检查仓库配置**
   - 确认 owner 和 repo 名称正确
   - 确认有权限访问该仓库

3. **检查日志**
   - 开启 `loggerinfo` 选项
   - 查看控制台日志中的错误信息

4. **验证连接**
   - 查看机器人是否成功上线
   - 检查是否有 API 错误

### Q: Webhook 模式无法接收消息？

A: 请检查：

1. **服务器可访问性**
   - 确保服务器有公网 IP
   - 确保端口已开放
   - 尝试访问 `http://你的服务器:端口/github/webhook`

2. **Webhook 配置**
   - 在 GitHub 仓库设置中检查 Webhook 状态
   - 查看 Webhook 推送记录和错误信息
   - 确认 Webhook URL 正确

3. **密钥验证**
   - 确保插件配置的 `webhookSecret` 与 GitHub 配置一致
   - 如果不使用密钥，两边都不要配置

### Q: 代理无法连接？

A: 请检查：

- 代理服务是否正在运行
- 代理端口是否正确
- 代理协议是否正确（http/https）
- 尝试使用 curl 测试代理

详见：[代理配置](/markdown/mode/proxy)

### Q: Pull 模式频繁出现网络错误？

A: 适配器已优化网络错误处理，临时性错误（如 500/502/503、EHOSTUNREACH 等）会自动降级为警告，不会中断服务。

如果频繁出现网络错误，建议：

1. **检查网络连接**：确保网络稳定
2. **配置代理**：如果访问 GitHub 不稳定，可以配置代理
3. **增加轮询间隔**：减少请求频率，降低网络压力
4. **查看日志**：开启 [`loggerinfo`](../guide/config.md#loggerinfo) 查看详细错误信息

详见：[Pull 模式 - 错误处理优化](/markdown/mode/pull#错误处理优化)

---

## API 和功能

### Q: 如何发送消息到 Issue？

A: 使用 `sendMessage` 方法：

```typescript
const channelId = 'owner/repo:issues:123'
await bot.sendMessage(channelId, '消息内容')
```

详见：[API 接口](/markdown/dev/apis)

### Q: 如何监听特定的 GitHub 事件？

A: 使用 `ctx.on` 监听事件：

```typescript
ctx.on('github/issue-opened', (data) => {
  // 处理 Issue 创建事件
})
```

详见：[事件系统](/markdown/dev/events) 和 [监听事件示例](/markdown/dev/listen-events)

### Q: 频道 ID 是什么格式？

A: 频道 ID 格式为：`owner/repo:type:number`

示例：

- Issue: `owner/repo:issues:123`
- PR: `owner/repo:pull:456`
- Discussion: `owner/repo:discussions:789`

详见：[频道 ID 说明](/markdown/dev/channel-id)

---

## 错误处理

### Q: 出现 "API rate limit exceeded" 错误？

A: 这是 GitHub API 速率限制。解决方法：

- **Pull 模式**：增大轮询间隔
- **Webhook 模式**：不受此限制
- 等待配额重置（每小时重置）
- 检查是否有其他程序在使用同一 Token

### Q: 出现 "Bad credentials" 错误？

A: Token 无效或已过期。解决方法：

- 检查 Token 是否正确复制
- 重新生成 Token
- 确认 Token 未被撤销

### Q: 出现 "Not Found" 错误？

A: 仓库不存在或无权访问。解决方法：

- 检查仓库名称是否正确
- 确认 Token 有权限访问该仓库
- 检查仓库是否为私有仓库

### Q: 消息发送失败？

A: 可能的原因：

- **静默模式已开启**：检查 [`silentMode`](../guide/config.md#silentmode) 配置
- Token 权限不足
- 频道 ID 格式错误
- Issue/PR 已关闭或删除
- 网络连接问题

:::tip 提示
如果开启了静默模式，所有发送消息的操作都会被阻止。
:::

---

## 性能优化

### Q: 如何减少 API 请求次数？

A: 建议：

- 增大 Pull 模式的轮询间隔
- 使用 Webhook 模式（不消耗 API 配额）
- 减少监听的仓库数量
- 避免频繁调用 API

### Q: 如何提高实时性？

A: 建议：

- 使用 Webhook 模式
- 减小 Pull 模式的轮询间隔（注意 API 配额）

---

## 其他问题

### Q: 支持 GitHub Enterprise 吗？

A: 目前不支持。适配器使用的是 GitHub.com 的 API。

### Q: 可以监听私有仓库吗？

A: 可以。确保 Token 具有 `repo` 权限即可。

### Q: 如何获取更多帮助？

A: 可以通过以下方式：

- 查看 [GitHub 仓库](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github)
- 提交 [Issue](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github/issues)
- 查看 [Koishi 官方文档](https://koishi.chat/)
