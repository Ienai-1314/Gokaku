/**
 * 使用 x-crawl 爬取 DataFlow 使用文档
 */
import { createCrawl } from 'x-crawl'
import fs from 'fs'

const myXCrawl = createCrawl({
  baseConfig: {
    intervalTime: { max: 3000, min: 1000 }
  }
})

async function crawlDataFlowDocs() {
  console.log('Crawling DataFlow documentation...')

  try {
    // 爬取 DataFlow GitHub README
    const result = await myXCrawl.crawlPage({
      targets: 'https://github.com/opendatalab/DataFlow',
      viewport: { width: 1920, height: 1080 }
    })

    const pageResult = result[0]
    const page = pageResult.data.page
    const browser = pageResult.data.browser

    console.log('Page loaded, extracting content...')

    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 提取 README 内容
    const content = await page.evaluate(() => {
      const readme = document.querySelector('article.markdown-body')
      if (readme) {
        return {
          text: readme.innerText,
          html: readme.innerHTML
        }
      }
      return null
    })

    if (content) {
      // 保存文档
      const outputDir = 'C:/Users/Garo/gokaku/docs/dataflow'
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      fs.writeFileSync(
        `${outputDir}/README.txt`,
        content.text,
        'utf-8'
      )

      fs.writeFileSync(
        `${outputDir}/README.html`,
        content.html,
        'utf-8'
      )

      console.log('\n✅ DataFlow documentation saved!')
      console.log(`Location: ${outputDir}`)

      // 提取关键信息
      const lines = content.text.split('\n')
      console.log('\n📋 Key sections found:')
      lines.forEach((line, i) => {
        if (line.match(/^#{1,3}\s/)) {
          console.log(`  ${line}`)
        }
      })
    } else {
      console.log('❌ Could not find README content')
    }

    await browser.close()

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// 运行
crawlDataFlowDocs()
