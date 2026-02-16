import { Universal } from 'koishi';
import { GitHubBotWithMessaging } from './messaging';
import { parseChannelId } from '../../message/utils';
import { parseRepository } from '../../config';

// 扩展 GitHubBot 类，添加 Satori API 方法
export class GitHubBotWithAPI extends GitHubBotWithMessaging
{
  // 获取登录信息
  async getLogin(): Promise<Universal.Login>
  {
    return {
      user: this.user,
      selfId: this.selfId,
      platform: 'github',
      status: this.status,
    } as Universal.Login;
  }

  // 获取用户信息
  async getUser(userId: string): Promise<Universal.User>
  {
    try
    {
      const { data: user } = await this.octokit.users.getByUsername({ username: userId });
      return {
        id: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
      };
    } catch (e)
    {
      this.logError(`获取用户信息失败: ${userId}`, e);
      throw e;
    }
  }

  // 获取群组信息（对应 Issue/PR/Discussion）
  async getGuild(guildId: string): Promise<Universal.Guild>
  {
    // 解析 guildId: owner/repo:type:number
    const parsed = parseChannelId(guildId);
    if (!parsed)
    {
      return { id: guildId, name: guildId };
    }

    const { owner, repo, type, number } = parsed;
    const repoPrefix = `${owner}/${repo}`;

    try
    {
      if (type === 'issues' || type === 'pull')
      {
        const { data } = await this.octokit.issues.get({
          owner,
          repo,
          issue_number: number,
        });
        return {
          id: guildId,
          name: `[${repoPrefix}] ${data.title}`,
        };
      } else if (type === 'discussions')
      {
        const { repository } = await this.graphql<{
          repository: { discussion: { title: string; }; };
        }>(`
          query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
              discussion(number: $number) {
                title
              }
            }
          }
        `, {
          owner,
          repo,
          number,
        });
        return {
          id: guildId,
          name: `[${repoPrefix}] ${repository.discussion.title}`,
        };
      }
    } catch (e)
    {
      this.logError(`获取群组信息失败: ${guildId}`, e);
    }

    return {
      id: guildId,
      name: `${repoPrefix} ${type} #${number}`,
    };
  }

  // 获取频道信息（与群组相同）
  async getChannel(channelId: string, guildId?: string): Promise<Universal.Channel>
  {
    const guild = await this.getGuild(channelId);
    return {
      id: channelId,
      name: guild.name,
      type: Universal.Channel.Type.TEXT,
    };
  }

  // 获取群组列表（监听的仓库）
  async getGuildList(): Promise<Universal.List<Universal.Guild>>
  {
    const guilds: Universal.Guild[] = [];

    // 仅在 pull 模式下返回配置的仓库列表
    if (this.config.mode === 'pull' && this.config.repositories)
    {
      for (const repo of this.config.repositories)
      {
        // 解析仓库字符串
        const parsed = parseRepository(repo.repository);
        if (!parsed)
        {
          this.loggerWarn(`仓库格式错误: ${repo.repository}，跳过`);
          continue;
        }

        const { owner, repo: repoName } = parsed;

        try
        {
          const { data: repoData } = await this.octokit.repos.get({
            owner,
            repo: repoName,
          });

          guilds.push({
            id: `${owner}/${repoName}`,
            name: repoData.full_name,
          });
        } catch (e)
        {
          this.logError(`获取仓库信息失败: ${owner}/${repoName}`, e);
        }
      }
    }
    // Webhook 模式下返回空列表，因为接收所有仓库的事件

    return { data: guilds };
  }

  // 获取频道列表（仓库的 Issues/PRs）
  async getChannelList(guildId: string): Promise<Universal.List<Universal.Channel>>
  {
    const [owner, repo] = guildId.split('/');
    if (!owner || !repo) throw new Error('Invalid guild ID');

    const channels: Universal.Channel[] = [];

    try
    {
      // 获取 Issues
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 50,
      });

      for (const issue of issues)
      {
        if (!issue.pull_request)
        {
          channels.push({
            id: `${owner}/${repo}:issues:${issue.number}`,
            name: issue.title,
            type: Universal.Channel.Type.TEXT,
          });
        }
      }

      // 获取 Pull Requests
      const { data: pulls } = await this.octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 50,
      });

      for (const pull of pulls)
      {
        channels.push({
          id: `${owner}/${repo}:pull:${pull.number}`,
          name: pull.title,
          type: Universal.Channel.Type.TEXT,
        });
      }
    } catch (e)
    {
      this.logError(`获取频道列表失败: ${guildId}`, e);
      throw e;
    }

    return { data: channels };
  }

  // 创建频道（创建 Issue）
  async createChannel(guildId: string, data: Partial<Universal.Channel>): Promise<Universal.Channel>
  {
    const [owner, repo] = guildId.split('/');
    if (!owner || !repo) throw new Error('Invalid guild ID');

    try
    {
      const { data: issue } = await this.octokit.issues.create({
        owner,
        repo,
        title: data.name || 'New Issue',
        body: '',
      });

      return {
        id: `${owner}/${repo}:issues:${issue.number}`,
        name: issue.title,
        type: Universal.Channel.Type.TEXT,
      };
    } catch (e)
    {
      this.logError(`创建频道失败`, e);
      throw e;
    }
  }

  // 更新频道（更新 Issue/PR 标题）
  async updateChannel(channelId: string, data: Partial<Universal.Channel>): Promise<void>
  {
    const parsed = parseChannelId(channelId);
    if (!parsed) throw new Error('Invalid channel ID');

    const { owner, repo, number } = parsed;

    try
    {
      await this.octokit.issues.update({
        owner,
        repo,
        issue_number: number,
        title: data.name,
      });
    } catch (e)
    {
      this.logError(`更新频道失败`, e);
      throw e;
    }
  }

  // 删除频道（关闭 Issue/PR）
  async deleteChannel(channelId: string): Promise<void>
  {
    const parsed = parseChannelId(channelId);
    if (!parsed) throw new Error('Invalid channel ID');

    const { owner, repo, number } = parsed;

    try
    {
      await this.octokit.issues.update({
        owner,
        repo,
        issue_number: number,
        state: 'closed',
      });
    } catch (e)
    {
      this.logError(`删除频道失败`, e);
      throw e;
    }
  }
}
