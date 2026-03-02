import { Context, Bot, Universal } from 'koishi';
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
  protected _processedEventIds: Map<string, Set<string>> = new Map(); // 存储每个仓库已处理的事件 ID
  protected _ownedRepos: Set<string> = new Set(); // 存储自己拥有的仓库
  private _clientsReady: Promise<void>;

  constructor(ctx: Context, config: Config, username: string)
  {
    super(ctx, config, 'github');

    // 使用传入的 username 初始化 bot 信息
    this.selfId = username;
    this.user = {
      id: username,
      name: username,
      avatar: '',
    };

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



  // 停止机器人
  async stop()
  {
    // 调用 ctx.setInterval 返回的函数来清理定时器
    if (this._timer) this._timer();

    // 设置状态为离线并派发 login-updated
    this.status = Universal.Status.OFFLINE;
    const updateSession = this.session({
      type: 'login-updated',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(updateSession);
    this.logInfo('状态更新为 OFFLINE，派发 login-updated 事件');

    // 派发 login-removed 事件，通知 satori 等服务
    const loginSession = this.session({
      type: 'login-removed',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(loginSession);
    this.logInfo('派发 login-removed 事件');
  }

  // Satori 协议要求的 disconnect 方法
  async disconnect()
  {
    // GitHub 适配器不需要特殊的断开连接逻辑
    // 所有清理工作在 stop() 方法中完成
  }
}
