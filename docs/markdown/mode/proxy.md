# 代理配置

在 Pull 模式下，GitHub 适配器支持通过代理访问 GitHub API，适合需要通过代理访问外网的环境。

## 适用场景

✅ 服务器位于内网，需要通过代理访问 GitHub

✅ 需要使用特定的网络出口

✅ 使用科学上网工具访问 GitHub

:::warning 注意
代理配置仅在 **Pull 模式** 下生效，Webhook 模式不支持代理。
:::

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
  "interval": 30,
  "useProxy": true,
  "proxyUrl": "http://localhost:7890"
}
```

## 支持的代理协议

### HTTP 代理

```json
{
  "proxyUrl": "http://localhost:7890"
}
```

### HTTPS 代理

```json
{
  "proxyUrl": "https://proxy.example.com:8080"
}
```

## 故障排查

### 连接超时

**可能原因**：

1. 代理服务未运行
2. 代理端口配置错误
3. 防火墙阻止连接

**解决方法**：

1. 检查代理工具是否正常运行
2. 确认代理端口号是否正确
3. 检查防火墙设置

### 代理认证失败

**可能原因**：
代理服务器需要认证，但未提供用户名密码

**解决方法**：
在代理 URL 中包含认证信息：

```json
{
  "proxyUrl": "http://username:password@localhost:7890"
}
```

### SSL 证书错误

**可能原因**：
代理服务器的 SSL 证书问题

**解决方法**：

1. 使用 HTTP 代理而非 HTTPS
2. 检查代理工具的证书配置
