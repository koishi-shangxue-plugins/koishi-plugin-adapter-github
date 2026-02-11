# 快速开始

|                                                               NPM Version                                                               |                                                                 Downloads                                                                  |                                           Platform                                           |                                                                                               License                                                                                               |
| :-------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [![npm version](https://img.shields.io/npm/v/koishi-plugin-adapter-github)](https://www.npmjs.com/package/koishi-plugin-adapter-github) | [![npm downloads](https://img.shields.io/npm/dt/koishi-plugin-adapter-github)](https://www.npmjs.com/package/koishi-plugin-adapter-github) | [![platform](https://img.shields.io/badge/platform-Koishi-blueviolet)](https://koishi.chat/) | [![license](https://img.shields.io/github/license/koishi-shangxue-plugins/koishi-plugin-adapter-github)](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github/blob/main/LICENSE) |

本插件为 [Koishi](https://koishi.chat/) 框架提供了一个 [GitHub](https://github.com/) 平台适配器。

## ✨ 特性

- 🔄 **双模式支持**：支持 Webhook（实时推送）和 Pull（轮询）两种通信模式
- 📦 **多仓库监听**：可同时监听多个 GitHub 仓库的事件
- 🎯 **丰富的事件支持**：支持 Issues、Pull Requests、Discussions 等多种事件类型
- 🔌 **代理支持**：Pull 模式支持 HTTP/HTTPS 代理配置
- 🎨 **Markdown 解析**：自动将 GitHub Markdown 转换为 Koishi 消息元素
- 🔔 **自定义事件**：提供 GitHub 特有的事件系统，方便其他插件监听

## 📋 支持的事件类型

### Issue 相关

- Issue 创建、关闭、重新打开
- Issue 评论的创建、编辑、删除

### Pull Request 相关

- PR 创建、关闭、重新打开、合并
- PR 评论和审查评论

### Discussion 相关

- Discussion 创建、关闭、重新打开
- Discussion 评论

## 🚀 通信模式

### Pull 模式（轮询）

- ✅ 无需公网 IP
- ✅ 支持代理配置
- ✅ 配置简单
- ⚠️ 部分事件受限（如 Discussion 事件）
- ⚠️ 实时性较差

### Webhook 模式（推送）

- ✅ 实时性强
- ✅ 完整事件支持
- ✅ 资源占用少
- ⚠️ 需要公网 IP
- ⚠️ 需要配置 GitHub Webhook

## 📞 联系方式

如需进一步帮助，您可以通过以下方式联系：

| 平台          | ID/链接                                                                                    |
| :------------ | :----------------------------------------------------------------------------------------- |
| GitHub Issues | [提交问题](https://github.com/koishi-shangxue-plugins/koishi-plugin-adapter-github/issues) |
