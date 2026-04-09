/**
 * 数据库集合初始化脚本
 * 创建真题系统所需的数据库集合
 */

import 'dotenv/config';
import { getDb } from '../lib/cloudbase';

async function initCollections() {
  console.log('开始初始化数据库集合...\n');

  const db = getDb();

  const collections = [
    {
      name: 'exam_papers',
      description: '真题试卷表',
    },
    {
      name: 'exam_questions',
      description: '真题题目表',
    },
    {
      name: 'user_exam_records',
      description: '用户答题记录表',
    },
  ];

  try {
    for (const collection of collections) {
      try {
        await db.createCollection(collection.name);
        console.log(`✓ 已创建集合：${collection.name} (${collection.description})`);
      } catch (error: any) {
        if (error.code === 'DATABASE_COLLECTION_EXIST') {
          console.log(`- 集合已存在：${collection.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ 数据库集合初始化完成！');
    console.log('\n下一步：运行 npm run import-exam 导入真题数据');

  } catch (error) {
    console.error('❌ 初始化失败：', error);
    throw error;
  }
}

// 执行初始化
initCollections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
