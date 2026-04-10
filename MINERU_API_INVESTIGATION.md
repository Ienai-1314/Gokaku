# 🔍 MinerU API 调查结果

## 问题

你提供的 API Key 是一个 JWT token，来自 **OpenXLab** 服务，不是 MinerU 的 API Key。

### JWT Token 内容
```json
{
  "jti": "66700355",
  "rol": "ROLE_REGISTER",
  "iss": "OpenXLab",
  "iat": 1775800979,
  "clientId": "lkzdx57nvy22jkpq9x2w",
  "uuid": "0e9d94d2-09fd-4530-8235-ebe83a61178dc",
  "exp": 1783576979
}
```

这是 **OpenXLab** 平台的认证 token，不是 MinerU API。

---

## 📊 调查发现

根据搜索结果，MinerU 主要有以下使用方式：

1. **命令行工具** - 本地安装使用
2. **Python SDK** - 作为 Python 库导入
3. **Docker 部署** - 容器化部署

**MinerU 可能没有公开的 REST API 服务。**

---

## 🎯 解决方案

### 方案 A：使用百度 OCR API（推荐）⭐

**优势**:
- ✅ 成熟稳定的商业服务
- ✅ 支持日语识别
- ✅ 准确率高
- ✅ API 简单易用
- ✅ 成本可控（¥50-100）

**实施步骤**:
1. 访问：https://cloud.baidu.com/product/ocr
2. 注册并创建应用
3. 获取 APP_ID, API_KEY, SECRET_KEY
4. 使用我创建的脚本

### 方案 B：本地部署 MinerU

**步骤**:
```bash
# 安装 MinerU
pip install magic-pdf[full]

# 使用命令行
magic-pdf -p 真题.pdf -o output_dir
```

然后使用 DeepSeek 提取题目。

### 方案 C：使用其他 OCR 服务

- **腾讯云 OCR**
- **阿里云 OCR**
- **Google Cloud Vision API**

---

## 💡 我的建议

**立即执行**：使用百度 OCR API

原因：
1. 最成熟稳定
2. 支持日语
3. 成本可控
4. 我可以立即为你创建脚本

---

## 🚀 下一步

告诉我你想：
1. **使用百度 OCR**（我立即创建脚本）
2. **本地部署 MinerU**（需要安装配置）
3. **使用其他 OCR 服务**（告诉我哪个）

---

**更新时间**: 2026-04-10 14:50
**状态**: 等待你的决定
