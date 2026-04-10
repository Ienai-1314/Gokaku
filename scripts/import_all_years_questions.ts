import { readFileSync } from 'fs';
import { config } from 'dotenv';
import cloudbase from '@cloudbase/node-sdk';

config({ path: 'C:/Users/Garo/gokaku/.env.local' });

const app = cloudbase.init({
  env: process.env.TCB_ENV_ID!,
  secretId: process.env.TCB_SECRET_ID!,
  secretKey: process.env.TCB_SECRET_KEY!,
});
const db = app.database();

async function main() {
  const raw = readFileSync('C:/Users/Garo/gokaku/output/parsed_all_years/all_questions.json', 'utf-8');
  const items = JSON.parse(raw);

  console.log(`Total questions to import: ${items.length}`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // 检查是否已存在
      const existing = await db.collection('exam_questions')
        .where({ paperId: item.paperId, questionNumber: item.questionNumber })
        .get();

      if (existing.data && existing.data.length > 0) {
        skipped++;
        console.log(`[SKIP] ${item.paperId}#${item.questionNumber}`);
        continue;
      }

      // 转换为 Gokaku 格式
      const gokakuItem = {
        paperId: item.paperId,
        examDate: item.examDate,
        section: item.section,
        questionNumber: item.questionNumber,
        questionText: item.questionText,
        options: item.options,
        correctAnswer: 1, // 默认值，需要后续补充
        explanation: '',
        difficulty: 'medium',
        tags: [item.section],
        createdAt: new Date().toISOString(),
      };

      await db.collection('exam_questions').add(gokakuItem);
      inserted++;
      console.log(`[OK] ${item.paperId}#${item.questionNumber}`);

    } catch (e: any) {
      failed++;
      console.error(`[FAIL] ${item.paperId}#${item.questionNumber}: ${e.message}`);
    }
  }

  console.log(`\nImport completed!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
