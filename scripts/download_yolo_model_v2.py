"""
使用 Python 下载 MinerU YOLO 模型
"""
import requests
import os
from pathlib import Path

def download_yolo_model():
    """下载 YOLO 模型文件"""

    # 模型保存路径
    model_path = Path(r"C:\Users\Garo\.magic-pdf\models\MFD\YOLO\yolo_v8_ft.pt")
    model_path.parent.mkdir(parents=True, exist_ok=True)

    # 尝试多个下载源
    urls = [
        "https://github.com/opendatalab/MinerU/releases/download/v0.9.0/yolo_v8_ft.pt",
        "https://huggingface.co/wanderkid/PDF-Extract-Kit/resolve/main/models/MFD/YOLO/yolo_v8_ft.pt",
        "https://hf-mirror.com/wanderkid/PDF-Extract-Kit/resolve/main/models/MFD/YOLO/yolo_v8_ft.pt",
    ]

    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}] Trying: {url}")

        try:
            # 发送请求
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()

            # 获取文件大小
            total_size = int(response.headers.get('content-length', 0))
            print(f"File size: {total_size / 1024 / 1024:.2f} MB")

            # 下载文件
            downloaded = 0
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\rProgress: {percent:.1f}%", end='', flush=True)

            print(f"\nDownloaded successfully to: {model_path}")
            print(f"File size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
            return True

        except Exception as e:
            print(f"Failed: {e}")
            if model_path.exists():
                model_path.unlink()  # 删除不完整的文件
            continue

    print("\nAll download sources failed!")
    print("\nPlease manually download from:")
    print("https://github.com/opendatalab/MinerU/releases")
    print(f"And save to: {model_path}")
    return False

if __name__ == "__main__":
    print("Downloading MinerU YOLO model...")
    print("=" * 60)
    success = download_yolo_model()

    if success:
        print("\n" + "=" * 60)
        print("Model download completed!")
        print("You can now run PDF extraction.")
    else:
        print("\n" + "=" * 60)
        print("Download failed. Please download manually.")
