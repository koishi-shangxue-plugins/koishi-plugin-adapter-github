import * as crypto from 'node:crypto';
import { Context } from 'koishi';
import { Config } from '../config';
import { formatGitHubError } from '../network';
import { GitHubInternal } from './api/internal';
import { GitHubBotWithUnsupported } from './api/unsupported';

export class GitHubBotComplete extends GitHubBotWithUnsupported
{
  internal: GitHubInternal;
  private pollRunning = false;
  private pollFailureStreak = 0;
  private pollBackoffUntil = 0;

  constructor(ctx: Context, config: Config, username: string)
  {
    super(ctx, config, username);
    this.internal = new GitHubInternal(this);
  }

  async poll(isFirstPoll: boolean = false): Promise<void>
  {
    if (this._stopped) return;

    // 上一次轮询未结束时直接跳过，避免并发请求堆积。
    if (this.pollRunning)
    {
      this.logInfo('GitHub 轮询仍在执行，跳过本次调度');
      return;
    }

    if (!isFirstPoll && this.pollBackoffUntil > Date.now())
    {
      this.logInfo(`GitHub 轮询处于退避窗口，暂不发起新请求`);
      return;
    }

    this.pollRunning = true;

    try
    {
      await super.poll(isFirstPoll);
      this.pollFailureStreak = 0;
      this.pollBackoffUntil = 0;
    } catch (error)
    {
      this.pollFailureStreak += 1;
      const delay = Math.min(((this.config.interval ?? 20) * 1000) * (2 ** this.pollFailureStreak), 5 * 60 * 1000);
      this.pollBackoffUntil = Date.now() + delay;
      this.logError(`GitHub 轮询任务执行失败：${formatGitHubError(error)}`);
      throw error;
    } finally
    {
      this.pollRunning = false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean
  {
    if (!this.config.webhookSecret) return true;
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}
