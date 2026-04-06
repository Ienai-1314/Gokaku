#!/usr/bin/env node

/**
 * Gokaku Harness 系统 - Orchestrator（总调度）
 *
 * 职责：
 * 1. 接收用户需求，分析意图
 * 2. 将任务分配给专门的 Agent
 * 3. 监控任务进度，汇总报告
 * 4. 处理 Agent 间的依赖关系
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// 加载配置
const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../.harness/settings.json'), 'utf-8')
);

// 初始化 Anthropic 客户端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 任务队列
const taskQueue = [];
const taskResults = new Map();

/**
 * 分析用户需求，提取意图和关键词
 */
async function analyzeIntent(userRequest) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `分析以下用户需求，提取意图和关键词。返回 JSON 格式：
{
  "intent": "feature|bug|test|deploy|architecture",
  "priority": "critical|high|medium|low",
  "keywords": ["关键词1", "关键词2"],
  "description": "简短描述"
}

用户需求：${userRequest}`
    }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

/**
 * 根据意图分配 Agent
 */
function assignAgents(intent) {
  const { intent: intentType, priority } = intent;

  // 检查优先级规则
  for (const [ruleName, rule] of Object.entries(settings.task_routing.priority_rules)) {
    if (intentType === ruleName.replace('_', ' ')) {
      return rule.agents;
    }
  }

  // 根据关键词匹配
  const agents = new Set();
  for (const keyword of intent.keywords) {
    const matchedAgents = settings.task_routing.keywords[keyword.toLowerCase()];
    if (matchedAgents) {
      matchedAgents.forEach(agent => agents.add(agent));
    }
  }

  // 如果没有匹配，使用默认工作流
  if (agents.size === 0) {
    const workflow = settings.workflow[`${intentType}_development`] || settings.workflow.feature_development;
    return workflow;
  }

  return Array.from(agents);
}

/**
 * 创建任务
 */
function createTask(userRequest, intent, agents) {
  const taskId = `TASK-${Date.now()}`;
  const task = {
    id: taskId,
    request: userRequest,
    intent,
    agents,
    status: 'pending',
    createdAt: new Date().toISOString(),
    results: []
  };

  taskQueue.push(task);
  return task;
}

/**
 * 执行 Agent
 */
async function executeAgent(agentName, task) {
  console.log(`\n🤖 启动 Agent: ${agentName}`);
  console.log(`📋 任务ID: ${task.id}`);

  const agentConfig = settings.agents[agentName];
  if (!agentConfig || !agentConfig.enabled) {
    console.error(`❌ Agent ${agentName} 未启用或不存在`);
    return null;
  }

  // 加载技能
  const skills = agentConfig.skills || [];
  const skillsContent = skills.map(skillName => {
    const skillPath = path.join(__dirname, `../.harness/skills/${skillName}.md`);
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, 'utf-8');
    }
    return '';
  }).join('\n\n');

  // 构建系统提示词
  const systemPrompt = `你是 ${agentConfig.name}，角色是 ${agentConfig.role}。

## 职责
${agentConfig.capabilities.map(cap => `- ${cap}`).join('\n')}

## 可用工具
${agentConfig.tools.map(tool => `- ${tool}`).join('\n')}

## 技能和规范
${skillsContent}

## 当前任务
${JSON.stringify(task, null, 2)}

请完成任务并报告结果。使用以下格式：

## 执行内容
- 具体做了什么

## 关键决策
- 为什么这样做
- 考虑了哪些方案

## 输出产物
- 代码文件列表
- 文档链接

## 遇到的问题
- 问题描述
- 解决方案

## 下一步建议
- 后续任务
- 依赖关系
`;

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: agentConfig.model,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: task.request
      }]
    });

    const duration = Date.now() - startTime;
    const result = {
      agent: agentName,
      status: 'success',
      output: response.content[0].text,
      duration,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Agent ${agentName} 完成 (${duration}ms)`);
    return result;

  } catch (error) {
    console.error(`❌ Agent ${agentName} 失败:`, error.message);
    return {
      agent: agentName,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 执行任务
 */
async function executeTask(task) {
  console.log(`\n📌 开始执行任务: ${task.id}`);
  console.log(`📝 描述: ${task.intent.description}`);
  console.log(`👥 分配的 Agents: ${task.agents.join(', ')}`);

  task.status = 'running';

  // 按顺序执行 Agents
  for (const agentName of task.agents) {
    const result = await executeAgent(agentName, task);
    if (result) {
      task.results.push(result);
      taskResults.set(`${task.id}-${agentName}`, result);
    }

    // 如果是关键 Agent 失败，停止执行
    if (result && result.status === 'failed' &&
        ['architect', 'bug_fixer'].includes(agentName)) {
      console.log(`⚠️ 关键 Agent ${agentName} 失败，停止任务`);
      task.status = 'failed';
      return task;
    }
  }

  task.status = 'completed';
  task.completedAt = new Date().toISOString();

  return task;
}

/**
 * 生成任务报告
 */
function generateReport(task) {
  console.log(`\n📊 任务报告: ${task.id}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`状态: ${task.status === 'completed' ? '✅ 完成' : '❌ 失败'}`);
  console.log(`开始时间: ${task.createdAt}`);
  console.log(`结束时间: ${task.completedAt || '进行中'}`);
  console.log(`\n执行的 Agents:`);

  for (const result of task.results) {
    console.log(`\n🤖 ${result.agent} (${result.status})`);
    console.log(`⏱️  耗时: ${result.duration}ms`);
    if (result.status === 'success') {
      console.log(`\n${result.output}`);
    } else {
      console.log(`❌ 错误: ${result.error}`);
    }
    console.log(`\n${'─'.repeat(60)}`);
  }

  // 保存报告到文件
  const reportPath = path.join(__dirname, `../logs/task-${task.id}.md`);
  const reportContent = `# 任务报告: ${task.id}

## 基本信息
- **状态**: ${task.status}
- **优先级**: ${task.intent.priority}
- **创建时间**: ${task.createdAt}
- **完成时间**: ${task.completedAt || '进行中'}

## 任务描述
${task.intent.description}

## 执行结果

${task.results.map(result => `
### ${result.agent}
- **状态**: ${result.status}
- **耗时**: ${result.duration}ms
- **时间**: ${result.timestamp}

${result.status === 'success' ? result.output : `错误: ${result.error}`}
`).join('\n---\n')}
`;

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📄 报告已保存: ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
  const userRequest = process.argv[2];

  if (!userRequest) {
    console.error('用法: node orchestrator.js "用户需求描述"');
    process.exit(1);
  }

  console.log('🚀 Gokaku Harness 系统启动');
  console.log(`📝 用户需求: ${userRequest}`);

  // 1. 分析意图
  console.log('\n🔍 分析意图...');
  const intent = await analyzeIntent(userRequest);
  console.log('✅ 意图分析完成:', JSON.stringify(intent, null, 2));

  // 2. 分配 Agents
  const agents = assignAgents(intent);
  console.log(`\n👥 分配 Agents: ${agents.join(', ')}`);

  // 3. 创建任务
  const task = createTask(userRequest, intent, agents);

  // 4. 执行任务
  await executeTask(task);

  // 5. 生成报告
  generateReport(task);

  console.log('\n✨ 任务完成！');
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 系统错误:', error);
    process.exit(1);
  });
}

module.exports = { analyzeIntent, assignAgents, executeTask };
