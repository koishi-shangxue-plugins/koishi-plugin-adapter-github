import { Context, MessageEncoder, h } from 'koishi';
import { } from '@koishijs/assets';
import { GitHubBotComplete } from '../bot/webhook';
import { transformUrl } from './utils';

/**
 * GitHub 消息编码器
 */
export class GitHubMessageEncoder extends MessageEncoder<Context, GitHubBotComplete>
{
  private buffer: string = '';

  async flush(): Promise<void>
  {
    if (!this.buffer.trim()) return;

    // 静默模式检查
    if (this.bot.config.silentMode)
    {
      this.bot.loggerWarn('静默模式已启用，消息不会发送');
      this.buffer = '';
      return;
    }

    // 解析 channelId: owner/repo:type:number
    const parts = this.channelId.split(':');
    if (parts.length !== 3)
    {
      this.buffer = '';
      return;
    }

    const [repoPrefix, type, numberStr] = parts;
    const [owner, repo] = repoPrefix.split('/');
    const number = parseInt(numberStr);
    if (isNaN(number) || !owner || !repo)
    {
      this.buffer = '';
      return;
    }

    try
    {
      if (type === 'issues' || type === 'pull')
      {
        const { data } = await this.bot.octokit.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body: this.buffer,
        });
        this.results.push({ id: data.id.toString() });
      } else if (type === 'discussions')
      {
        // 1. 通过 GraphQL 查询获取 Discussion 的 node_id
        const { repository } = await this.bot.graphql<{
          repository: { discussion: { id: string; }; };
        }>(`
          query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
              discussion(number: $number) {
                id
              }
            }
          }
        `, {
          owner,
          repo,
          number,
        });

        const discussionId = repository.discussion.id;
        if (!discussionId)
        {
          throw new Error(`Discussion #${number} not found.`);
        }

        // 2. 使用 node_id 发表评论
        const { addDiscussionComment } = await this.bot.graphql<{
          addDiscussionComment: { comment: { id: string; }; };
        }>(`
          mutation($discussionId: ID!, $body: String!) {
            addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
              comment {
                id
              }
            }
          }
        `, {
          discussionId,
          body: this.buffer,
        });

        this.results.push({ id: addDiscussionComment.comment.id });
      }
    } catch (e)
    {
      this.bot.loggerError(`向频道 ${this.channelId} 发送消息失败:`, e);
    }

    this.buffer = '';
  }

  async visit(element: h): Promise<void>
  {
    const { type, attrs, children } = element;

    switch (type)
    {
      case 'text':
        this.buffer += attrs.content || '';
        break;

      case 'i18n': {
        try
        {
          const path = attrs?.path;
          if (path && this.bot.ctx.i18n)
          {
            const locales = this.bot.ctx.i18n.fallback([]);
            try
            {
              const rendered = this.bot.ctx.i18n.render(locales, [path], attrs || {});

              // i18n.render 可能返回字符串或 Fragment
              if (typeof rendered === 'string')
              {
                this.buffer += rendered;
                break;
              } else if (Array.isArray(rendered))
              {
                // 递归处理 Fragment 数组
                await this.render(rendered);
                break;
              }
            } catch (e)
            {
              this.bot.logError(`i18n 解析失败: ${e}`);
            }
          }
          this.buffer += `[${path || 'i18n'}]`;
        } catch (error)
        {
          this.buffer += `[${attrs?.path || 'i18n'}]`;
        }
        break;
      }

      case 'at':
        if (attrs.id)
        {
          this.buffer += `@${attrs.name || attrs.id}`;
        }
        break;

      case 'sharp':
        if (attrs.id)
        {
          this.buffer += `#${attrs.name || attrs.id}`;
        }
        break;

      case 'a':
        this.buffer += attrs.href || '';
        break;

      case 'img':
      case 'image': {
        let url = attrs.url || attrs.src;

        if (!url.startsWith('http'))
        {
          const transformedUrl = await transformUrl(this.bot, h.image(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.buffer += '[图片转存失败]';
            break;
          }
        }

        this.buffer += `![image](${url})`;
        break;
      }

      case 'audio': {
        let url = attrs.url || attrs.src;

        if (!url.startsWith('http'))
        {
          const transformedUrl = await transformUrl(this.bot, h.audio(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.buffer += '[音频转存失败]';
            break;
          }
        }

        this.buffer += `[音频](${url})`;
        break;
      }

      case 'video': {
        let url = attrs.url || attrs.src;

        if (!url.startsWith('http'))
        {
          const transformedUrl = await transformUrl(this.bot, h.video(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.buffer += '[视频转存失败]';
            break;
          }
        }

        this.buffer += `[视频](${url})`;
        break;
      }

      case 'file': {
        let url = attrs.url || attrs.src;

        if (!url.startsWith('http'))
        {
          const transformedUrl = await transformUrl(this.bot, h.file(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.buffer += '[文件转存失败]';
            break;
          }
        }

        this.buffer += `[文件](${url})`;
        break;
      }

      case 'b':
      case 'strong':
        this.buffer += '**';
        await this.render(children);
        this.buffer += '**';
        break;

      case 'i':
      case 'em':
        this.buffer += '*';
        await this.render(children);
        this.buffer += '*';
        break;

      case 's':
      case 'del':
        this.buffer += '~~';
        await this.render(children);
        this.buffer += '~~';
        break;

      case 'code':
        this.buffer += '`';
        await this.render(children);
        this.buffer += '`';
        break;

      case 'p':
        await this.render(children);
        this.buffer += '\n\n';
        break;

      case 'br':
        this.buffer += '\n';
        break;

      case 'message':
        if (attrs.forward)
        {
          this.buffer += '[转发消息]';
        } else
        {
          await this.render(children);
        }
        break;

      case 'quote':
        await this.render(children);
        break;

      default:
        await this.render(children);
        break;
    }
  }
}
