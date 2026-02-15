import { Context, Bot, Universal, MessageEncoder } from 'koishi';
import { fetchWithProxy } from './http';
import { Config } from '../config';
import { GitHubMessageEncoder } from '../message/encoder';

// 动态导入类型
type Octokit = import('@octokit/rest').Octokit;
type GraphQLFunction = typeof import('@octokit/graphql').graphql;

// GitHub 机器人基础类
export class GitHubBot extends Bot<Context, Config>
{
  static MessageEncoder = GitHubMessageEncoder;

  octokit: Octokit;
  graphql: GraphQLFunction;
  protected _timer: () => void;
  protected _lastEventIds: Map<string, string> = new Map();
  protected _ownedRepos: Set<string> = new Set(); // 存储自己拥有的仓库
  private _clientsReady: Promise<void>;

  constructor(ctx: Context, config: Config)
  {
    super(ctx, config, 'github');

    const commonOptions = {
      auth: config.token,
      request: {
        fetch: (url, init) =>
        {
          const proxy = this.config.useProxy ? this.config.proxyUrl : undefined;
          return fetchWithProxy(url, init, proxy);
        }
      }
    };

    // 异步初始化 REST 和 GraphQL 客户端（使用动态 import）
    this._clientsReady = Promise.all([
      import('@octokit/rest').then(({ Octokit }) =>
      {
        this.octokit = new Octokit(commonOptions);
      }),
      import('@octokit/graphql').then(({ graphql }) =>
      {
        this.graphql = graphql.defaults({
          headers: {
            authorization: `token ${config.token}`,
          },
          request: commonOptions.request,
        });
      })
    ]).then(() => { });
  }

  // 确保客户端已初始化
  async ensureOctokitReady(): Promise<void>
  {
    await this._clientsReady;
  }

  // 日志函数
  loggerInfo(message: any, ...args: any[]): void
  {
    this.ctx.logger.info(message, ...args);
  }

  loggerWarn(message: any, ...args: any[]): void
  {
    this.ctx.logger.warn(message, ...args);
  }

  loggerError(message: any, ...args: any[]): void
  {
    this.ctx.logger.error(message, ...args);
  }

  // 调试日志函数
  logInfo(message: any, ...args: any[])
  {
    if (this.config.loggerinfo)
    {
      this.loggerInfo(message, ...args);
    }
  }

  logError(message: any, ...args: any[])
  {
    this.loggerError(message, ...args);
  }

  // 解析 channelId 的辅助方法
  parseChannelId(channelId: string): { owner: string; repo: string; type: string; number: number; } | null
  {
    const parts = channelId.split(':');
    if (parts.length !== 3) return null;

    const [repoPrefix, type, numberStr] = parts;
    const [owner, repo] = repoPrefix.split('/');
    const number = parseInt(numberStr);

    if (isNaN(number) || !owner || !repo) return null;
    return { owner, repo, type, number };
  }


  // 停止机器人
  async stop()
  {
    // 调用 ctx.setInterval 返回的函数来清理定时器
    if (this._timer) this._timer();
    this.status = Universal.Status.OFFLINE;
    // this.loggerInfo(`GitHub 机器人已下线：${this.selfId}`)
  }
}
