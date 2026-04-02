import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#C75B3B] hover:underline">← 返回首页</Link>
        </div>

        <h1 className="font-bebas text-5xl text-[#2D2420] mb-2">隐私政策</h1>
        <p className="text-sm text-[#6B5E55] mb-10">最后更新：2026年4月</p>

        <div className="space-y-8 text-sm text-[#6B5E55] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">1. 我们收集什么信息</h2>
            <p>当你使用 Gokaku（合格道）服务时，我们可能收集以下信息：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>电子邮箱地址（用于验证购买资格和发送资料链接）</li>
              <li>订单尾号（用于核验购买记录）</li>
              <li>工具使用记录（如语法查询记录、错题提交内容，仅在你登录使用AI工具时）</li>
              <li>浏览器类型和访问时间（用于基础统计分析）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">2. 我们如何使用这些信息</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>验证购买资格，为你提供资料下载链接</li>
              <li>根据你的错题记录，为你提供个性化的语法复习推荐</li>
              <li>在资料或预测内容更新时通知你（如你的邮箱已注册）</li>
              <li>改善产品功能和内容质量</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">3. 信息共享</h2>
            <p>我们<strong>不会</strong>将你的个人信息出售或租赁给任何第三方。</p>
            <p className="mt-2">以下情况除外：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>法律法规要求时（如配合监管机构调查）</li>
              <li>为提供服务必须使用的基础设施服务商（如云存储、邮件服务），这些服务商同样受隐私保护约束</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">4. 数据存储与安全</h2>
            <p>你的数据存储在经过加密的云服务器中。我们采取合理的技术措施防止数据泄露、篡改或未授权访问。但请注意，互联网传输本身无法保证100%安全。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">5. Cookie</h2>
            <p>我们使用 Cookie 和类似技术来维持你的登录状态和记录基础使用数据。你可以在浏览器设置中禁用 Cookie，但这可能影响部分功能的正常使用。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">6. 你的权利</h2>
            <p>你有权：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>查询我们持有的你的个人信息</li>
              <li>要求更正不准确的信息</li>
              <li>要求删除你的账户及相关数据</li>
            </ul>
            <p className="mt-2">如需行使上述权利，请发邮件至 <a href="mailto:contact@gokaku.app" className="text-[#C75B3B] hover:underline">contact@gokaku.app</a>。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">7. 未成年人</h2>
            <p>本服务面向18岁以上用户。若你未满18岁，请在监护人知情和同意的情况下使用本服务。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">8. 政策变更</h2>
            <p>我们可能不定期更新本隐私政策。重大变更将通过邮件或网站公告提前通知。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">9. 联系我们</h2>
            <p>如有任何隐私相关问题，请联系：<a href="mailto:contact@gokaku.app" className="text-[#C75B3B] hover:underline">contact@gokaku.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
