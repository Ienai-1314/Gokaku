# React 最佳实践

## Hooks 使用规范

### 1. 只在顶层调用 Hooks
❌ 错误：
```typescript
if (condition) {
  const [state, setState] = useState(0);
}
```

✅ 正确：
```typescript
const [state, setState] = useState(0);
if (condition) {
  // 使用 state
}
```

### 2. useEffect 依赖项完整性
❌ 错误：
```typescript
useEffect(() => {
  fetchData(userId);
}, []); // 缺少 userId 依赖
```

✅ 正确：
```typescript
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 3. 避免不必要的 re-render
使用 useMemo 和 useCallback：
```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

## 组件设计原则

### 1. 单一职责
每个组件只做一件事：
```typescript
// ❌ 组件职责过多
function UserDashboard() {
  // 用户信息、统计、设置、通知...
}

// ✅ 拆分成多个组件
function UserProfile() { }
function UserStats() { }
function UserSettings() { }
```

### 2. Props 类型定义
始终使用 TypeScript 接口：
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function Button({ label, onClick, disabled, variant = 'primary' }: ButtonProps) {
  // ...
}
```

### 3. 避免 Props Drilling
使用 Context 或状态管理：
```typescript
// 创建 Context
const UserContext = createContext<User | null>(null);

// 提供者
<UserContext.Provider value={user}>
  <App />
</UserContext.Provider>

// 消费者
const user = useContext(UserContext);
```

## 性能优化

### 1. 列表渲染使用 key
```typescript
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### 2. 懒加载组件
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 3. 避免内联函数
❌ 错误：
```typescript
<Button onClick={() => handleClick(id)} />
```

✅ 正确：
```typescript
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />
```

## 错误处理

### 1. Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 2. 异步错误处理
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const data = await fetchData();
  setData(data);
} catch (err) {
  setError(err.message);
  console.error('Fetch error:', err);
}
```

## 代码风格

### 1. 组件命名
- 使用 PascalCase：`UserProfile`
- 文件名与组件名一致：`UserProfile.tsx`

### 2. 事件处理命名
- 使用 `handle` 前缀：`handleClick`, `handleSubmit`
- Props 使用 `on` 前缀：`onClick`, `onSubmit`

### 3. 布尔值命名
- 使用 `is`, `has`, `should` 前缀：`isLoading`, `hasError`, `shouldShow`

## Gokaku 项目特定规范

### 1. API 调用
使用统一的 `apiFetch` 工具：
```typescript
import { apiFetch } from '@/lib/api-client';

const response = await apiFetch('/api/query', {
  method: 'POST',
  body: JSON.stringify({ text })
});
```

### 2. 错误提示
使用统一的错误样式：
```typescript
{error && (
  <div className="text-red-600 text-sm mt-2">
    ⚠️ {error}
  </div>
)}
```

### 3. 加载状态
使用统一的加载指示器：
```typescript
{loading ? (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C75B3B]"></div>
  </div>
) : (
  <Content />
)}
```
