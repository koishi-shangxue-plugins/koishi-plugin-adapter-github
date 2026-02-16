import { h, Universal } from 'koishi';
import { GitHubBot } from './base';
import { decodeMarkdown } from '../message/markdown';
import { parseRepository } from '../config';

// 扩展 GitHubBot 类，添加事件处理方法
export class GitHubBotWithEventHandling extends GitHubBot
{
  // 启动机器人
  async start()
  {
    try
    {
      // 确保 octokit 已初始化
      await this.ensureOctokitReady();

      // 获取当前认证用户信息
      const { data: user } = await this.octokit.users.getAuthenticated();
      this.selfId = user.login;
      this.user = {
        id: user.login,
        name: user.login,
        avatar: user.avatar_url,
      };

      // 仅在 Pull 模式下验证并初始化仓库
      if (this.config.mode === 'pull')
      {
        if (!this.config.repositories || this.config.repositories.length === 0)
        {
          this.loggerError('Pull 模式需要配置 repositories，插件将自动关闭');
          this.ctx.scope.dispose();
          return;
        }

        const validRepos: typeof this.config.repositories = [];
        for (const repo of this.config.repositories)
        {
          // 解析仓库字符串
          const parsed = parseRepository(repo.repository);
          if (!parsed)
          {
            this.loggerWarn(`仓库格式错误: ${repo.repository}，已自动跳过（正确格式：owner/repo）`);
            continue;
          }

          const { owner, repo: repoName } = parsed;
          const repoKey = `${owner}/${repoName}`;

          // Pull 模式下不支持通配符
          if (owner === '*' || repoName === '*')
          {
            this.loggerWarn(`Pull 模式不支持通配符仓库配置: ${repoKey}，已自动跳过`);
            continue;
          }

          try
          {
            // 验证仓库是否存在并检查权限
            const { data: repoData } = await this.octokit.repos.get({
              owner,
              repo: repoName,
            });

            // 检查是否是自己拥有的仓库
            const isOwned = repoData.owner.login === this.selfId ||
              repoData.permissions?.admin ||
              repoData.permissions?.push;

            if (isOwned)
            {
              this._ownedRepos.add(repoKey);
            } else
            {
              // 自动设置仓库订阅为"所有活动"
              try
              {
                await this.octokit.activity.setRepoSubscription({
                  owner,
                  repo: repoName,
                  subscribed: true,
                  ignored: false,
                });
              } catch (e: any)
              {
                this.loggerWarn(`设置仓库 ${repoKey} 订阅失败:`, e.message);
              }
            }

            validRepos.push(repo);
          } catch (e: any)
          {
            if (e.status === 404)
            {
              this.loggerWarn(`仓库 ${repoKey} 不存在或无权访问，已自动跳过`);
            } else
            {
              this.loggerError(`初始化仓库 ${repoKey} 失败:`, e);
            }
          }
        }

        // 检查是否有有效的仓库
        if (validRepos.length === 0)
        {
          this.loggerError('没有可用的仓库，插件将自动关闭');
          this.ctx.scope.dispose();
          return;
        }

        // 更新配置为只包含有效的仓库
        this.config.repositories = validRepos;

        this.status = Universal.Status.ONLINE;
        const repoList = validRepos.map(r => r.repository).join(', ');
        this.loggerInfo(`GitHub 机器人已上线：${this.selfId} (监听仓库：${repoList})`);

        // 构建通信模式信息
        let modeInfo = 'Pull';
        if (this.config.useProxy && this.config.proxyUrl)
        {
          modeInfo += ` (代理：${this.config.proxyUrl})`;
        }
      } else
      {
        // Webhook 模式
        this.status = Universal.Status.ONLINE;
        this.loggerInfo(`GitHub 机器人已上线：${this.selfId}`);
      }

      // 仅在 Pull 模式下启动定时器
      if (this.config.mode === 'pull' && this.ctx.scope.isActive)
      {
        // 立即进行首次轮询，建立事件基线（不处理事件，只缓存）
        await this.poll(true); // 传入 true 表示首次轮询，只缓存不处理

        // 启动定时器进行后续轮询
        this._timer = this.ctx.setInterval(() => this.poll(false), this.config.interval * 1000);
      } else if (this.config.mode === 'pull')
      {
        this.loggerWarn('上下文未激活，跳过定时器创建');
      }
    } catch (e)
    {
      this.loggerError('GitHub 机器人启动失败:', e);
      this.status = Universal.Status.OFFLINE;
      throw e;
    }
  }

