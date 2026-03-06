import { Context, Logger } from 'koishi';
import { GitHubBot } from './bot/bot';
import { Config } from './config';
import { registerWebhookRouter } from './webhook-router';
import { fetchUsernameWithRetry } from './utils';

export const name = 'adapter-github';
export const reusable = true;
export const filter = false;
export const inject = {
  required: ['logger', 'i18n'],
  optional: ['assets', 'server']
};

// 统一日志输出
export const logger = new Logger('github');

// 导出配置项
export * from './config';

export const usage = `
---

所需服务：**assets**、logger、i18n、server

---

本插件支持两种通信模式：

- **Webhook 模式**（推荐）：实时接收 GitHub 事件推送（需要公网 URL），支持完整接收 GitHub 事件
- **Pull 模式**：定时轮询获取事件（支持代理 且 无需公网 URL），部分事件不支持，例如 Discussion 事件

<a href="https://koishi-shangxue-plugins.github.io/koishi-plugin-adapter-github/" target="_blank" class="iirose-link">点我查看详细配置说明 -> README 文档</a>`;

// 插件入口
export function apply(ctx: Context, config: Config)
{
  // 用于在插件销毁时中断重试等待
  const abortController = new AbortController();

  ctx.on('dispose', () =>
  {
    abortController.abort();
  });

  ctx.on('ready', async () =>
  {
    // 先获取 GitHub 用户信息，确定 selfId（支持重试）
    const username = await fetchUsernameWithRetry(config, abortController.signal);

    // 获取失败（autoDispose=true 且已达最大重试次数）或插件已销毁
    if (!username)
    {
      if (!abortController.signal.aborted)
      {
        logger.error('插件将自动关闭');
        ctx.scope.dispose();
      }
      return;
    }

    // 检查插件是否已在重试期间被销毁
    if (abortController.signal.aborted) return;

    logger.info(`获取到 GitHub 用户名：${username}`);

    // 创建子上下文，确保 bot 的生命周期与插件绑定
    const botCtx = ctx.guild();

    // 创建 bot 实例，传入已获取的用户名
    const bot = new GitHubBot(botCtx, config, username);

    // 立即派发 login-added 事件，通知 satori 等服务 bot 已创建
    const loginAddedSession = bot.session({
      type: 'login-added',
      platform: bot.platform,
      selfId: bot.selfId,
    });
    bot.dispatch(loginAddedSession);
    logger.info(`派发 login-added 事件: ${bot.selfId}`);

    // 如果是 webhook 模式，注册路由
    if (config.mode === 'webhook')
    {
      registerWebhookRouter(ctx, bot, config);
    }

    // 在子上下文销毁时自动清理
    botCtx.on('dispose', async () =>
    {
      // 与 start 一样，koishi 会自动调用
      // await bot.stop()
    });
  });
}
