# API 设计规范

## RESTful API 原则

### 1. HTTP 方法语义
- **GET**: 获取资源（幂等）
- **POST**: 创建资源或执行操作
- **PUT**: 完整更新资源（幂等）
- **PATCH**: 部分更新资源
- **DELETE**: 删除资源（幂等）

### 2. 状态码使用
- **200 OK**: 成功
- **201 Created**: 创建成功
- **400 Bad Request**: 客户端错误（参数错误）
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 无权限
- **404 Not Found**: 资源不存在
- **429 Too Many Requests**: 限流
- **500 Internal Server Error**: 服务器错误

## Next.js API Routes 规范

### 1. 文件结构
```
app/api/
├── query/route.ts          # 语法查询
├── vocab/route.ts          # 词汇查询
├── analyze/route.ts        # 错题分析
├── redeem/route.ts         # 兑换码
└── progress/route.ts       # 学习进度
```

### 2. 标准响应格式
✅ 成功响应：
```typescript
return NextResponse.json({
  success: true,
  data: {
    // 实际数据
  }
}, { status: 200 });
```

❌ 错误响应：
```typescript
return NextResponse.json({
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: '今日免费额度已用完',
    details: {
      used: 3,
      limit: 3
    }
  }
}, { status: 429 });
```

### 3. 请求验证
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    
    // 2. 验证必需参数
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'text 参数必须是非空字符串'
        }
      }, { status: 400 });
    }
    
    // 3. 验证参数长度
    if (body.text.length > 1000) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TEXT_TOO_LONG',
          message: '文本长度不能超过 1000 字符'
        }
      }, { status: 400 });
    }
    
    // 4. 业务逻辑
    // ...
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    }, { status: 500 });
  }
}
```

## 用户识别

### 1. 设备 ID 提取
```typescript
import { getAccountIdFromRequest } from '@/lib/account';

export async function POST(request: NextRequest) {
  // 获取账号 ID（优先设备 ID，降级 IP）
  const accountId = await getAccountIdFromRequest(request);
  
  if (!accountId) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '无法识别用户身份'
      }
    }, { status: 401 });
  }
  
  // 使用 accountId 进行业务逻辑
}
```

### 2. 限流检查
```typescript
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const accountId = await getAccountIdFromRequest(request);
  
  // 检查限流
  const rateLimitResult = await checkRateLimit(accountId, 'query');
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '今日免费额度已用完',
        details: {
          used: rateLimitResult.used,
          limit: rateLimitResult.limit,
          resetAt: rateLimitResult.resetAt
        }
      }
    }, { status: 429 });
  }
  
  // 继续业务逻辑
}
```

## 数据库操作

### 1. 错误处理
```typescript
import { getDb } from '@/lib/cloudbase';

try {
  const db = getDb();
  const result = await db.collection('users').doc(accountId).get();
  
  if (!result.data) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      }
    }, { status: 404 });
  }
  
  // 处理数据
} catch (error) {
  console.error('Database error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: '数据库操作失败'
    }
  }, { status: 500 });
}
```

### 2. 事务操作
```typescript
// 需要原子性的操作使用事务
const db = getDb();
const transaction = db.startTransaction();

try {
  await transaction.collection('accounts').doc(accountId).update({
    quota: db.command.inc(-1)
  });
  
  await transaction.collection('usage_logs').add({
    account_id: accountId,
    action: 'query',
    timestamp: new Date()
  });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## 外部 API 调用

### 1. DeepSeek API
```typescript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery }
    ],
    temperature: 0.7,
    max_tokens: 2000
  })
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(`DeepSeek API error: ${error.message}`);
}

const data = await response.json();
const result = data.choices[0].message.content;
```

### 2. 超时处理
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('请求超时');
  }
  throw error;
}
```

## 安全性

### 1. 输入验证
```typescript
// 防止 XSS
function sanitizeInput(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 防止 SQL 注入（使用参数化查询）
const result = await db.collection('users')
  .where({ account_id: accountId }) // 使用对象而非字符串拼接
  .get();
```

### 2. 敏感信息保护
```typescript
// ❌ 不要在响应中返回敏感信息
return NextResponse.json({
  user: {
    id: user.id,
    email: user.email,
    password: user.password, // ❌ 危险！
    api_key: user.api_key    // ❌ 危险！
  }
});

// ✅ 只返回必要信息
return NextResponse.json({
  user: {
    id: user.id,
    email: user.email,
    displayName: user.displayName
  }
});
```

## Gokaku 项目特定规范

### 1. 统一错误码
```typescript
export const ErrorCodes = {
  // 认证相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
  
  // 限流相关
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // 参数相关
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // 业务相关
  REDEEM_CODE_INVALID: 'REDEEM_CODE_INVALID',
  REDEEM_CODE_USED: 'REDEEM_CODE_USED',
  
  // 系统相关
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
};
```

### 2. 日志记录
```typescript
// 记录关键操作
console.log(`[${new Date().toISOString()}] Query API called`, {
  accountId,
  queryText: text.substring(0, 50), // 只记录前50字符
  success: true
});

// 记录错误
console.error(`[${new Date().toISOString()}] API Error`, {
  accountId,
  error: error.message,
  stack: error.stack
});
```

### 3. 性能监控
```typescript
const startTime = Date.now();

// 业务逻辑
const result = await processQuery(text);

const duration = Date.now() - startTime;
console.log(`Query processed in ${duration}ms`);

// 如果超过阈值，记录警告
if (duration > 5000) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```
