/**
 * 安全工具库
 * 用于输入验证、清洗和防护
 */

/**
 * 清洗用户输入，防止XSS攻击
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  // 1. 类型检查
  if (typeof input !== 'string') {
    throw new Error('输入必须是字符串');
  }

  // 2. 长度限制
  if (input.length > maxLength) {
    throw new Error(`输入内容过长，最多${maxLength}字符`);
  }

  // 3. 检测危险字符和脚本
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onload=/gi,
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new Error('输入包含非法字符');
    }
  }

  // 4. 清理空白字符
  return input.trim();
}

/**
 * 验证兑换码格式
 */
export function validateRedeemCode(code: string): boolean {
  if (typeof code !== 'string') return false;

  // 严格格式：GOKAKU-XXXX-XXXX
  return /^GOKAKU-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

/**
 * IP地址脱敏
 */
export function hashIP(ip: string): string {
  if (!ip || typeof ip !== 'string') return 'unknown';

  // IPv4: 只保留前两段
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
  }

  // IPv6: 只保留前两段
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
    }
  }

  return 'unknown';
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): void {
  // 文件大小限制：5MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('图片大小不能超过5MB');
  }

  // 文件类型白名单
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('只支持 JPG、PNG、WEBP 格式的图片');
  }
}

/**
 * 验证Base64图片
 */
export function validateBase64Image(base64: string): void {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('无效的图片数据');
  }

  // 检查是否是有效的base64格式
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!base64Pattern.test(base64)) {
    throw new Error('无效的图片格式');
  }

  // 估算文件大小（base64编码后约为原文件的1.37倍）
  const sizeInBytes = (base64.length * 0.75) / 1.37;
  const MAX_SIZE = 5 * 1024 * 1024;
  if (sizeInBytes > MAX_SIZE) {
    throw new Error('图片大小不能超过5MB');
  }
}

/**
 * 清洗AI返回的内容（保留markdown格式）
 */
export function sanitizeAIResponse(response: string): string {
  if (!response || typeof response !== 'string') {
    return '';
  }

  // 只移除明显的脚本标签，保留markdown格式
  return response
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onclick=/gi, '');
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) && email.length <= 100;
}

/**
 * 请求频率限制检查
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRequestRate(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1分钟
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // 如果没有记录或已过期，创建新记录
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }

  // 检查是否超过限制
  if (record.count >= maxRequests) {
    return false;
  }

  // 增加计数
  record.count++;
  return true;
}

/**
 * 清理过期的频率限制记录（定期调用）
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((record, key) => {
    if (now > record.resetAt) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * 验证Referer（防止CSRF）
 */
export function validateReferer(referer: string | null, allowedHosts: string[]): boolean {
  if (!referer) return false;

  try {
    const url = new URL(referer);
    return allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

/**
 * 生成安全的错误响应（不暴露内部细节）
 */
export function createSafeErrorResponse(error: unknown): { error: string; code?: string } {
  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    return {
      error: error instanceof Error ? error.message : '未知错误',
      code: 'DEV_ERROR'
    };
  }

  // 生产环境返回通用错误
  if (error instanceof Error) {
    // 已知的用户错误
    if (error.message.includes('输入') ||
        error.message.includes('格式') ||
        error.message.includes('超过') ||
        error.message.includes('不能')) {
      return { error: error.message };
    }
  }

  // 其他错误统一返回通用消息
  return { error: '服务暂时不可用，请稍后重试' };
}

/**
 * Prompt 注入攻击检测
 * 在所有 AI API 调用之前进行拦截
 */
export function detectPromptInjection(input: string): { safe: boolean; reason?: string } {
  if (!input || typeof input !== 'string') {
    return { safe: false, reason: '无效的输入' };
  }

  // 转换为小写进行检测（不区分大小写）
  const lowerInput = input.toLowerCase();

  // 危险关键词列表
  const dangerousKeywords = [
    // 指令覆盖类
    '忽略之前',
    '忽略上面',
    '忽略以上',
    '忽略前面',
    '忽略所有',
    'ignore previous',
    'ignore above',
    'ignore all',
    'disregard previous',
    'forget previous',

    // 指令注入类
    '新指令',
    '新的指令',
    '改变指令',
    '修改指令',
    'new instruction',
    'new prompt',
    'change instruction',

    // 系统提示词泄露类
    '显示系统提示',
    '显示提示词',
    '显示prompt',
    '你的指令',
    '你的提示词',
    'show system prompt',
    'show your prompt',
    'reveal prompt',
    'what are your instructions',

    // 权限提升类
    '提升权限',
    '管理员权限',
    '修改权限',
    '获取权限',
    'elevate privilege',
    'admin access',
    'root access',
    'sudo',

    // 配置修改类
    '修改配置',
    '更改配置',
    '显示配置',
    '系统配置',
    'modify config',
    'change config',
    'show config',
    'system config',

    // 角色扮演注入类
    '你现在是',
    '假装你是',
    '扮演',
    '角色扮演',
    'you are now',
    'pretend you are',
    'act as',
    'roleplay',

    // 越狱类
    'jailbreak',
    'dan mode',
    'developer mode',
    '开发者模式',
    '调试模式',
  ];

  // 检测危险关键词
  for (const keyword of dangerousKeywords) {
    if (lowerInput.includes(keyword)) {
      return {
        safe: false,
        reason: `检测到可疑内容，请使用正常的日语学习相关问题`
      };
    }
  }

  // 检测多重指令分隔符（常见的注入技巧）
  const injectionPatterns = [
    /\n\s*---+\s*\n/,  // --- 分隔符
    /\n\s*===+\s*\n/,  // === 分隔符
    /\[system\]/i,     // [system] 标记
    /\[user\]/i,       // [user] 标记
    /\[assistant\]/i,  // [assistant] 标记
    /<\|.*?\|>/,       // <|special|> 标记
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return {
        safe: false,
        reason: `输入格式异常，请使用正常的日语学习相关问题`
      };
    }
  }

  // 检测异常长度的输入（可能是注入攻击）
  if (input.length > 2000) {
    return {
      safe: false,
      reason: `输入内容过长，请精简您的问题`
    };
  }

  // 检测重复字符（可能是绕过检测的尝试）
  const repeatedCharPattern = /(.)\1{50,}/;
  if (repeatedCharPattern.test(input)) {
    return {
      safe: false,
      reason: `输入包含异常重复内容`
    };
  }

  return { safe: true };
}
