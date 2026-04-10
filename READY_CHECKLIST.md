# 🚀 准备就绪清单

## ✅ 已完成

1. **MinerU 安装**
   - 正在安装 magic-pdf[full]
   - 包含完整 OCR 功能
   - 预计 2-5 分钟完成

2. **提取脚本**
   - ✅ extract_with_mineru.py - PDF 提取
   - ✅ mineru_to_gokaku.py - 格式转换

3. **使用文档**
   - ✅ MINERU_USAGE_GUIDE.md

## 📋 下一步（安装完成后）

### 1️⃣ 测试单个 PDF
```bash
cd C:\Users\Garo\gokaku
python scripts\extract_with_mineru.py
```

### 2️⃣ 检查输出质量
查看生成的 Markdown 文件是否正确识别日语文本

### 3️⃣ 转换为题目格式
```bash
python scripts\mineru_to_gokaku.py
```

### 4️⃣ 批量处理所有真题
修改脚本处理所有 PDF（约 2000 页）

### 5️⃣ 导入数据库
```bash
tsx scripts/import-exam-questions.ts
```

## 🎯 目标

- 提取 2020-2025 年真题（约 1980 题）
- 导入 Gokaku 数据库
- 完善网站功能
- 准备上线

## ⏱️ 预计时间

- MinerU 处理：2-3 小时（2000 页）
- DeepSeek 提取：1-2 小时（1980 题）
- 数据导入：10 分钟
- **总计：3-5 小时**

## 💰 预计成本

- MinerU：免费
- DeepSeek API：¥20-100
- **总计：¥20-100**

---

**状态**: 等待 MinerU 安装完成
**更新**: 2026-04-10 15:05
