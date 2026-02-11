# Webhook 模式

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

![alt](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github/blob/docs/docs/public/2026-02-11_18-50-53.png?raw=true)

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

  点击 **Add webhook** 完成配置

#### 优势

✅ **实时性强** - 事件发生后立即推送，延迟极低

✅ **完整事件支持** - 支持所有 GitHub 事件类型

✅ **资源占用少** - 无需定时轮询，节省服务器资源

✅ **无 API 配额限制** - 不消耗 GitHub API 配额

#### 限制

⚠️ **需要公网 IP** - 本地开发环境需要使用内网穿透工具

⚠️ **配置复杂** - 需要在 GitHub 配置 Webhook

⚠️ **不支持代理** - Webhook 是被动接收，无法使用代理

## 支持的事件类型

Webhook 模式支持所有 GitHub 事件类型：

- ✅ **IssuesEvent** - Issue 创建、关闭、重新打开
- ✅ **IssueCommentEvent** - Issue 评论
- ✅ **PullRequestEvent** - PR 创建、关闭、重新打开、合并
- ✅ **PullRequestReviewCommentEvent** - PR 审查评论
- ✅ **DiscussionEvent** - Discussion 创建、关闭、重新打开
- ✅ **DiscussionCommentEvent** - Discussion 评论
