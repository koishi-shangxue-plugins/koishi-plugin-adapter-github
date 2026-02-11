import { Universal } from 'koishi';
import { GitHubBotWithAPI } from './api';

// 扩展 GitHubBot 类，添加反应相关方法
export class GitHubBotWithReaction extends GitHubBotWithAPI
{
  // 获取反应列表
  async getReactionList(channelId: string, messageId: string, emoji: string): Promise<Universal.List<Universal.User>>
  {
    const parsed = this.parseChannelId(channelId);
    if (!parsed) throw new Error('Invalid channel ID');

    const { owner, repo, type, number } = parsed;

    try
    {
      if (type === 'issues' || type === 'pull')
      {
        let reactions: any[];

        if (messageId === 'issue' || messageId === 'pull')
        {
          // 获取 Issue/PR 的反应
          const { data } = await this.octokit.reactions.listForIssue({
            owner,
            repo,
            issue_number: number,
          });
          reactions = data;
        } else
        {
          // 获取评论的反应
          const commentId = parseInt(messageId);
          const { data } = await this.octokit.reactions.listForIssueComment({
            owner,
            repo,
            comment_id: commentId,
          });
          reactions = data;
        }

        // 过滤指定 emoji 的用户
        const filtered = emoji ? reactions.filter(r => r.content === emoji) : reactions;

        return {
          data: filtered.map(r => ({
            id: r.user.login,
            name: r.user.login,
            avatar: r.user.avatar_url,
          })),
        };
      }
    } catch (e)
    {
      this.logError(`获取反应列表失败`, e);
      throw e;
    }

    return { data: [] };
  }

  // 获取群组成员列表（Issue/PR 的参与者）
  async getGuildMemberList(guildId: string): Promise<Universal.List<Universal.GuildMember>>
  {
    const parsed = this.parseChannelId(guildId);
    if (!parsed) throw new Error('Invalid guild ID');

    const { owner, repo, type, number } = parsed;

    try
    {
      if (type === 'issues' || type === 'pull')
      {
        // 获取 Issue/PR 的参与者
        const { data: comments } = await this.octokit.issues.listComments({
          owner,
          repo,
          issue_number: number,
        });

        // 去重用户
        const users = new Map<string, any>();
        for (const comment of comments)
        {
          if (comment.user)
          {
            users.set(comment.user.login, comment.user);
          }
        }

        return {
          data: Array.from(users.values()).map(user => ({
            user: {
              id: user.login,
              name: user.login,
              avatar: user.avatar_url,
            },
            name: user.login,
            avatar: user.avatar_url,
          })),
        };
      }
    } catch (e)
    {
      this.logError(`获取群组成员列表失败`, e);
      throw e;
    }

    return { data: [] };
  }

  // 获取群组成员
  async getGuildMember(guildId: string, userId: string): Promise<Universal.GuildMember>
  {
    try
    {
      const user = await this.getUser(userId);
      return {
        user,
        name: user.name,
        avatar: user.avatar,
      };
    } catch (e)
    {
      this.logError(`获取群组成员失败: ${userId}`, e);
      throw e;
    }
  }
}
