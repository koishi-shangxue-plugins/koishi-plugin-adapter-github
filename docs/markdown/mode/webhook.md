# Webhook 模式（推送）

Webhook 模式通过 GitHub 的 Webhook 功能实时接收事件推送，提供最佳的实时性和完整的事件支持。

## 工作原理

1. 在 GitHub 仓库中配置 Webhook，指向你的 Koishi 服务器
2. 当仓库发生事件时，GitHub 主动推送事件数据到你的服务器
3. 适配器接收并验证请求，转换为 Koishi 消息并派发

## 前置要求

✅ **公网 IP 或域名** - GitHub 需要能够访问你的服务器

✅ **开放端口** - 确保 Koishi 的端口可以从外网访问

✅ **HTTPS（推荐）** - 生产环境建议使用 HTTPS

## 配置步骤

### 1. 配置插件

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "repositories": [
    {
      "owner": "koishi-shangxue-plugins",
      "repo": "koishi-plugin-adapter-github"
    }
  ],
  "mode": "webhook",
  "webhookPath": "/github/webhook",
  "webhookSecret": "your-secret-key"
}
```

### 2. 在 GitHub 配置 Webhook

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Webhooks** → **Add webhook**
3. 填写配置：

#### Payload URL

```url
http://你的服务器地址:端口/github/webhook
```

示例：

- `http://example.com:5140/github/webhook`
- `https://bot.example.com/github/webhook`

#### Content type

选择 `application/json`

#### Secret

填写你在插件中配置的 `webhookSecret`（强烈推荐）

#### Which events would you like to trigger this webhook?

选择 **Let me select individual events**，勾选：

- ✅ Issues
- ✅ Issue comments
- ✅ Pull requests
- ✅ Pull request reviews
- ✅ Pull request review comments
- ✅ Discussions
- ✅ Discussion comments

1. 点击 **Add webhook** 完成配置

### 3. 验证配置

配置完成后，GitHub 会发送一个测试请求。在 Webhook 设置页面可以看到：

- ✅ 绿色勾号：配置成功
- ❌ 红色叉号：配置失败，点击查看详情

## 配置项说明

### webhookPath

- **类型**: `string`
- **默认值**: `"/github/webhook"`
- **说明**: Webhook 路径

可以自定义路径，例如：

- `/github/webhook`
- `/webhooks/github`
- `/api/github/events`

### webhookSecret

- **类型**: `string`
- **可选**: 是（但强烈推荐）
- **说明**: Webhook 密钥

用于验证请求来源，防止恶意请求。配置后，适配器会验证 GitHub 发送的签名。

:::warning 安全提示
生产环境务必配置 `webhookSecret`，否则任何人都可以向你的服务器发送伪造的事件。
:::

## 优势

✅ **实时性强** - 事件发生后立即推送，延迟极低

✅ **完整事件支持** - 支持所有 GitHub 事件类型

✅ **资源占用少** - 无需定时轮询，节省服务器资源

✅ **无 API 配额限制** - 不消耗 GitHub API 配额

## 限制

⚠️ **需要公网 IP** - 本地开发环境需要使用内网穿透工具

⚠️ **配置复杂** - 需要在 GitHub 配置 Webhook

⚠️ **不支持代理** - Webhook 是被动接收，无法使用代理

## 支持的事件类型

Webhook 模式支持所有 GitHub 事件类型：

✅ **IssuesEvent** - Issue 创建、关闭、重新打开
✅ **IssueCommentEvent** - Issue 评论
✅ **PullRequestEvent** - PR 创建、关闭、重新打开、合并
✅ **PullRequestReviewCommentEvent** - PR 审查评论
✅ **DiscussionEvent** - Discussion 创建、关闭、重新打开
✅ **DiscussionCommentEvent** - Discussion 评论

## 本地开发

本地开发时，可以使用内网穿透工具将本地服务暴露到公网：

### 推荐工具

- [ngrok](https://ngrok.com/)
- [frp](https://github.com/fatedier/frp)
- [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)

### 使用 ngrok 示例

```bash
# 安装 ngrok
npm install -g ngrok

# 启动内网穿透（假设 Koishi 运行在 5140 端口）
ngrok http 5140
```

ngrok 会提供一个公网 URL，例如：

```url
https://abc123.ngrok.io
```

然后在 GitHub Webhook 配置中使用：

```url
https://abc123.ngrok.io/github/webhook
```

## 故障排查

### Webhook 配置失败

1. 检查服务器地址和端口是否正确
2. 检查防火墙是否开放端口
3. 检查 Koishi 是否正常运行
4. 访问 `http://你的服务器:端口/github/webhook` 测试路由是否可访问

### 收不到事件

1. 在 GitHub Webhook 设置页面查看推送记录
2. 检查 `webhookSecret` 是否配置正确
3. 开启 `loggerinfo` 查看详细日志
4. 检查事件类型是否已勾选

### 签名验证失败

1. 确保插件配置的 `webhookSecret` 与 GitHub 配置的一致
2. 检查是否有反向代理修改了请求头
3. 查看日志中的错误信息

## 安全建议

1. ✅ 务必配置 `webhookSecret`
2. ✅ 使用 HTTPS（生产环境）
3. ✅ 定期更换密钥
4. ✅ 监控异常请求
5. ✅ 限制 IP 访问（可选）
