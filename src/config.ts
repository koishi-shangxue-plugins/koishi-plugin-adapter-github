import { Schema } from 'koishi';

// 仓库配置接口
export interface RepoConfig
{
  repository: string; // 格式：owner/repo
}

// 解析仓库字符串为 owner 和 repo
export function parseRepository(repository: string): { owner: string; repo: string; } | null
{
  const parts = repository.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1])
  {
    return null;
  }
  return { owner: parts[0], repo: parts[1] };
}

// 定义配置项接口
export interface Config
{
  token: string;
  repositories?: RepoConfig[]; // 仅在 pull 模式下需要
  mode: 'webhook' | 'pull';
  interval?: number;
  webhookPath?: string;
  webhookSecret?: string;
  useProxy?: boolean;
  proxyUrl?: string;
  loggerinfo?: boolean;
  silentMode?: boolean;
  autoDispose?: boolean;   // 是否在特殊情况下自动关闭插件
  maxRetries?: number;     // 最大重试次数
  ignoreNetworkWarnings?: boolean; // 是否忽略网络重试警告日志
}

// 定义配置项 Schema
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    token: Schema.string().required().description('GitHub Personal Access Token (PAT)').role('secret'),
  }).description('基础设置'),

  Schema.object({
    mode: Schema.union([
      Schema.const('webhook').description('server（完整支持）'),
      Schema.const('pull').description('polling（部分事件受限）')
    ]).default('webhook').description('通信模式<br>-> 相关接入方法 请参考文档'),
  }).description('通信模式选择'),

  Schema.union([
    Schema.intersect([
      Schema.object({
        mode: Schema.const('webhook'),
        webhookPath: Schema.string().role('link').default('/github/webhook').description('Webhook 路径<br>默认地址：`http://127.0.0.1:5140/github/webhook`'),
        webhookSecret: Schema.string().description('Webhook 密钥（可选，用于验证请求）').role('secret'),
        useProxy: Schema.boolean().default(false).description('是否使用代理（仅作用于发送消息）'),
      }),
      Schema.union([
        Schema.object({
          useProxy: Schema.const(true).required(),
          proxyUrl: Schema.string().description('代理地址（仅支持 http/https 协议）').default("http://localhost:7897"),
        }),
        Schema.object({
          useProxy: Schema.const(false).description('是否使用代理'),
        }),
      ]),
    ]),
    Schema.intersect([
      Schema.object({
        mode: Schema.const('pull').required(),
        repositories: Schema.array(Schema.object({
          repository: Schema.string().description('Owner/Repo').pattern(/^[^\/]+\/[^\/]+$/),
        })).role('table').default([
          {
            "repository": "koishi-shangxue-plugins/koishi-plugin-adapter-github"
          }
        ]).description('监听的仓库列表<br>请填入机器人创建的仓库以确保权限完整<br>格式：Owner/Repo'),
        interval: Schema.number().default(20).description('轮询间隔 (单位：秒)<br>注意：对于别人的仓库，此处轮询间隔约 1 min'),
        useProxy: Schema.boolean().default(false).description('是否使用代理'),
      }),
      Schema.union([
        Schema.object({
          useProxy: Schema.const(true).required(),
          proxyUrl: Schema.string().description('代理地址（仅支持 http/https 协议）').default("http://localhost:7897"),
        }),
        Schema.object({
          useProxy: Schema.const(false).description('是否使用代理'),
        }),
      ]),
    ]),
  ]).description('模式配置'),

  Schema.object({
    autoDispose: Schema.boolean().default(true).description('遇到错误时是否按最大重试次数重试后关闭插件<br>开启：重试达到最大次数后关闭插件<br>关闭：永远重试，不会关闭插件（延迟最大叠加到 1 分钟/次）'),
    maxRetries: Schema.number().default(10).description('最大重试次数（仅在开启自动关闭时生效）<br>每次间隔递增 5 秒，最后一次约 1 分钟'),
  }).description('网络重试设置'),

  Schema.object({
    silentMode: Schema.boolean().default(false).description('是否以静默模式运行？<br>开启后，不会向 GitHub 发送任何可见内容，包括 send、sendMessage 等方法都不再可用，仅单向接收 GitHub 消息、响应必要的 webhook ping 事件。'),
    ignoreNetworkWarnings: Schema.boolean().default(true).description('是否忽略网络重试警告日志<br>开启后，网络临时故障（如超时、连接重置等）的重试日志将不会显示，只保留严重错误日志'),
  }).description('静默模式'),

  Schema.object({
    loggerinfo: Schema.boolean().default(false).description("日志调试模式").experimental(),
  }).description("调试设置"),
]);
