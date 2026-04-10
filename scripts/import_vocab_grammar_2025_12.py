"""
导入 2025-12 词汇与语法题（31-40）到数据库
使用 CloudBase SDK 直接写入
"""
import json
import os
from pathlib import Path
import cloudbase
from dotenv import load_dotenv

load_dotenv("C:/Users/Garo/gokaku/.env.local")

INPUT_FILE = Path(r"C:/Users/Garo/gokaku/output/questions_2025_12_vocab_grammar_gokaku.json")


def get_db():
    app = cloudbase.init({
        "env": os.getenv("TCB_ENV_ID"),
        "secretId": os.getenv("TCB_SECRET_ID"),
        "secretKey": os.getenv("TCB_SECRET_KEY"),
    })
    return app.database()


def main():
    data = json.loads(INPUT_FILE.read_text(encoding="utf-8"))
    db = get_db()
    col = db.collection("exam_questions")

    inserted = 0
    skipped = 0

    for item in data:
        try:
            existing = col.where({
                "paperId": item["paperId"],
                "questionNumber": item["questionNumber"]
            }).get()
            existing_data = existing.get("data") if isinstance(existing, dict) else getattr(existing, "data", None)
            if existing_data:
                print(f"skip existing: {item['questionNumber']}")
                skipped += 1
                continue
        except Exception:
            pass

        col.add(item)
        inserted += 1
        print(f"inserted: {item['questionNumber']}")

    print(f"done, inserted {inserted}, skipped {skipped}")

if __name__ == "__main__":
    main()
