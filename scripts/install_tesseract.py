#!/usr/bin/env python3
"""
自动下载并安装 Tesseract OCR（Windows）
包含日语语言包
"""

import os
import sys
import urllib.request
import subprocess
from pathlib import Path

# Tesseract Windows安装程序下载地址
TESSERACT_INSTALLER_URL = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
INSTALLER_PATH = Path.home() / "Downloads" / "tesseract-installer.exe"

def download_tesseract():
    """下载Tesseract安装程序"""
    print("正在下载 Tesseract OCR 安装程序...")
    print(f"下载地址: {TESSERACT_INSTALLER_URL}")
    print(f"保存到: {INSTALLER_PATH}")

    try:
        urllib.request.urlretrieve(TESSERACT_INSTALLER_URL, INSTALLER_PATH)
        print(f"✅ 下载完成: {INSTALLER_PATH}")
        return True
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return False

def install_tesseract():
    """运行安装程序"""
    print("\n正在启动安装程序...")
    print("⚠️  安装时请确保勾选：")
    print("   - Additional language data (download)")
    print("   - Japanese (jpn.traineddata)")

    try:
        # 静默安装（可选）
        # subprocess.run([str(INSTALLER_PATH), '/S'], check=True)

        # 交互式安装
        subprocess.run([str(INSTALLER_PATH)], check=True)
        print("✅ 安装完成")
        return True
    except Exception as e:
        print(f"❌ 安装失败: {e}")
        return False

def verify_installation():
    """验证安装"""
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        print(f"\n✅ Tesseract已安装: {tesseract_path}")

        # 测试运行
        try:
            result = subprocess.run([tesseract_path, '--version'],
                                  capture_output=True, text=True)
            print("\n版本信息:")
            print(result.stdout)
            return True
        except Exception as e:
            print(f"❌ 运行测试失败: {e}")
            return False
    else:
        print(f"\n❌ Tesseract未找到: {tesseract_path}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Tesseract OCR 自动安装工具")
    print("=" * 60)

    # 检查是否已安装
    if verify_installation():
        print("\n✅ Tesseract已安装，无需重复安装")
        sys.exit(0)

    # 下载安装程序
    if not download_tesseract():
        print("\n手动下载地址：")
        print("https://github.com/UB-Mannheim/tesseract/wiki")
        sys.exit(1)

    # 运行安装
    print("\n请按照安装向导完成安装")
    print("安装完成后，重新运行此脚本验证")

    input("\n按回车键开始安装...")
    install_tesseract()

    # 验证安装
    print("\n验证安装...")
    if verify_installation():
        print("\n✅ 安装成功！现在可以运行 extract_pdf_simple.py")
    else:
        print("\n❌ 安装验证失败，请手动检查")