  // 混合轮询策略：自己的仓库用 Events API，别人的仓库用 Notifications API
  async poll(isFirstPoll: boolean = false)
  {
    // 确保在 pull 模式下且有 repositories 配置
    if (!this.config.repositories || this.config.repositories.length === 0)
    {
      this.loggerWarn('Pull 模式下没有配置仓库，跳过轮询');
      return;
    }

    // 1. 轮询自己拥有的仓库（使用 Events API，更快）
    for (const repo of this.config.repositories)
    {
      // 解析仓库字符串
      const parsed = parseRepository(repo.repository);
      if (!parsed)
      {
        this.loggerWarn(`仓库格式错误: ${repo.repository}，跳过轮询`);
        continue;
      }

      const { owner, repo: repoName } = parsed;
      const repoKey = `${owner}/${repoName}`;

      // 只处理自己拥有的仓库
      if (!this._ownedRepos.has(repoKey)) continue;

      try
      {
        const { data: events } = await this.octokit.activity.listRepoEvents({
          owner,
          repo: repoName,
          per_page: 20,
        });

        // 如果是首次轮询，将所有事件 ID 记录为已处理，不处理任何事件
        if (isFirstPoll)
        {
          const processedIds = new Set<string>();
          events.forEach(event => processedIds.add(event.id));
          this._processedEventIds.set(repoKey, processedIds);
          this.logInfo(`仓库 ${repoKey} 首次轮询，记录 ${processedIds.size} 个历史事件 ID 作为基线`);
          continue;
        }

        // 获取已处理的事件 ID 集合
        let processedIds = this._processedEventIds.get(repoKey);
        if (!processedIds)
        {
          // 如果没有记录，初始化一个空集合
          processedIds = new Set<string>();
          this._processedEventIds.set(repoKey, processedIds);
        }

        // 筛选出未处理的新事件
        const newEvents = events.filter(event => !processedIds.has(event.id));

        if (newEvents.length > 0)
        {
          this.logInfo(`仓库 ${repoKey} 发现 ${newEvents.length} 个新事件`);

          // 将新事件 ID 添加到已处理集合
          newEvents.forEach(event => processedIds.add(event.id));

          // 限制已处理 ID 集合的大小，避免内存占用过大（保留最新的 100 个）
          if (processedIds.size > 100)
          {
            const idsArray = Array.from(processedIds);
            const toKeep = new Set(idsArray.slice(-100));
            this._processedEventIds.set(repoKey, toKeep);
          }

          // 逆序处理，确保消息按时间顺序派发
          for (const event of newEvents.reverse())
          {
            this.logInfo(`处理事件: ${event.type} - ${event.actor.login}`);
            await this.handleEvent(event, owner, repoName);
          }
        }
      } catch (e: any)
      {
        // 网络错误使用 warn 级别，避免日志过于冗长
        if (e.status === 500 || e.status === 502 || e.status === 503 || e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET')
        {
          this.loggerWarn(`轮询仓库 ${repoKey} 事件时网络异常 (${e.status || e.code})，将在下次轮询重试`);
        } else
        {
          this.logError(`轮询仓库 ${repoKey} 事件时出错:`, e);
        }
      }
    }

    // 2. 轮询通知（用于别人的仓库）
    try
    {
      const { data: notifications } = await this.octokit.activity.listNotificationsForAuthenticatedUser({
        all: false, // 只获取未读通知
        per_page: 50,
      });

      for (const notification of notifications)
      {
        const owner = notification.repository.owner.login;
        const repo = notification.repository.name;
        const repoKey = `${owner}/${repo}`;

        // 跳过自己拥有的仓库（已通过 Events API 处理）
        if (this._ownedRepos.has(repoKey))
        {
          // 标记为已读但不处理
          try
          {
            await this.octokit.activity.markThreadAsRead({
              thread_id: parseInt(notification.id),
            });
          } catch (e: any)
          {
            // 网络错误降级为 warn
            if (e.status === 500 || e.status === 502 || e.status === 503 || e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET')
            {
              this.loggerWarn(`标记通知已读时网络异常: ${notification.id}`);
            } else
            {
              this.logError(`标记通知已读失败: ${notification.id}`, e);
            }
          }
          continue;
        }

        this.logInfo(`处理仓库通知: ${repoKey}`);

        // 处理通知
        await this.handleNotification(notification, owner, repo);

        // 标记通知为已读
        try
        {
          await this.octokit.activity.markThreadAsRead({
            thread_id: parseInt(notification.id),
          });
        } catch (e: any)
        {
          // 网络错误降级为 warn
          if (e.status === 500 || e.status === 502 || e.status === 503 || e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET')
          {
            this.loggerWarn(`标记通知已读时网络异常: ${notification.id}`);
          } else
          {
            this.logError(`标记通知已读失败: ${notification.id}`, e);
          }
        }
      }
    } catch (e: any)
    {
      // 网络错误使用 warn 级别
      if (e.status === 500 || e.status === 502 || e.status === 503 || e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET')
      {
        this.loggerWarn(`轮询通知时网络异常 (${e.status || e.code})，将在下次轮询重试`);
      } else
      {
        this.logError('轮询通知时出错:', e);
      }
    }
  }

  // 处理 GitHub 通知
  async handleNotification(notification: any, owner: string, repo: string)
  {
    this.logInfo(`处理通知: ${notification.subject.type} - ${notification.subject.title}`);

    // 根据通知类型获取详细信息
    try
    {
      const subjectType = notification.subject.type;
      const subjectUrl = notification.subject.url;

      // 检查 URL 是否存在
      if (!subjectUrl)
      {
        this.logInfo(`通知类型 ${subjectType} 没有 URL，跳过处理`);
        return;
      }

      // 从 URL 中提取编号
      const urlParts = subjectUrl.split('/');
      const number = parseInt(urlParts[urlParts.length - 1]);

      if (isNaN(number))
      {
        this.logError(`无法从 URL 解析编号: ${subjectUrl}`);
        return;
      }

      // 获取上次读取时间，用于过滤新评论
      const lastReadAt = notification.last_read_at ? new Date(notification.last_read_at) : null;
      const updatedAt = new Date(notification.updated_at);

      // 根据类型获取详细信息并构造事件
      if (subjectType === 'Issue')
      {
        const { data: issue } = await this.octokit.issues.get({
          owner,
          repo,
          issue_number: number,
        });

        // 获取自上次读取后的所有评论
        const { data: allComments } = await this.octokit.issues.listComments({
          owner,
          repo,
          issue_number: number,
          per_page: 100,
          since: lastReadAt ? lastReadAt.toISOString() : undefined,
        });

        // 处理每条新评论
        for (const comment of allComments)
        {
          const commentTime = new Date(comment.created_at);
          // 只处理在通知更新时间之前的评论
          if (lastReadAt && commentTime <= lastReadAt) continue;

          const event = {
            id: `notif-${notification.id}-${comment.id}`,
            type: 'IssueCommentEvent',
            actor: {
              login: comment.user.login,
              avatar_url: comment.user.avatar_url,
            },
            payload: {
              action: 'created',
              issue: issue,
              comment: comment,
            },
            created_at: comment.created_at,
          };
          await this.handleEvent(event, owner, repo);
        }
      } else if (subjectType === 'PullRequest')
      {
        const { data: pull } = await this.octokit.pulls.get({
          owner,
          repo,
          pull_number: number,
        });

        // 获取自上次读取后的所有评论
        const { data: allComments } = await this.octokit.issues.listComments({
          owner,
          repo,
          issue_number: number,
          per_page: 100,
          since: lastReadAt ? lastReadAt.toISOString() : undefined,
        });

        // 处理每条新评论
        for (const comment of allComments)
        {
          const commentTime = new Date(comment.created_at);
          // 只处理在通知更新时间之前的评论
          if (lastReadAt && commentTime <= lastReadAt) continue;

          const event = {
            id: `notif-${notification.id}-${comment.id}`,
            type: 'IssueCommentEvent',
            actor: {
              login: comment.user.login,
              avatar_url: comment.user.avatar_url,
            },
            payload: {
              action: 'created',
              issue: pull,
              comment: comment,
            },
            created_at: comment.created_at,
          };
          await this.handleEvent(event, owner, repo);
        }
      }
    } catch (e)
    {
      this.logError(`处理通知失败: ${notification.id}`, e);
    }
  }

  // 处理 star 和 fork 事件
  private handleStarForkEvent(event: any, owner: string, repo: string)
  {
    // 派发 GitHub 特殊事件
    this.dispatchGitHubEvent(event, owner, repo);
  }

  // 处理 workflow 事件
  private handleWorkflowEvent(event: any, owner: string, repo: string)
  {
    // 派发 GitHub 特殊事件
    this.dispatchGitHubEvent(event, owner, repo);
  }

  // 派发 GitHub 特殊事件
  private dispatchGitHubEvent(event: any, owner: string, repo: string)
  {
    const repoKey = `${owner}/${repo}`;

    // 构建事件数据
    const eventData = {
      owner,
      repo,
      repoKey,
      actor: event.actor,
      payload: event.payload,
      type: event.type,
      action: event.payload?.action,
      timestamp: new Date(event.created_at).getTime(),
      // 添加 bot 标识，用于多实例去重
      botId: this.selfId,
      platform: this.platform,
    };

    // 根据事件类型派发不同的自定义事件
    switch (event.type)
    {
      case 'IssuesEvent':
        // 派发 github/issue-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/issue-${event.payload.action}`, {
            ...eventData,
            issue: event.payload.issue,
          });
        }
        // 派发通用 github/issue 事件
        (this.ctx.emit as any)('github/issue', {
          ...eventData,
          issue: event.payload.issue,
        });
        break;

      case 'IssueCommentEvent':
        // 派发 github/issue-comment-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/issue-comment-${event.payload.action}`, {
            ...eventData,
            issue: event.payload.issue,
            comment: event.payload.comment,
          });
        }
        // 派发通用 github/issue-comment 事件
        (this.ctx.emit as any)('github/issue-comment', {
          ...eventData,
          issue: event.payload.issue,
          comment: event.payload.comment,
        });
        break;

