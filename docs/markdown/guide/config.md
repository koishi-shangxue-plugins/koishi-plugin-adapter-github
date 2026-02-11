# 配置说明

本页面详细介绍 GitHub 适配器的所有配置项。

## 基础设置

### token

- **类型**: `string`
- **必填**: 是
- **说明**: GitHub Personal Access Token (PAT)

用于认证 GitHub API 请求。请确保 Token 具有以下权限：

- `repo` - 访问仓库
- `read:user` - 读取用户信息
- `read:discussion` - 读取 Discussions
- `write:discussion` - 发表和修改 Discussions

### repositories

- **类型**: `Array<{ owner: string, repo: string }>`
- **必填**: 是
- **说明**: 监听的仓库列表

配置示例：

```json
{
  "repositories": [
    {
      "owner": "koishi-shangxue-plugins",
      "repo": "koishi-plugin-adapter-github"
    },
    {
      "owner": "koishijs",
      "repo": "koishi"
    }
  ]
}
```

:::tip 提示
可以同时监听多个仓库，适配器会自动处理所有仓库的事件。
:::

## 通信模式选择

### mode

- **类型**: `'webhook' | 'pull'`
- **默认值**: `'pull'`
- **说明**: 通信模式

两种模式的对比：

| 特性     | Pull 模式              | Webhook 模式 |
| -------- | ---------------------- | ------------ |
| 公网 IP  | 不需要                 | 需要         |
| 实时性   | 较差（取决于轮询间隔） | 实时         |
| 事件支持 | 部分受限               | 完整支持     |
| 代理支持 | 支持                   | 不支持       |
| 配置难度 | 简单                   | 中等         |

## Pull 模式配置

当 `mode` 设置为 `'pull'` 时，以下配置项生效：

### interval

- **类型**: `number`
- **默认值**: `20`
- **单位**: 秒
- **说明**: 轮询间隔

建议值：

- 开发测试：10-20 秒
- 生产环境：30-60 秒

:::warning 注意
轮询间隔过短可能导致 API 请求频率过高，触发 GitHub 的速率限制。
:::

### useProxy

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用代理

### proxyUrl

- **类型**: `string`
- **默认值**: `"http://localhost:7897"`
- **说明**: 代理地址
- **生效条件**: `useProxy` 为 `true`

支持的代理协议：

- HTTP: `http://host:port`
- HTTPS: `https://host:port`

配置示例：

```json
{
  "mode": "pull",
  "interval": 30,
  "useProxy": true,
  "proxyUrl": "http://localhost:7890"
}
```

## Webhook 模式配置

当 `mode` 设置为 `'webhook'` 时，以下配置项生效：

### webhookPath

- **类型**: `string`
- **默认值**: `"/github/webhook"`
- **说明**: Webhook 路径

完整的 Webhook URL 格式：

```url
http://你的服务器地址:端口/github/webhook
```

### webhookSecret

- **类型**: `string`
- **可选**: 是
- **说明**: Webhook 密钥

用于验证 GitHub 发送的请求是否合法。强烈建议在生产环境中配置此项。

配置示例：

```json
{
  "mode": "webhook",
  "webhookPath": "/github/webhook",
  "webhookSecret": "your-secret-key"
}
```

## 调试设置

### loggerinfo

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 日志调试模式

开启后会输出详细的调试日志，包括：

- 接收到的事件详情
- API 请求和响应
- 错误堆栈信息

:::tip 提示
在遇到问题时，建议开启此选项以获取更多调试信息。
:::

## 完整配置示例

### Pull 模式示例

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
  "interval": 30,
  "useProxy": true,
  "proxyUrl": "http://localhost:7890",
  "loggerinfo": false
}
```

### Webhook 模式示例

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
  "webhookSecret": "your-secret-key",
  "loggerinfo": false
}
```
