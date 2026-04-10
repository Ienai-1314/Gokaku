"""
检查 MinerU KIE Pipeline 配置状态
"""
from mineru_kie_sdk import MineruKIEClient
import json

PIPELINE_ID = "432397c4-08bb-489e-881b-71e1ace8e821"

def check_pipeline_status():
    """检查 Pipeline 配置状态"""
    print(f"Checking Pipeline: {PIPELINE_ID}")

    client = MineruKIEClient(pipeline_id=PIPELINE_ID)

    # 尝试获取结果（不上传文件）
    try:
        result = client.get_result(file_ids=[], timeout=5)
        print("\n✅ Pipeline 配置正常")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"\n❌ Pipeline 配置错误: {e}")
        print("\n需要在 mineru.net 网站上配置 Pipeline 步骤：")
        print("1. 访问 https://mineru.net/apiManage/kie-sdk")
        print("2. 找到 Pipeline ID: 432397c4-08bb-489e-881b-71e1ace8e821")
        print("3. 配置处理步骤（Parse、Split、Extract）")
        print("4. 保存配置后重新运行此脚本")

if __name__ == "__main__":
    check_pipeline_status()
