import { Universal } from 'koishi';
import { GitHubBot } from '../base';
import { dispatchGitHubEvent } from './dispatch';
import { buildModeInfo, initializePullRepositories, updateStatus } from './lifecycle';
import { handleGitHubNotification } from './notifications';
import { processNotificationPoll, processRepositoryPoll } from './polling';
import { handleGitHubEvent } from './session';
import { handleGitHubWebhookEvent } from './webhook';

export class GitHubBotWithEventHandling extends GitHubBot
{
  async start()
  {
    await GitHubBot.prototype.start.call(this);

    const connectSession = this.session({
      type: 'login-updated',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(connectSession);
    this.logInfo('状态为 CONNECT，已派发 login-updated 事件');

    try
    {
      await this.ensureOctokitReady();

      const { data: user } = await this.octokit.users.getAuthenticated();
      if (this.user)
      {
        this.user.avatar = user.avatar_url;
      }

      if (this.config.mode === 'pull')
      {
        const result = await initializePullRepositories(this);
        if (!result) return;

        this.config.repositories = result.validRepos;
        this._ownedRepos = new Set(result.ownedRepos);

        updateStatus(this, Universal.Status.ONLINE);
        const repoList = result.validRepos.map(repo => repo.repository).join(', ');
        this.loggerInfo(`GitHub 机器人已上线：${this.selfId} (${buildModeInfo(this, 'Pull')}, 监听仓库：${repoList})`);
      } else
      {
        updateStatus(this, Universal.Status.ONLINE);
        this.loggerInfo(`GitHub 机器人已上线：${this.selfId} (${buildModeInfo(this, 'Webhook')})`);
      }

      if (this.config.mode === 'pull' && this.ctx.scope.isActive)
      {
        await this.poll(true);
        this._timer = this.ctx.setInterval(() =>
        {
          void this.poll(false);
        }, (this.config.interval ?? 20) * 1000);
      } else if (this.config.mode === 'pull')
      {
        this.loggerWarn('上下文未激活，跳过定时器创建');
      }
    } catch (error)
    {
      this.loggerError('GitHub 机器人启动失败', error);
      this.status = Universal.Status.OFFLINE;
      throw error;
    }
  }

  async poll(isFirstPoll: boolean = false)
  {
    if (!this.config.repositories || this.config.repositories.length === 0)
    {
      this.loggerWarn('Pull 模式下没有配置仓库，跳过轮询');
      return;
    }

    for (const repo of this.config.repositories)
    {
      await processRepositoryPoll(
        this,
        repo,
        isFirstPoll,
        (repoKey) => this._ownedRepos.has(repoKey),
        (repoKey) => this._processedEventIds.get(repoKey),
        (repoKey, ids) => this._processedEventIds.set(repoKey, ids),
        (event, owner, repoName) => this.handleEvent(event, owner, repoName),
      );
    }

    await processNotificationPoll(
      this,
      (repoKey) => this._ownedRepos.has(repoKey),
      (notification, owner, repo) => this.handleNotification(notification, owner, repo),
    );
  }

  async handleNotification(notification: any, owner: string, repo: string)
  {
    return handleGitHubNotification(
      this,
      notification,
      owner,
      repo,
      (event, eventOwner, eventRepo) => this.handleEvent(event, eventOwner, eventRepo),
    );
  }

  private dispatchGitHubEvent(event: any, owner: string, repo: string)
  {
    dispatchGitHubEvent(this, event, owner, repo);
  }

  async handleEvent(event: any, owner: string, repo: string)
  {
    return handleGitHubEvent(this, event, owner, repo);
  }

  async handleWebhookEvent(event: any, owner: string, repo: string)
  {
    return handleGitHubWebhookEvent(
      this,
      event,
      owner,
      repo,
      (normalizedEvent, eventOwner, eventRepo) => this.handleEvent(normalizedEvent, eventOwner, eventRepo),
    );
  }
}
