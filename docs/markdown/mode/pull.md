# Pull 模式（轮询）

Pull 模式通过定时轮询 GitHub API 来获取仓库事件，适合没有公网 IP 或无法配置 Webhook 的场景。

## 工作原理

1. 适配器启动时，获取每个仓库的最新事件 ID
2. 按照配置的轮询间隔，定时调用 GitHub Events API
3. 比对事件 ID，只处理新产生的事件
4. 将事件转换为 Koishi 消息并派发

## 配置示例

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "repositories": [
    {
      "owner": "koishi-shangxue-plugins",
      "repo": "koishi-plugin-adapter-github"
    }
  ],
  "mode": "pull",
  "interval": 30
}
```

## 配置项说明

### interval

- **类型**: `number`
- **默认值**: `20`
- **单位**: 秒
- **说明**: 轮询间隔

建议根据实际需求调整：

- **开发测试**: 10-20 秒（快速响应）
- **生产环境**: 30-60 秒（平衡实时性和 API 配额）
- **低频仓库**: 60-300 秒（节省 API 配额）

## 优势

✅ **无需公网 IP** - 适合本地开发和内网环境

✅ **支持代理** - 可配置 HTTP/HTTPS 代理访问 GitHub

✅ **配置简单** - 无需在 GitHub 配置 Webhook

✅ **多仓库友好** - 可同时监听多个仓库

## 限制

⚠️ **实时性较差** - 取决于轮询间隔，最快也有延迟

⚠️ **API 配额限制** - 频繁轮询会消耗 GitHub API 配额

⚠️ **部分事件受限** - 某些事件类型可能无法通过 Events API 获取

## API 配额说明

GitHub API 对请求频率有限制：

- **认证请求**: 5000 次/小时
- **未认证请求**: 60 次/小时

### 配额计算

假设监听 N 个仓库，轮询间隔为 T 秒：

```log
每小时请求次数 = (3600 / T) × N
```

示例：

- 监听 1 个仓库，间隔 30 秒：120 次/小时
- 监听 5 个仓库，间隔 60 秒：300 次/小时

:::tip 提示
可以通过 GitHub API 响应头查看剩余配额：

- `X-RateLimit-Limit`: 总配额
- `X-RateLimit-Remaining`: 剩余配额
- `X-RateLimit-Reset`: 重置时间
:::

## 支持的事件类型

Pull 模式通过 [GitHub Events API](https://docs.github.com/en/rest/activity/events) 获取事件，支持以下类型：

✅ **IssuesEvent** - Issue 创建、关闭、重新打开
✅ **IssueCommentEvent** - Issue 评论
✅ **PullRequestEvent** - PR 创建、关闭、重新打开
✅ **PullRequestReviewCommentEvent** - PR 审查评论
❌ **DiscussionEvent** - Discussion 事件（API 不支持）
❌ **DiscussionCommentEvent** - Discussion 评论（API 不支持）

:::warning 注意
如果需要完整的 Discussion 事件支持，请使用 [Webhook 模式](/markdown/mode/webhook)。
:::

## 代理配置

Pull 模式支持通过代理访问 GitHub API，详见 [代理配置](/markdown/mode/proxy)。

## 故障排查

### 收不到事件

1. 检查 Token 权限是否正确
2. 检查仓库配置是否正确
3. 开启 `loggerinfo` 查看详细日志
4. 检查 API 配额是否耗尽

### 事件延迟严重

1. 减小轮询间隔（注意 API 配额）
2. 考虑切换到 Webhook 模式

### API 配额耗尽

1. 增大轮询间隔
2. 减少监听的仓库数量
3. 等待配额重置（每小时重置一次）
