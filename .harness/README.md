# Harness 多 Agent 协作系统使用指南

## 快速开始

### 1. 安装依赖

```bash
cd /c/Users/Garo/gokaku
npm install @anthropic-ai/sdk
```

### 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. 运行 Orchestrator

```bash
node .harness/orchestrator.js "你的需求描述"
```

## 使用示例

### 示例 1：开发新功能

```bash
node .harness/orchestrator.js "实现每日一题功能，包括题目推送、答题记录、连续打卡统计"
```

**系统会自动：**
1. 分析意图 → 识别为 feature 开发
2. 分配 Agents → Architect + Feature Developer + Tester
3. 执行任务 → 设计方案 → 编写代码 → 测试验证
4. 生成报告 → 保存到 `logs/task-XXXX.md`

---

### 示例 2：修复 Bug

```bash
node .harness/orchestrator.js "修复生产环境振假名功能报错的问题"
```

**系统会自动：**
1. 分析意图 → 识别为 bug 修复
2. 分配 Agents → Bug Fixer + Tester
3. 执行任务 → 诊断问题 → 修复代码 → 回归测试
4. 生成报告 → 包含根因分析和修复方案

---

### 示例 3：优化性能

```bash
node .harness/orchestrator.js "优化首页加载速度，减少 API 调用次数"
```

**系统会自动：**
1. 分析意图 → 识别为 architecture 优化
2. 分配 Agents → Architect + Feature Developer
3. 执行任务 → 性能分析 → 优化方案 → 实施改进
4. 生成报告 → 包含性能对比数据

---

## 通过 Claude Code 使用（当前方式）

你也可以直接在 Claude Code 中使用 Agent 工具：

```
使用 Agent 工具开发新功能
```

Claude Code 会自动：
1. 启动专门的 Agent（Feature Developer、Bug Fixer 等）
2. Agent 在后台独立工作
3. 完成后自动通知你
4. 生成详细的任务报告

**优势：**
- 无需手动运行脚本
- 多个 Agent 可并行工作
- 自动处理文件冲突
- 实时进度通知

---

## Agent 角色说明

### 1. Orchestrator（总调度）
- **职责**：任务分发、进度监控、报告汇总
- **触发**：运行 orchestrator.js 脚本
- **输出**：任务报告（logs/task-XXXX.md）

### 2. Feature Developer（功能开发）
- **职责**：实现新功能、编写代码、创建测试
- **触发**：关键词 feature、implement、create
- **输出**：代码文件、测试用例、技术文档

### 3. Bug Fixer（Bug 修复）
- **职责**：诊断问题、修复缺陷、添加回归测试
- **触发**：关键词 bug、fix、error
- **输出**：修复代码、根因分析、测试用例

### 4. Tester（测试工程师）
- **职责**：自动化测试、手动测试、生产验证
- **触发**：关键词 test、verify、validate
- **输出**：测试报告、Bug 清单、性能指标

### 5. Architect（架构师）
- **职责**：技术决策、架构设计、Code Review
- **触发**：关键词 architecture、design、optimize
- **输出**：技术方案、架构图、开发规范

### 6. DevOps（部署运维）
- **职责**：构建、部署、监控
- **触发**：关键词 deploy、build、release
- **输出**：部署日志、构建报告、监控告警

---

## 任务路由规则

系统会根据关键词自动分配 Agent：

| 关键词 | 分配的 Agent |
|--------|-------------|
| feature, implement, create | Feature Developer |
| bug, fix, error | Bug Fixer |
| test, verify, validate | Tester |
| deploy, build, release | DevOps |
| architecture, design, optimize | Architect |

---

## 技能库（Skills）

所有 Agent 共享的规则和最佳实践：

- **react_best_practices.md** - React 开发规范
- **api_design.md** - API 设计规范
- **testing_strategy.md** - 测试策略（待添加）
- **git_workflow.md** - Git 工作流（待添加）

添加新技能：

```bash
# 创建新技能文件
touch .harness/skills/your_skill.md

# 在 settings.json 中注册
# 添加到对应 Agent 的 skills 数组
```

---

## 查看任务报告

所有任务报告保存在 `logs/` 目录：

```bash
# 查看最新报告
ls -lt logs/

# 查看具体报告
cat logs/task-1234567890.md
```

报告包含：
- 任务基本信息
- 执行内容
- 关键决策
- 输出产物
- 遇到的问题
- 下一步建议

---

## 高级用法

### 并行开发多个功能

```bash
# 启动多个 orchestrator 实例
node .harness/orchestrator.js "开发每日一题功能" &
node .harness/orchestrator.js "优化错题本性能" &
node .harness/orchestrator.js "添加学习统计图表" &
```

### 自定义 Agent 配置

编辑 `.harness/settings.json`：

```json
{
  "agents": {
    "your_custom_agent": {
      "name": "Your Agent",
      "role": "自定义角色",
      "model": "claude-sonnet-4-6",
      "enabled": true,
      "capabilities": ["能力1", "能力2"],
      "tools": ["Read", "Write", "Edit"],
      "skills": ["react_best_practices"]
    }
  }
}
```

### 定时任务

使用 cron 定时执行健康检查：

```bash
# 每天 9:00 执行健康检查
0 9 * * * cd /c/Users/Garo/gokaku && node .harness/orchestrator.js "执行系统健康检查"
```

---

## 故障排查

### 问题 1：找不到 @anthropic-ai/sdk

```bash
npm install @anthropic-ai/sdk
```

### 问题 2：ANTHROPIC_API_KEY 未设置

检查 `.env.local` 文件是否包含 API Key。

### 问题 3：Agent 执行失败

查看 `logs/task-XXXX.md` 中的错误信息，检查：
- API Key 是否有效
- 网络连接是否正常
- 文件权限是否正确

---

## 最佳实践

1. **明确需求** - 提供清晰、具体的任务描述
2. **合理拆分** - 大任务拆分成多个小任务
3. **及时审查** - 定期查看任务报告，确认方向正确
4. **持续优化** - 根据实际使用情况调整 Agent 配置
5. **记录经验** - 将常见问题和解决方案添加到技能库

---

## 贡献指南

欢迎添加新的 Agent、技能和工具：

1. Fork 项目
2. 创建新分支
3. 添加你的改进
4. 提交 Pull Request

---

## 许可证

MIT License
