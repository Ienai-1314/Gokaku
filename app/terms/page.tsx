import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#C75B3B] hover:underline">← 返回首页</Link>
        </div>

        <h1 className="font-bebas text-5xl text-[#2D2420] mb-2">服务条款</h1>
        <p className="text-sm text-[#6B5E55] mb-10">最后更新：2026年4月</p>

        <div className="space-y-8 text-sm text-[#6B5E55] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">1. 服务说明</h2>
            <p>Gokaku（合格道）提供日语能力考试（JLPT）N1/N2备考辅助资料和分析工具，包括：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>基于历史真题频率的语法统计分析报告（PDF格式）</li>
              <li>参考性押题预测单（基于历史数据，详见第4条）</li>
              <li>备考资料库（包含词汇表、语法全解、惯用语等176份文件）</li>
              <li>AI语法查询和错题分析工具（在线使用）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">2. 购买与交付</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>支付完成后，你可通过领取页面获取网盘下载链接</li>
              <li>提供百度网盘、阿里云盘、夸克网盘三种备选</li>
              <li>AI工具使用权自购买日起至2026年7月JLPT考试结束（约2026年7月31日）</li>
              <li>资料下载链接永久有效（如链接失效请联系客服补发）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">3. 退款政策</h2>
            <p>本产品为数字商品，支持以下退款规则：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>支付后12小时内且未领取网盘链接</strong>：支持无条件全额退款</li>
              <li>已领取网盘链接或超过12小时后：不支持退款</li>
              <li>退款申请请联系客服，处理时间1-3个工作日</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">4. 押题预测免责声明</h2>
            <div className="bg-[#FFF8F0] border border-[#F0A500]/30 rounded-xl p-4 mt-2">
              <p className="font-medium text-[#2D2420] mb-2">⚠️ 重要说明</p>
              <p>押题预测内容基于历史真题出现频率和轮空周期的统计分析，<strong>属于参考性预测，不构成任何形式的考试结果保证</strong>。</p>
              <p className="mt-2">JLPT由日本国际交流基金会出题，出题范围和重点由出题方独立决定。本产品的预测内容不代表实际考试必然考查相同内容。</p>
              <p className="mt-2">购买前请充分理解此限制。</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">5. 使用限制</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>资料仅供<strong>购买者本人</strong>学习使用</li>
              <li>禁止将资料转售、转发、上传至公开平台或用于商业用途</li>
              <li>禁止将AI工具账号借给他人使用</li>
              <li>如发现违规行为，我们有权终止服务且不予退款</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">6. 版权说明</h2>
            <p>本产品中的分析报告、AI工具、排版设计等原创内容版权归 Gokaku（合格道）所有。</p>
            <p className="mt-2">部分资料来源于公开的备考资料整理，引用的真题片段仅用于学习分析目的，如有版权异议请联系我们。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">7. 服务变更与终止</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>AI工具服务将在2026年7月JLPT考试结束后进行维护更新</li>
              <li>资料下载服务将持续提供，如需下线将提前30天通知</li>
              <li>我们保留对服务内容进行改进和调整的权利</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">8. 适用法律</h2>
            <p>本服务条款受中华人民共和国法律管辖。如发生争议，双方应首先协商解决；协商不成的，提交服务运营地有管辖权的人民法院诉讼解决。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D2420] mb-2">9. 联系我们</h2>
            <p>如有任何问题，请联系：<a href="mailto:contact@gokaku.app" className="text-[#C75B3B] hover:underline">contact@gokaku.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
