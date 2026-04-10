# 🚀 Gokaku 真题提取 - 快速启动清单

## ✅ 当前进度

- [x] 克隆 DataFlow 仓库
- [x] 研究 PDF2VQA 流水线
- [x] 创建 JLPT 提取脚本
- [x] 创建数据转换脚本
- [x] 编写完整文档
- [ ] 安装 DataFlow（进行中）
- [ ] 申请 MinerU API Key
- [ ] 测试提取

---

## 📋 你需要做的事情

### 1️⃣ 申请 MinerU API Key（最重要！）

**步骤**:
1. 访问: https://mineru.net/
2. 注册账号
3. 进入 API 管理: https://mineru.net/apiManage/docs
4. 获取 API Key
5. 配置到环境变量:

```bash
# 编辑 C:\Users\Garo\gokaku\.env.local
# 添加这一行:
MINERU_API_KEY=你的_api_key_这里
```

### 2️⃣ 等待 DataFlow 安装完成

我已经在后台运行安装命令，等待完成后验证:

```bash
cd C:/Users/Garo/DataFlow
python -c "import dataflow; print('✅ DataFlow 安装成功')"
```

### 3️⃣ 测试提取单个 PDF

```bash
cd C:/Users/Garo/gokaku
python scripts/jlpt_extract_simple.py
```

这会提取第一个 PDF 并输出到 `jlpt_output/` 目录。

### 4️⃣ 检查提取结果

查看文件:
- `jlpt_output/cache/jlpt_step1.json` - 最终提取的题目
- `jlpt_output/intermediate/*.md` - MinerU 生成的 Markdown

### 5️⃣ 导入数据库

```bash
python scripts/convert_dataflow_to_gokaku.py
```

---

## 📂 关键文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 提取脚本 | `C:\Users\Garo\gokaku\scripts\jlpt_extract_simple.py` | 主提取脚本 |
| 转换脚本 | `C:\Users\Garo\gokaku\scripts\convert_dataflow_to_gokaku.py` | 数据转换 |
| 使用指南 | `C:\Users\Garo\gokaku\docs\JLPT_EXTRACTION_GUIDE.md` | 完整文档 |
| 项目总结 | `C:\Users\Garo\gokaku\docs\PROJECT_COMPLETE_SUMMARY.md` | 项目概览 |
| PDF 资源 | `D:\量化n1\资料\A 日语N1\` | 真题 PDF |
| DataFlow | `C:\Users\Garo\DataFlow\` | 工具仓库 |

---

## 🔧 故障排查

### 问题: DataFlow 安装失败
```bash
# 方案 1: 使用 uv 加速
pip install uv
uv pip install open-dataflow

# 方案 2: 使用国内镜像
pip install open-dataflow -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题: MinerU API 调用失败
- 检查 API Key 是否正确配置
- 检查网络连接
- 查看 MinerU 官网状态

### 问题: DeepSeek 提取不准确
- 调整 `jlpt_extract_simple.py` 中的 `_build_prompt()` 方法
- 增加示例题目（few-shot learning）
- 使用更强的模型: `deepseek-reasoner`

---

## 💰 成本预估

| 服务 | 单价 | 用量 | 总计 |
|------|------|------|------|
| MinerU API | ¥0.01-0.05/页 | 2000 页 | ¥20-100 |
| DeepSeek API | ¥0.001/1K tokens | 1980 题 × 500 tokens | ¥1-2 |
| **总计** | | | **¥21-102** |

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 具体的错误信息
2. 你执行的命令
3. 相关的日志输出

我会帮你解决！

---

## 🎯 下一步

完成上述步骤后，你将拥有：
- ✅ 约 1980 道 JLPT N1 真题
- ✅ 完整的题目数据库
- ✅ 可以上线的 Gokaku 网站

**预计时间**: 2-3 天（主要是 API 调用时间）

---

**创建时间**: 2026-04-10 14:05
**状态**: 等待 MinerU API Key
