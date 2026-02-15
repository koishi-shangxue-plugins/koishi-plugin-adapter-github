import { h } from 'koishi';
import { } from '@koishijs/assets';
import { GitHubBot } from '../bot/base';

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
