import { Universal } from 'koishi';
import { parseRepository, type RepoConfig } from '../../config';
import { GitHubBot } from '../base';

export function updateStatus(bot: GitHubBot, status: Universal.Status): void
{
  bot.status = status;

  const session = bot.session({
    type: 'login-updated',
    platform: bot.platform,
    selfId: bot.selfId,
  });
  bot.dispatch(session);
  bot.logInfo(`状态更新为 ${status}，已派发 login-updated 事件`);
}

export function buildModeInfo(bot: GitHubBot, modeName: 'Pull' | 'Webhook'): string
{
  if (bot.config.useProxy && bot.config.proxyUrl)
  {
    return `${modeName} (代理：${bot.config.proxyUrl})`;
  }
  return modeName;
}

export async function initializePullRepositories(bot: GitHubBot): Promise<{
  validRepos: RepoConfig[];
  ownedRepos: string[];
} | null>
{
  if (!bot.config.repositories || bot.config.repositories.length === 0)
  {
    bot.loggerError('Pull 模式需要配置 repositories，插件将自动关闭');
    bot.ctx.scope.dispose();
    return null;
  }

  const validRepos: RepoConfig[] = [];
  const ownedRepos: string[] = [];

  for (const repo of bot.config.repositories)
  {
    const parsed = parseRepository(repo.repository);
    if (!parsed)
    {
      bot.loggerWarn(`仓库格式错误: ${repo.repository}，已自动跳过（正确格式：owner/repo）`);
      continue;
    }

    const { owner, repo: repoName } = parsed;
    const repoKey = `${owner}/${repoName}`;

    if (owner === '*' || repoName === '*')
    {
      bot.loggerWarn(`Pull 模式不支持通配符仓库配置 ${repoKey}，已自动跳过`);
      continue;
    }

    try
    {
      const { data: repoData } = await bot.octokit.repos.get({
        owner,
        repo: repoName,
      });

      const isOwned = repoData.owner.login === bot.selfId
        || repoData.permissions?.admin
        || repoData.permissions?.push;

      if (isOwned)
      {
        ownedRepos.push(repoKey);
      } else
      {
        try
        {
          await bot.octokit.activity.setRepoSubscription({
            owner,
            repo: repoName,
            subscribed: true,
            ignored: false,
          });
        } catch (error)
        {
          const message = error instanceof Error ? error.message : String(error);
          bot.loggerWarn(`设置仓库 ${repoKey} 订阅失败: ${message}`);
        }
      }

      validRepos.push(repo);
    } catch (error: any)
    {
      if (error?.status === 404)
      {
        bot.loggerWarn(`仓库 ${repoKey} 不存在或无权访问，已自动跳过`);
      } else
      {
        bot.loggerError(`初始化仓库 ${repoKey} 失败:`, error);
      }
    }
  }

  if (validRepos.length === 0)
  {
    bot.loggerError('没有可用的仓库，插件将自动关闭');
    bot.ctx.scope.dispose();
    return null;
  }

  return { validRepos, ownedRepos };
}
