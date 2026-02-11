# 快速开始

本指南将帮助你快速配置并使用 GitHub 适配器。

## 1. 生成 PAT

> Personal Access Token

为了让 Koishi 机器人能够代表你的 GitHub 账号进行操作（例如读取事件、发表评论），你需要创建一个 Personal Access Token。

![alt](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github/blob/docs/docs/public/2026-02-11_14-43-48.png?raw=true)

### 创建步骤

1. 访问 GitHub 的 [Personal Access Token 设置页面](https://github.com/settings/tokens)
2. 点击右侧 **"Generate new token"**，然后从弹出的菜单中选择 **"Generate new token (classic)"**
3. 在 **"Note"** 字段中，为你的 Token 取一个容易识别的名字，例如 `koishi-bot-adapter-github-token`
4. 在 **"Select scopes"** 部分，勾选以下权限：
   - `repo` (完全控制私有仓库)
   - `read:user` (读取用户信息)
   - `read:discussion` (读取 Discussions)
   - `write:discussion` (发表和修改 Discussions)
5. 点击页面底部的 **"Generate token"**
6. **立即复制生成的 Token**。这个 Token 只会显示一次，请妥善保管

:::warning
安全提示

请妥善保管你的 Token，不要将其泄露给他人或提交到公开的代码仓库中。
:::

## 2. 安装插件

在 Koishi 控制台的插件市场中搜索 `adapter-github` 并安装。

## 3. 基础配置

安装完成后，在插件配置页面填写以下信息：

### 必填项

- **Token**: 粘贴你刚刚生成的 Personal Access Token
- **监听的仓库列表**: 添加你想要监听的仓库
  - **Owner**: 仓库所有者的用户名或组织名
  - **Repo**: 仓库名称

:::warning
注意，为了确保仓库权限完整，推荐填入由机器人账号创建的仓库
:::
示例配置：

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "repositories": [
    {
      "owner": "koishi-shangxue-plugins",
      "repo": "koishi-plugin-adapter-github"
    }
  ]
}
```

### 选择通信模式

根据你的实际情况选择合适的通信模式：

#### Pull 模式（推荐新手）

- 适合没有公网 IP 的用户
- 支持代理配置
- 配置简单，开箱即用

#### Webhook 模式（推荐进阶用户）

- 实时性更好
- 需要公网 IP 和域名
- 需要在 GitHub 配置 Webhook

详细的模式配置说明请参考：

- [Pull 模式配置](/markdown/mode/pull)
- [Webhook 模式配置](/markdown/mode/webhook)

## 4. 启动机器人

配置完成后，启用插件即可。你可以在控制台日志中看到类似以下的输出：

```log
[github] GitHub 机器人已上线：your-username (监听仓库：owner/repo)
[github] 通信模式：Pull
```

## 5. 测试功能

在你配置的仓库中创建一个 Issue 或发表评论，机器人应该能够接收到相应的事件。

## 下一步

- 查看 [配置说明](/markdown/guide/config) 了解更多配置选项
- 查看 [事件系统](/markdown/dev/events) 了解如何监听 GitHub 事件
- 查看 [常见问题](/markdown/guide/faq) 解决使用中遇到的问题
