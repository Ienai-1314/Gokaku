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
  const raw = readFileSync('C:/Users/Garo/gokaku/output/all_vocab_grammar_gokaku_filtered.json', 'utf-8');
  const items = JSON.parse(raw);

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const existing = await db.collection('exam_questions')
        .where({ paperId: item.paperId, questionNumber: item.questionNumber })
        .get();

      if (existing.data && existing.data.length > 0) {
        skipped++;
        console.log(`skip existing: ${item.paperId}#${item.questionNumber}`);
        continue;
      }

      await db.collection('exam_questions').add(item);
      inserted++;
      console.log(`inserted: ${item.paperId}#${item.questionNumber}`);
    } catch (e) {
      console.error(`failed: ${item.paperId}#${item.questionNumber}`, e);
    }
  }

  console.log(`done. inserted=${inserted}, skipped=${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
