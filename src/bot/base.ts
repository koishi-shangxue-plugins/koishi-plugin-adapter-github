import { Bot, Context, Universal } from 'koishi';
import { Config } from '../config';
import { logger } from '../index';
import { GitHubMessageEncoder } from '../message/encoder';
import { createGitHubRequestClient, type GitHubRequestClient } from './http';

type Octokit = import('@octokit/rest').Octokit;
type GraphQLFunction = typeof import('@octokit/graphql').graphql;

export class GitHubBot extends Bot<Context, Config>
{
  static MessageEncoder = GitHubMessageEncoder;

  octokit: Octokit;
  graphql: GraphQLFunction;
  protected _timer: (() => void) | null = null;
  protected _processedEventIds: Map<string, Set<string>> = new Map();
  protected _ownedRepos: Set<string> = new Set();
  protected _clientsReady: Promise<void>;
  protected _requestClient: GitHubRequestClient;
  protected _stopped = false;

  constructor(ctx: Context, config: Config, username: string)
  {
    super(ctx, config, 'github');

    this.selfId = username;
    this.user = {
      id: username,
      name: username,
      avatar: '',
    };

    this._requestClient = createGitHubRequestClient(config);

    const commonOptions = {
      auth: config.token,
      log: this._requestClient.log,
      request: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
        {
          return this._requestClient.fetch(url, init);
        },
      },
    };

    // 延迟加载客户端，避免模块初始化阶段直接触发网络请求。
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
      }),
    ]).then(() => { });
  }

  async ensureOctokitReady(): Promise<void>
  {
    await this._clientsReady;
  }

  loggerInfo(message: string, ...args: unknown[]): void
  {
    logger.info(message, ...args);
  }

  loggerWarn(message: string, ...args: unknown[]): void
  {
    logger.warn(message, ...args);
  }

  loggerError(message: string, ...args: unknown[]): void
  {
    logger.error(message, ...args);
  }

  logInfo(message: string, ...args: unknown[]): void
  {
    if (!this.config.loggerinfo) return;
    this.loggerInfo(message, ...args);
  }

  logError(message: string, ...args: unknown[]): void
  {
    this.loggerError(message, ...args);
  }

  protected clearPollTimer(): void
  {
    if (!this._timer) return;
    this._timer();
    this._timer = null;
  }

  async stop()
  {
    if (this._stopped) return;
    this._stopped = true;

    // 停止前先清理轮询定时器。
    this.clearPollTimer();
    this._requestClient.dispose();

    this.status = Universal.Status.OFFLINE;

    const updateSession = this.session({
      type: 'login-updated',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(updateSession);
    this.logInfo('状态已更新为 OFFLINE，并派发 login-updated 事件');

    const loginSession = this.session({
      type: 'login-removed',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(loginSession);
    this.logInfo('已派发 login-removed 事件');
  }

  async disconnect()
  {
    await this.stop();
  }
}
