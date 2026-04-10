"""
使用 MinerU KIE SDK 提取 PDF 真题
根据 https://mineru.net/apiManage/kie-sdk 文档
"""
import os
from pathlib import Path
from mineru_kie_sdk import MineruKIEClient

# 从截图中的 Pipeline ID
PIPELINE_ID = "432397c4-08bb-489e-881b-71e1ace8e821"

# 从环境变量获取 API Key
API_KEY = os.getenv('MINERU_API_KEY', '')

def extract_pdf_with_kie(pdf_path: str, output_dir: str):
    """
    使用 MinerU KIE SDK 提取 PDF

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    print(f"Extracting PDF: {pdf_path}")
    print(f"Pipeline ID: {PIPELINE_ID}")

    # 创建客户端（不需要 api_key 参数）
    client = MineruKIEClient(
        pipeline_id=PIPELINE_ID
    )

    # 上传 PDF
    print("Uploading PDF...")
    file_ids = client.upload_file(pdf_path)
    print(f"Uploaded file IDs: {file_ids}")

    # 获取处理结果（轮询直到完成）
    print("Processing PDF (this may take a while)...")
    result = client.get_result(file_ids=file_ids, timeout=300, poll_interval=10)

    # 保存结果
    output_path = Path(output_dir) / f"{Path(pdf_path).stem}_result.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        import json
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Result saved to: {output_path}")
    return result

if __name__ == "__main__":
    # 测试提取第一个 PDF
    pdf_dir = r"D:\量化n1\资料\A 日语N1"
    pdf_files = list(Path(pdf_dir).glob("**/*.pdf"))

    if pdf_files:
        test_pdf = pdf_files[0]
        print(f"Testing with: {test_pdf}")

        result = extract_pdf_with_kie(
            str(test_pdf),
            r"C:\Users\Garo\gokaku\data\mineru_output"
        )

        print("\n✅ Extraction completed!")
        print(f"Result keys: {result.keys() if isinstance(result, dict) else type(result)}")
    else:
        print("No PDF files found!")
