# MinerU KIE SDK 配置指南

## 问题诊断

✅ **已完成：**
- MinerU KIE SDK 安装成功
- PDF 上传成功（file_id: 6014）

❌ **当前问题：**
```
requests.exceptions.RequestException: 请求失败: no steps configured
```

## 原因分析

Pipeline ID `432397c4-08bb-489e-881b-71e1ace8e821` 在 mineru.net 网站上**没有配置处理步骤**。

根据 MinerU KIE SDK 文档，Pipeline 需要配置三个步骤：
1. **Parse**（解析）- 将 PDF 转换为结构化数据
2. **Split**（分割）- 将文档分割为段落/章节
3. **Extract**（提取）- 提取关键信息

## 解决方案

### 方案 1：在 mineru.net 网站上配置 Pipeline（推荐）

1. 访问：https://mineru.net/apiManage/kie-sdk
2. 登录账号
3. 找到 Pipeline ID: `432397c4-08bb-489e-881b-71e1ace8e821`
4. 点击"配置"或"编辑"
5. 添加处理步骤：
   - ✅ Parse（解析 PDF）
   - ✅ Split（分割文档）
   - ✅ Extract（提取信息）
6. 保存配置
7. 重新运行脚本：`python scripts/extract_with_mineru_kie.py`

### 方案 2：创建新的 Pipeline

如果无法配置现有 Pipeline，可以在 mineru.net 创建新的：

1. 访问：https://mineru.net/apiManage/kie-sdk
2. 点击"创建 Pipeline"
3. 配置处理步骤（Parse + Split + Extract）
4. 复制新的 Pipeline ID
5. 更新脚本中的 `PIPELINE_ID`

### 方案 3：使用 DataFlow 本地处理

如果 MinerU KIE SDK 配置复杂，可以使用 DataFlow 本地处理：

```bash
cd D:\量化n1\DataFlow
python scripts/jlpt_extract_simple.py
```

## 当前状态

- SDK 已安装：✅
- PDF 可上传：✅
- Pipeline 配置：❌（需要在网站上配置）

## 下一步

请选择：
- **A**: 在 mineru.net 配置 Pipeline（需要你登录网站操作）
- **B**: 创建新的 Pipeline
- **C**: 改用 DataFlow 本地处理
