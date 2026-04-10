# 🎯 简化方案：直接开始提取

DataFlow 的完整依赖安装比较复杂。我为你准备了两个方案：

## 方案 A：继续完善 DataFlow 安装（推荐）

DataFlow 依赖很多，但我们只需要其中的核心模块。让我创建一个最小化的提取脚本。

## 方案 B：使用备用方案（更快）

如果 DataFlow 安装继续遇到问题，可以使用：

### 百度 OCR API（最实用）
- 成本：¥50-100
- 时间：1-2 天
- 准确率：高

### 实施步骤
```bash
pip install baidu-aip pdf2image
```

```python
from aip import AipOcr
from pdf2image import convert_from_path

# 初始化
client = AipOcr(APP_ID, API_KEY, SECRET_KEY)

# PDF 转图片 + OCR
images = convert_from_path('真题.pdf')
for img in images:
    result = client.basicGeneral(img)
    text = '\n'.join([w['words'] for w in result['words_result']])
    
    # 使用 DeepSeek 提取题目
    questions = extract_with_deepseek(text)
```

---

## 🎯 我的建议

考虑到时间效率，建议：

1. **先申请 MinerU API Key**（无论哪个方案都需要）
2. **如果 MinerU 可用**：继续使用 DataFlow
3. **如果 MinerU 不可用**：使用百度 OCR

---

## 📞 你的决定

告诉我你想：
- A. 继续完善 DataFlow 安装
- B. 切换到百度 OCR 方案
- C. 先申请 MinerU API Key，看看是否可用

我会根据你的选择继续！
