# Gokaku 安全防护文档

## 安全威胁清单

### 1. XSS (跨站脚本攻击)
**风险点：**
- 用户输入的日语句子
- AI返回的分析结果
- 收藏/历史记录中的内容
- 兑换码输入

**防护措施：**
- ✅ React自动转义HTML
- ✅ ReactMarkdown配置安全组件
- ⚠️ 需要添加：输入内容长度限制
- ⚠️ 需要添加：危险字符过滤

### 2. SQL注入 / NoSQL注入
**风险点：**
- CloudBase数据库查询
- 用户IP记录
- 兑换码查询

**防护措施：**
- ✅ CloudBase SDK自动参数化查询
- ⚠️ 需要添加：输入验证和清洗

### 3. CSRF (跨站请求伪造)
**风险点：**
- API调用（analyze, query, vocab等）
- 兑换码激活
- 收藏/历史操作

**防护措施：**
- ⚠️ 需要添加：CSRF Token验证
- ⚠️ 需要添加：Referer检查

### 4. 恶意爬虫/DDoS
**风险点：**
- AI API调用（成本高）
- 数据库读写
- 兑换码暴力破解

**防护措施：**
- ✅ IP限流（每日3次免费）
- ✅ 兑换码格式验证
- ⚠️ 需要添加：请求频率限制（每分钟最多10次）
- ⚠️ 需要添加：Cloudflare防护

### 5. 敏感信息泄露
**风险点：**
- 环境变量暴露
- 错误信息泄露
- 用户IP记录

**防护措施：**
- ✅ .env.local不提交到git
- ⚠️ 需要添加：生产环境错误处理
- ⚠️ 需要添加：IP脱敏存储

### 6. 恶意文件上传
**风险点：**
- OCR图片上传

**防护措施：**
- ⚠️ 需要添加：文件类型白名单
- ⚠️ 需要添加：文件大小限制（5MB）
- ⚠️ 需要添加：图片格式验证

---

## 立即需要实施的安全加固

### Phase 1: 输入验证和清洗 (优先级：高)
```typescript
// lib/security.ts
export function sanitizeInput(input: string, maxLength: number = 500): string {
  // 1. 长度限制
  if (input.length > maxLength) {
    throw new Error('输入内容过长');
  }
  
  // 2. 移除危险字符
  const dangerous = /<script|javascript:|onerror=|onclick=/gi;
  if (dangerous.test(input)) {
    throw new Error('输入包含非法字符');
  }
  
  // 3. 清理空白字符
  return input.trim();
}

export function validateRedeemCode(code: string): boolean {
  // 严格格式验证：GOKAKU-XXXX-XXXX
  return /^GOKAKU-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

export function hashIP(ip: string): string {
  // IP脱敏：只保留前两段
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}
```

### Phase 2: 请求频率限制 (优先级：高)
```typescript
// lib/ratelimit.ts 增强版
export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  const key = `ratelimit:${action}:${ip}`;
  const now = Date.now();
  
  // 每分钟最多10次请求
  const requests = await getRequestCount(key, now - 60000);
  if (requests >= 10) {
    throw new Error('请求过于频繁，请稍后再试');
  }
  
  await recordRequest(key, now);
  return true;
}
```

### Phase 3: CSRF防护 (优先级：中)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 检查Referer
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (referer && !referer.includes(host)) {
    return new Response('Invalid request', { status: 403 });
  }
  
  return NextResponse.next();
}
```

### Phase 4: 错误处理 (优先级：中)
```typescript
// app/api/*/route.ts 统一错误处理
try {
  // API逻辑
} catch (error) {
  console.error('[API Error]', error); // 服务端日志
  
  // 生产环境不暴露详细错误
  return NextResponse.json(
    { error: '服务暂时不可用，请稍后重试' },
    { status: 500 }
  );
}
```

---

## 备份和恢复策略

### 自动备份
1. **代码备份：** Git + GitHub（已完成）
2. **数据库备份：** CloudBase自动备份（每日）
3. **配置备份：** 环境变量文档化

### 快速恢复流程
1. 克隆仓库：`git clone https://github.com/yourusername/gokaku.git`
2. 安装依赖：`npm install`
3. 配置环境变量：复制 `.env.example` 到 `.env.local`
4. 恢复数据库：从CloudBase控制台导入备份
5. 部署：`npm run build && npm start`

### 攻击响应预案
1. **发现攻击：** 立即停止服务（Vercel暂停部署）
2. **分析日志：** 查看CloudBase日志和Vercel日志
3. **修复漏洞：** 根据攻击类型实施对应防护
4. **恢复数据：** 从最近备份恢复
5. **重新部署：** 加固后重新上线

---

## 监控和告警

### 需要监控的指标
- [ ] API调用频率异常（突然暴增）
- [ ] 错误率异常（大量500错误）
- [ ] 数据库读写异常
- [ ] 兑换码激活异常（短时间大量激活）
- [ ] 用户IP分布异常（单一IP大量请求）

### 告警渠道
- CloudBase控制台告警
- Vercel部署失败通知
- 自定义监控脚本（可选）

---

## 安全检查清单（上线前必查）

- [ ] 所有API路由添加输入验证
- [ ] 所有用户输入添加长度限制
- [ ] 敏感操作添加频率限制
- [ ] 错误信息不暴露内部细节
- [ ] 环境变量不提交到git
- [ ] HTTPS强制启用
- [ ] CSP (Content Security Policy) 配置
- [ ] 数据库访问权限最小化
- [ ] 定期更新依赖包（npm audit）
- [ ] 代码审计（eslint security插件）

---

## 依赖安全

### 定期检查
```bash
npm audit
npm audit fix
```

### 关键依赖
- `next`: 保持最新稳定版
- `react`: 保持最新稳定版
- `@cloudbase/node-sdk`: 官方SDK，定期更新
- `openai`: 官方SDK，定期更新

---

## 联系方式

如发现安全漏洞，请联系：
- Email: [你的邮箱]
- 不要公开披露，先私下报告
