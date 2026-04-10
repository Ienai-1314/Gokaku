/**
 * 使用 x-crawl 从 mineru.net 下载模型
 */
import { createCrawl } from 'x-crawl'

const myXCrawl = createCrawl({
  baseConfig: {
    intervalTime: { max: 3000, min: 1000 }
  }
})

async function downloadMinerUModel() {
  console.log('Fetching MinerU API documentation...')

  try {
    // 爬取 mineru.net API 文档页面
    const result = await myXCrawl.crawlPage({
      targets: 'https://mineru.net/apiManage/docs',
      viewport: { width: 1920, height: 1080 }
    })

    console.log('Page loaded successfully')

    // x-crawl 返回的是数组，访问第一个元素的 data 属性
    const pageResult = result[0]
    const page = pageResult.data.page
    const browser = pageResult.data.browser

    console.log('Page object found, waiting for content...')

    // 使用 setTimeout 替代 waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 提取下载链接
    const downloadLinks = await page.evaluate(() => {
      const links = []
      const anchors = document.querySelectorAll('a')

      anchors.forEach(a => {
        if (a.href) {
          links.push({
            text: a.textContent.trim(),
            href: a.href
          })
        }
      })

      return links
    })

    console.log(`\nFound ${downloadLinks.length} total links`)

    // 过滤相关链接
    const relevantLinks = downloadLinks.filter(link =>
      link.href.includes('download') ||
      link.href.includes('model') ||
      link.href.includes('.pt') ||
      link.href.includes('huggingface') ||
      link.href.includes('github') ||
      link.text.toLowerCase().includes('model') ||
      link.text.toLowerCase().includes('下载')
    )

    console.log(`\nFound ${relevantLinks.length} relevant links:`)
    relevantLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.text}: ${link.href}`)
    })

    // 查找 YOLO 模型链接
    const yoloLink = relevantLinks.find(link =>
      link.href.includes('yolo') ||
      link.text.toLowerCase().includes('yolo') ||
      link.href.includes('MFD')
    )

    if (yoloLink) {
      console.log(`\nFound YOLO model link: ${yoloLink.href}`)

      // 下载文件
      const downloadResult = await myXCrawl.crawlFile({
        targets: yoloLink.href,
        storeDirs: 'C:\\Users\\Garo\\.magic-pdf\\models\\MFD\\YOLO',
        fileNames: 'yolo_v8_ft.pt'
      })

      if (downloadResult) {
        console.log('\nModel downloaded successfully!')
        console.log('Location: C:\\Users\\Garo\\.magic-pdf\\models\\MFD\\YOLO\\yolo_v8_ft.pt')
      }
    } else {
      console.log('\nYOLO model link not found on the page.')
    }

    // 关闭浏览器
    await browser.close()

  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// 运行
downloadMinerUModel()
