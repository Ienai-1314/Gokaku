/**
 * x-crawl 示例脚本
 * 演示如何使用 x-crawl 爬取网页数据
 */

import xCrawl from 'x-crawl'

// 示例 1: 基础网页爬取
async function basicCrawl() {
  console.log('=== Basic Crawl Example ===')

  const crawler = xCrawl({
    maxRetry: 3,
    intervalTime: { max: 2000, min: 1000 }
  })

  try {
    // 爬取示例网页
    const result = await crawler.crawlPage('https://example.com')

    console.log('URL:', result.page.url())
    console.log('Title:', await result.page.title())

    await result.browser.close()
  } catch (error) {
    console.error('Crawl failed:', error)
  }
}

// 示例 2: 爬取日语词典
async function crawlJisho(word: string) {
  console.log(`=== Crawling Jisho for: ${word} ===`)

  const crawler = xCrawl()

  try {
    const result = await crawler.crawlPage({
      url: `https://jisho.org/search/${word}`,
      viewport: { width: 1920, height: 1080 }
    })

    // 提取词义
    const meanings = await result.page.evaluate(() => {
      const elements = document.querySelectorAll('.meaning-wrapper')
      return Array.from(elements).map(el => el.textContent?.trim())
    })

    console.log('Meanings:', meanings)

    await result.browser.close()
    return meanings
  } catch (error) {
    console.error('Failed to crawl Jisho:', error)
    return []
  }
}

// 示例 3: 批量爬取
async function batchCrawl(urls: string[]) {
  console.log('=== Batch Crawl Example ===')

  const crawler = xCrawl({
    intervalTime: { max: 3000, min: 2000 }
  })

  try {
    const results = await crawler.crawlPage(urls)

    for (const result of results) {
      console.log('URL:', result.page.url())
      console.log('Title:', await result.page.title())
      await result.browser.close()
    }
  } catch (error) {
    console.error('Batch crawl failed:', error)
  }
}

// 示例 4: 使用 AI 提取数据（需要 OpenAI API Key）
async function aiExtract(url: string) {
  console.log('=== AI Extract Example ===')

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.log('OPENAI_API_KEY not found, skipping AI example')
    return
  }

  const crawler = xCrawl({
    ai: {
      openai: {
        apiKey,
        model: 'gpt-4'
      }
    }
  })

  try {
    const result = await crawler.crawlPage({
      url,
      aiExtract: {
        prompt: 'Extract the main content and summarize it',
        schema: {
          title: 'string',
          summary: 'string',
          keywords: 'array'
        }
      }
    })

    console.log('AI Extracted Data:', result.data)

    await result.browser.close()
  } catch (error) {
    console.error('AI extract failed:', error)
  }
}

// 主函数
async function main() {
  console.log('x-crawl Examples\n')

  // 运行示例 1
  await basicCrawl()
  console.log('\n')

  // 运行示例 2
  await crawlJisho('勉強')
  console.log('\n')

  // 运行示例 3
  // await batchCrawl([
  //   'https://example.com',
  //   'https://example.org'
  // ])

  console.log('Examples completed!')
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

export { basicCrawl, crawlJisho, batchCrawl, aiExtract }