      case 'PullRequestEvent':
        // 派发 github/pull-request-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/pull-request-${event.payload.action}`, {
            ...eventData,
            pullRequest: event.payload.pull_request,
          });
        }
        // 派发通用 github/pull-request 事件
        (this.ctx.emit as any)('github/pull-request', {
          ...eventData,
          pullRequest: event.payload.pull_request,
        });
        break;

      case 'PullRequestReviewCommentEvent':
        // 派发 github/pull-request-review-comment 事件
        (this.ctx.emit as any)('github/pull-request-review-comment', {
          ...eventData,
          pullRequest: event.payload.pull_request,
          comment: event.payload.comment,
        });
        break;

      case 'DiscussionEvent':
        // 派发 github/discussion-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/discussion-${event.payload.action}`, {
            ...eventData,
            discussion: event.payload.discussion,
          });
        }
        // 派发通用 github/discussion 事件
        (this.ctx.emit as any)('github/discussion', {
          ...eventData,
          discussion: event.payload.discussion,
        });
        break;

      case 'DiscussionCommentEvent':
        // 派发 github/discussion-comment 事件
        (this.ctx.emit as any)('github/discussion-comment', {
          ...eventData,
          discussion: event.payload.discussion,
          comment: event.payload.comment,
        });
        break;

      case 'WorkflowRunEvent':
        // 派发 github/workflow-run-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/workflow-run-${event.payload.action}`, {
            ...eventData,
            workflowRun: event.payload.workflow_run,
            workflow: event.payload.workflow,
          });
        }
        // 派发通用 github/workflow-run 事件
        (this.ctx.emit as any)('github/workflow-run', {
          ...eventData,
          workflowRun: event.payload.workflow_run,
          workflow: event.payload.workflow,
        });
        break;

      case 'WorkflowJobEvent':
        // 派发 github/workflow-job-{action} 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/workflow-job-${event.payload.action}`, {
            ...eventData,
            workflowJob: event.payload.workflow_job,
          });
        }
        // 派发通用 github/workflow-job 事件
        (this.ctx.emit as any)('github/workflow-job', {
          ...eventData,
          workflowJob: event.payload.workflow_job,
        });
        break;

      case 'WatchEvent':
        // Star 事件（GitHub API 中 star 事件类型是 WatchEvent）
        (this.ctx.emit as any)('github/star', {
          ...eventData,
          action: event.payload.action || 'started',
        });
        break;

      case 'ForkEvent':
        // Fork 事件
        (this.ctx.emit as any)('github/fork', {
          ...eventData,
          forkee: event.payload.forkee,
        });
        break;

      case 'PushEvent':
        // Push 事件
        (this.ctx.emit as any)('github/push', {
          ...eventData,
          ref: event.payload.ref,
          before: event.payload.before,
          after: event.payload.after,
          commits: event.payload.commits,
          headCommit: event.payload.head_commit,
        });
        break;

      case 'ReleaseEvent':
        // Release 事件
        if (event.payload.action)
        {
          (this.ctx.emit as any)(`github/release-${event.payload.action}`, {
            ...eventData,
            release: event.payload.release,
          });
        }
        (this.ctx.emit as any)('github/release', {
          ...eventData,
          release: event.payload.release,
        });
        break;
    }

    // 派发通用 github/event 事件（包含所有类型）
    (this.ctx.emit as any)('github/event', eventData);
  }

  // 处理 GitHub 事件并转换为 Koishi 会话
  async handleEvent(event: any, owner: string, repo: string)
  {
    // 忽略机器人自己产生的事件
    // 对于 push 事件，actor 可能只有 name 字段，需要额外检查
    const actorLogin = event.actor?.login || event.actor?.name;
    if (actorLogin === this.selfId)
    {
      this.logInfo(`忽略机器人自己的事件: ${event.type}`);
      return;
    }

    this.logInfo(`事件详情: ${JSON.stringify(event, null, 2)}`);

    // 处理特殊事件（只派发事件，不创建会话）
    if (event.type === 'WorkflowRunEvent' || event.type === 'WorkflowJobEvent')
    {
      this.handleWorkflowEvent(event, owner, repo);
      return;
    }

    // 处理 star 和 fork 事件（只派发事件，不创建会话）
    if (event.type === 'WatchEvent' || event.type === 'ForkEvent')
    {
      this.handleStarForkEvent(event, owner, repo);
      return;
    }

    // 处理 push 和 release 事件（只派发事件，不创建会话）
    if (event.type === 'PushEvent' || event.type === 'ReleaseEvent')
    {
      this.dispatchGitHubEvent(event, owner, repo);
      return;
    }

    const session = this.session({
      type: 'message',
      timestamp: new Date(event.created_at).getTime(),
      user: {
        id: event.actor.login,
        name: event.actor.login,
        avatar: event.actor.avatar_url,
      }
    });

    let content = '';
    let channelId = '';
    const repoPrefix = `${owner}/${repo}`;

    // 根据事件类型解析频道 ID 和内容
    switch (event.type)
    {
      case 'IssueCommentEvent':
        channelId = `${repoPrefix}:issues:${event.payload.issue.number}`;
        content = event.payload.comment.body;
        break;
      case 'IssuesEvent':
        if (['opened', 'closed', 'reopened'].includes(event.payload.action))
        {
          channelId = `${repoPrefix}:issues:${event.payload.issue.number}`;
          content = `[Issue ${event.payload.action}] ${event.payload.issue.title}`;
          if (event.payload.action === 'opened')
          {
            content += `\n${event.payload.issue.body || ''}`;
          }
        }
        break;
      case 'PullRequestEvent':
        if (['opened', 'closed', 'reopened'].includes(event.payload.action))
        {
          channelId = `${repoPrefix}:pull:${event.payload.pull_request.number}`;
          content = `[PR ${event.payload.action}] ${event.payload.pull_request.title}`;
          if (event.payload.action === 'opened')
          {
            content += `\n${event.payload.pull_request.body || ''}`;
          }
        }
        break;
      case 'PullRequestReviewCommentEvent':
        channelId = `${repoPrefix}:pull:${event.payload.pull_request.number}`;
        content = event.payload.comment.body;
        break;
      case 'DiscussionEvent':
        channelId = `${repoPrefix}:discussions:${event.payload.discussion.number}`;
        content = `[Discussion ${event.payload.action}] ${event.payload.discussion.title}`;
        break;
      case 'DiscussionCommentEvent':
        channelId = `${repoPrefix}:discussions:${event.payload.discussion.number}`;
        content = event.payload.comment.body;
        break;
    }

    // 如果成功解析出频道和内容，则派发会话
    if (channelId && content)
    {
      session.channelId = channelId;
      session.guildId = channelId;
      // 将 Markdown 内容转换为 Satori 元素，然后转为字符串用于 content
      const elements = decodeMarkdown(content);
      session.content = h.normalize(elements).join('');
      // 保存原始元素供后续使用
      session.elements = h.normalize(elements);

      // 根据事件类型设置正确的 messageId
      let messageId = event.id;
      if (event.type === 'IssueCommentEvent' && event.payload.comment)
      {
        messageId = String(event.payload.comment.id);
      } else if (event.type === 'PullRequestReviewCommentEvent' && event.payload.comment)
      {
        messageId = String(event.payload.comment.id);
      } else if (event.type === 'DiscussionCommentEvent' && event.payload.comment)
      {
        messageId = String(event.payload.comment.id);
      } else if (event.type === 'IssuesEvent')
      {
        messageId = 'issue';
      } else if (event.type === 'PullRequestEvent')
      {
        messageId = 'pull';
      } else if (event.type === 'DiscussionEvent')
      {
        messageId = 'discussion';
      }
      session.messageId = messageId;

      // 设置 guild 和 channel 信息
      if (event.type === 'IssueCommentEvent' || event.type === 'IssuesEvent')
      {
        session.event.guild = {
          id: channelId,
          name: event.payload.issue.title,
        };
        session.event.channel = {
          id: channelId,
          name: event.payload.issue.title,
          type: Universal.Channel.Type.TEXT,
        };
      } else if (event.type === 'PullRequestEvent' || event.type === 'PullRequestReviewCommentEvent')
      {
        session.event.guild = {
          id: channelId,
          name: event.payload.pull_request.title,
        };
        session.event.channel = {
          id: channelId,
          name: event.payload.pull_request.title,
          type: Universal.Channel.Type.TEXT,
        };
      } else if (event.type === 'DiscussionEvent' || event.type === 'DiscussionCommentEvent')
      {
        session.event.guild = {
          id: channelId,
          name: event.payload.discussion.title,
        };
        session.event.channel = {
          id: channelId,
          name: event.payload.discussion.title,
          type: Universal.Channel.Type.TEXT,
        };
      }

      // 派发标准 Koishi 会话
      this.dispatch(session);

      // 派发 GitHub 特殊事件
      this.dispatchGitHubEvent(event, owner, repo);
    }
  }

  // 处理 webhook 事件
  async handleWebhookEvent(event: any, owner: string, repo: string)
  {
    // 构造类似 GitHub Events API 的事件对象
    let eventType = '';
    let payload: any = {};
    let actor: any = event.sender;

    if (event.issue && event.comment)
    {
      eventType = 'IssueCommentEvent';
      payload = { issue: event.issue, comment: event.comment, action: event.action };
    } else if (event.issue)
    {
      eventType = 'IssuesEvent';
      payload = { issue: event.issue, action: event.action };
    } else if (event.pull_request && event.comment)
    {
      eventType = 'PullRequestReviewCommentEvent';
      payload = { pull_request: event.pull_request, comment: event.comment };
    } else if (event.pull_request)
    {
      eventType = 'PullRequestEvent';
      payload = { pull_request: event.pull_request, action: event.action };
    } else if (event.discussion && event.comment)
    {
      eventType = 'DiscussionCommentEvent';
      payload = { discussion: event.discussion, comment: event.comment };
    } else if (event.discussion)
    {
      eventType = 'DiscussionEvent';
      payload = { discussion: event.discussion, action: event.action };
    } else if (event.forkee)
    {
      // Fork 事件
      eventType = 'ForkEvent';
      payload = { forkee: event.forkee };
      actor = event.forkee.owner;
    } else if ((event.action === 'started' || event.action === 'deleted') && event.repository && !event.issue && !event.pull_request && !event.discussion)
    {
      // Star 事件（webhook 中 star 事件的 action 是 'started' 或 'deleted'）
      eventType = 'WatchEvent';
      payload = { action: event.action };
    } else if (event.workflow_run)
    {
      // Workflow Run 事件
      eventType = 'WorkflowRunEvent';
      payload = { workflow_run: event.workflow_run, workflow: event.workflow, action: event.action };
    } else if (event.workflow_job)
    {
      // Workflow Job 事件
      eventType = 'WorkflowJobEvent';
      payload = { workflow_job: event.workflow_job, action: event.action };
    } else if (event.ref && event.commits)
    {
      // Push 事件
      eventType = 'PushEvent';
      payload = {
        ref: event.ref,
        before: event.before,
        after: event.after,
        commits: event.commits,
        head_commit: event.head_commit,
        pusher: event.pusher,
      };
      actor = event.pusher || event.sender;
    } else if (event.release)
    {
      // Release 事件
      eventType = 'ReleaseEvent';
      payload = { release: event.release, action: event.action };
    } else
    {
      this.logInfo(`未处理的 webhook 事件类型，payload keys: ${Object.keys(event).join(', ')}`);
      return;
    }

    // 获取事件描述用于日志
    const eventDesc = event.action || eventType.replace('Event', '') || '未知';
    this.logInfo(`收到 Webhook 事件: ${eventDesc}`);

    const normalizedEvent = {
      id: `webhook-${Date.now()}`,
      type: eventType,
      actor: actor,
      payload: payload,
      created_at: new Date().toISOString(),
    };

    await this.handleEvent(normalizedEvent, owner, repo);
  }
}
