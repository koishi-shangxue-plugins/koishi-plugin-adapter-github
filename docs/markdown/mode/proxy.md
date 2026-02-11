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

## 配置项说明

### useProxy

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用代理

### proxyUrl

- **类型**: `string`
- **默认值**: `"http://localhost:7897"`
- **说明**: 代理服务器地址
- **生效条件**: `useProxy` 为 `true`

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

## 常见代理工具配置

### Clash

Clash 默认代理端口：

- HTTP: `7890`
- SOCKS5: `7891`

配置示例：

```json
{
  "useProxy": true,
  "proxyUrl": "http://localhost:7890"
}
```

### V2Ray

V2Ray 默认代理端口：

- HTTP: `10809`
- SOCKS5: `10808`

配置示例：

```json
{
  "useProxy": true,
  "proxyUrl": "http://localhost:10809"
}
```

### Shadowsocks

Shadowsocks 通常需要配合 HTTP 代理工具使用，如 Privoxy。

配置示例：

```json
{
  "useProxy": true,
  "proxyUrl": "http://localhost:8118"
}
```

## 验证代理配置

### 1. 检查代理是否运行

确保你的代理工具正在运行，并且监听在配置的端口上。

### 2. 测试代理连接

可以使用 curl 测试代理是否可用：

```bash
# Windows (PowerShell)
curl -x http://localhost:7890 https://api.github.com

# Linux/macOS
curl -x http://localhost:7890 https://api.github.com
```

如果返回 GitHub API 响应，说明代理配置正确。

### 3. 查看日志

开启 `loggerinfo` 选项，查看适配器是否通过代理成功连接：

```json
{
  "loggerinfo": true
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

## 性能优化

### 选择合适的代理服务器

- 优先选择地理位置较近的代理
- 选择带宽充足的代理
- 避免使用公共代理

### 调整轮询间隔

使用代理时，网络延迟可能增加，建议适当增大轮询间隔：

```json
{
  "interval": 60
}
```

## 安全建议

1. ✅ 使用可信的代理服务
2. ✅ 避免在代理 URL 中明文存储密码
3. ✅ 定期检查代理服务的安全性
4. ✅ 使用 HTTPS 代理（如果可能）
