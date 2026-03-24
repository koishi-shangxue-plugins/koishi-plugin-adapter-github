import { fetch as undiciFetch, ProxyAgent, type RequestInfo as UndiciRequestInfo, type RequestInit as UndiciRequestInit, type Response } from 'undici';
import { Config } from '../config';
import { logger } from '../index';

export interface OctokitLogger
{
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface GitHubRequestClient
{
  readonly log: OctokitLogger;
  fetch(url: string | URL | Request, init?: RequestInit): Promise<Response>;
  dispose(): void;
}

const silentOctokitLogger: OctokitLogger = {
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { },
};

function createOctokitLogger(config: Config): OctokitLogger
{
  if (!config.loggerinfo) return silentOctokitLogger;

  return {
    debug: (message) => logger.info(`[octokit] ${message}`),
    info: (message) => logger.info(`[octokit] ${message}`),
    warn: (message) => logger.warn(`[octokit] ${message}`),
    error: (message) => logger.warn(`[octokit] ${message}`),
  };
}

class DefaultGitHubRequestClient implements GitHubRequestClient
{
  readonly log: OctokitLogger;
  private proxyAgent?: ProxyAgent;
  private disposed = false;

  constructor(private config: Config)
  {
    this.log = createOctokitLogger(config);

    // 仅在需要时创建代理对象，避免每次请求重复实例化。
    if (config.useProxy && config.proxyUrl)
    {
      this.proxyAgent = new ProxyAgent(config.proxyUrl);
    }
  }

  fetch(url: string | URL | Request, init?: RequestInit): Promise<Response>
  {
    const requestUrl: UndiciRequestInfo = url instanceof Request ? url.url : url;
    const requestInit = (init ?? {}) as unknown as UndiciRequestInit;
    const finalInit: UndiciRequestInit = this.proxyAgent
      ? { ...requestInit, dispatcher: this.proxyAgent }
      : { ...requestInit };

    return undiciFetch(requestUrl, finalInit);
  }

  dispose(): void
  {
    if (this.disposed) return;
    this.disposed = true;

    if (this.proxyAgent)
    {
      void this.proxyAgent.close();
      this.proxyAgent = undefined;
    }
  }
}

export function createGitHubRequestClient(config: Config): GitHubRequestClient
{
  return new DefaultGitHubRequestClient(config);
}
