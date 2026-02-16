import { GitHubBot } from '../bot/base';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * 上传文件到 GitHub
 * GitHub 支持通过特定 API 上传文件并获取可用于 Issue/PR 的 URL
 * @param bot GitHubBot 实例
 * @param owner 仓库所有者
 * @param repo 仓库名称
 * @param filePath 文件路径（本地路径或 URL）
 * @returns 上传后的 URL
 */
export async function uploadFileToGitHub(
  bot: GitHubBot,
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null>
{
  try
  {
    let fileBuffer: Buffer;
    let fileName: string;
    let contentType = 'application/octet-stream';

    // 判断是本地文件还是 URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://'))
    {
      // http/https URL 直接返回
      return filePath;
    } else if (filePath.startsWith('file://'))
    {
      // file:// 协议，使用 fileURLToPath 正确转换
      const localPath = fileURLToPath(filePath);
      fileBuffer = await readFile(localPath);
      fileName = basename(localPath);
    } else if (filePath.startsWith('base64://'))
    {
      // base64 数据
      const base64Data = filePath.slice('base64://'.length);
      fileBuffer = Buffer.from(base64Data, 'base64');
      fileName = `file_${Date.now()}`;
    } else if (filePath.startsWith('data:'))
    {
      // data URL
      const matches = filePath.match(/^data:([^;]+);base64,(.+)$/);
      if (matches)
      {
        contentType = matches[1];
        const base64Data = matches[2];
        fileBuffer = Buffer.from(base64Data, 'base64');
        // 根据 MIME 类型推断扩展名
        const ext = contentType.split('/')[1] || 'bin';
        fileName = `file_${Date.now()}.${ext}`;
      } else
      {
        bot.logError('无效的 data URL 格式');
        return null;
      }
    } else
    {
      // 本地文件路径
      fileBuffer = await readFile(filePath);
      fileName = basename(filePath);
    }

    // 使用 multipart/form-data 格式上传文件到 GitHub
    // GitHub 的 user-attachments API 端点
    const boundary = `----WebKitFormBoundary${Date.now()}`;
    const formData: string[] = [];

    formData.push(`--${boundary}`);
    formData.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"`);
    formData.push(`Content-Type: ${contentType}`);
    formData.push('');

    // 构建完整的请求体
    const header = formData.join('\r\n') + '\r\n';
    const footer = `\r\n--${boundary}--\r\n`;

    const headerBuffer = Buffer.from(header, 'utf-8');
    const footerBuffer = Buffer.from(footer, 'utf-8');
    const bodyBuffer = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

    // 上传到 GitHub user-attachments API
    const uploadUrl = `https://api.github.com/repos/${owner}/${repo}/assets`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bot.config.token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/vnd.github+json',
      },
      body: new Uint8Array(bodyBuffer),
    });

    if (!response.ok)
    {
      const errorText = await response.text();
      bot.logError(`文件上传失败: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const result = await response.json();

    if (result && result.url)
    {
      bot.logInfo(`文件上传成功: ${result.url}`);
      return result.url;
    }

    bot.logError('文件上传失败：未返回 URL', result);
    return null;
  } catch (error)
  {
    bot.logError('文件上传失败:', error);
    return null;
  }
}
