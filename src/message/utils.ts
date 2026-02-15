import { h } from 'koishi';
import { } from '@koishijs/assets';
import { GitHubBot } from '../bot/base';

/**
 * 解析频道 ID
 * @param channelId 格式：owner/repo:type:number
 * @returns 解析结果或 null
 */
export function parseChannelId(channelId: string): { owner: string; repo: string; type: string; number: number; } | null
{
  const parts = channelId.split(':');
  if (parts.length !== 3) return null;

  const [repoPrefix, type, numberStr] = parts;
  const [owner, repo] = repoPrefix.split('/');
  const number = parseInt(numberStr);

  if (isNaN(number) || !owner || !repo) return null;
  return { owner, repo, type, number };
}

/**
 * 使用 assets 服务转存非 HTTPS 协议的资源
 */
export async function transformUrl(bot: GitHubBot, elementString: string): Promise<string | null>
{
  // 检查 assets 服务是否存在
  if (!bot.ctx.assets)
  {
    bot.logInfo('Assets 服务不可用，跳过资源转存');
    return null;
  }

  try
  {
    const transformedContent = await bot.ctx.assets.transform(elementString);
    // 从转存后的内容中提取 URL
    const urlMatch = transformedContent.match(/src="([^"]+)"/);
    if (urlMatch && urlMatch[1])
    {
      return urlMatch[1];
    } else
    {
      bot.logInfo(`无法从转存内容中提取 URL: ${transformedContent}`);
      return null;
    }
  } catch (error)
  {
    bot.logError('资源转存失败:', error);
    return null;
  }
}
