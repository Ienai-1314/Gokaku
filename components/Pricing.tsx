"use client";

import { motion } from "framer-motion";
import {
  Check,
  Shield,
  Mail,
  FileText,
  Sparkles,
  BookText,
  ShoppingBag,
  Download,
  Smartphone,
  RefreshCw,
  Package,
  Headphones,
  Brain,
  Zap,
} from "lucide-react";

const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

const PLANS = [
  {
    id: "free",
    name: "免费试用",
    price: 0,
    tag: null,
    desc: "每天3次AI查询",
    highlight: false,
    items: [
      "每天3次免费AI查询",
      "基础语法/词汇统计",
      "真题难度分布查看",
      "体验核心功能",
    ],
  },
  {
    id: "bundle",
    name: "考季通票",
    price: 49,
    originalPrice: 99,
    tag: "早鸟5折",
    desc: "无限查询 + 全部资料（到7月考试）",
    highlight: true,
    items: [
      "无限次AI查询（到2026年7月考试）",
      "23条核心语法完整解析",
      "60个最易错词汇精讲",
      "易错语法对比分析",
      "2026年7月押题预测",
      "错题档案永久保存",
      "后续更新免费",
    ],
  },
  {
    id: "resource",
    name: "资料包",
    price: 19,
    tag: null,
    desc: "4份PDF资料",
    highlight: false,
    items: [
      "23条核心语法完整解析",
      "60个最易错词汇精讲",
      "易错语法对比分析",
      "2026年7月押题预测",
    ],
  },
];

const trustModules = [
  {
    icon: Shield,
    title: "退款政策",
    desc: "支付后12小时内无条件退款。数字商品一经领取网盘链接后不再退款。",
  },
  {
    icon: Mail,
    title: "发货方式",
    desc: "支付成功后，在领取页输入订单信息获取兑换码。资料包用户同时获得网盘链接（支持百度/阿里/夸克网盘）。",
  },
  {
    icon: RefreshCw,
    title: "更新说明",
    desc: "考季通票持续更新至2026年7月考试结束。后续开发内容（完整词库、新功能）永久免费。",
  },
  {
    icon: Smartphone,
    title: "设备支持",
    desc: "手机/平板/电脑全平台可用。兼容微信内置浏览器、Edge、Chrome、Safari。",
  },
  {
    icon: Headphones,
    title: "早鸟优惠",
    desc: "🎉 前200名享5折优惠 ¥49（原价¥99）！购买后分享到小红书送1个月延期。7月考试通过返现¥20。",
  },
  {
    icon: Package,
    title: "产品说明",
    desc: "资料包含23条核心语法+60个易错词汇+押题预测。考季通票包含无限次AI查询+全部资料。押题内容为参考性预测，不构成考试结果保证。",
  },
];

export function Pricing() {
  return (
    <section className="py-16 md:py-24 bg-[#FAF6F0]" id="pricing">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#C75B3B] uppercase mb-3">
            Pricing
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-3">
            先免费试用，再决定购买
          </h2>
          <p className="text-[#6B5E55] max-w-md mx-auto text-sm leading-relaxed">
            每天3次免费查询，体验核心功能 · 早鸟价限前200名
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-14">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className={`relative rounded-3xl border overflow-hidden flex flex-col ${
                plan.highlight
                  ? "border-[#C75B3B] shadow-[0_8px_40px_rgba(199,91,59,0.15)]"
                  : "border-[#E8E0D5] shadow-sm"
              } bg-white`}
            >
              {plan.tag && (
                <div className="absolute top-0 left-0 right-0 bg-[#C75B3B] text-white text-xs font-semibold text-center py-1.5 tracking-wide">
                  {plan.tag}
                </div>
              )}

              <div className={`px-6 py-6 ${plan.tag ? "pt-10" : ""} border-b border-[#E8E0D5]`}>
                <p className="text-sm font-semibold text-[#6B5E55] mb-2">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  {plan.originalPrice && (
                    <span className="font-bebas text-2xl text-[#6B5E55] line-through mr-2">¥{plan.originalPrice}</span>
                  )}
                  <span className="font-bebas text-5xl text-[#2D2420]">
                    {plan.price === 0 ? "免费" : `¥${plan.price}`}
                  </span>
                </div>
                <p className="text-xs text-[#6B5E55]">{plan.desc}</p>
              </div>

              <div className="px-6 py-5 flex-1">
                <ul className="space-y-2.5">
                  {plan.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlight
                          ? "bg-[#C75B3B]/10 border border-[#C75B3B]/25"
                          : "bg-[#4A7C59]/10 border border-[#4A7C59]/25"
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlight ? "text-[#C75B3B]" : "text-[#4A7C59]"}`} />
                      </div>
                      <span className="text-xs text-[#6B5E55] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6">
                {plan.price === 0 ? (
                  <a
                    href="/tool"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all bg-[#4A7C59] hover:bg-[#3D6849] text-white"
                  >
                    <Zap className="w-4 h-4" />
                    立即试用
                  </a>
                ) : (
                  <a
                    href={XIAOHONGSHU_SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-[#C75B3B] hover:bg-[#A84A2F] text-white shadow-[0_4px_16px_rgba(199,91,59,0.25)]"
                        : "bg-[#FAF6F0] hover:bg-[#F0E8E0] text-[#2D2420] border border-[#E8E0D5]"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    购买 ¥{plan.price}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Already purchased */}
        <div className="text-center mb-14">
          <a href="/download" className="inline-flex items-center gap-1.5 text-sm text-[#C75B3B] hover:underline">
            <Download className="w-3.5 h-3.5" />
            已购买？点击领取下载链接
          </a>
        </div>

        {/* Trust Modules */}
        <div>
          <h3 className="font-bebas text-2xl text-[#2D2420] text-center mb-6 tracking-wide">
            购买须知
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustModules.map((m, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E8E0D5] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C75B3B]/8 border border-[#C75B3B]/15 flex items-center justify-center">
                    <m.icon className="w-3.5 h-3.5 text-[#C75B3B]" />
                  </div>
                  <span className="text-sm font-semibold text-[#2D2420]">{m.title}</span>
                </div>
                <p className="text-xs text-[#6B5E55] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-xl mx-auto">
          <h3 className="font-bebas text-2xl text-[#2D2420] text-center mb-6 tracking-wide">
            常见问题
          </h3>
          <div className="space-y-3">
            {[
              {
                q: "免费版和付费版有什么区别？",
                a: "免费版每天3次AI查询，适合轻度使用。付费版无限次查询+全部资料，适合认真备考的同学。",
              },
              {
                q: "¥49能用多久？",
                a: "考季通票有效期到2026年7月考试结束，约3个月。相当于¥16/月，比一杯奶茶还便宜。",
              },
              {
                q: "早鸟价什么时候结束？",
                a: "前200名享受¥49早鸟价（原价¥99），售完即恢复原价。建议尽早购买锁定优惠。",
              },
              {
                q: "购买后怎么拿到资料？",
                a: "支付成功后，点击「已购买，点击领取」进入下载页，输入订单信息即可获取网盘链接和兑换码。",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl overflow-hidden group border border-[#E8E0D5]"
              >
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-[#2D2420] text-sm font-medium hover:text-[#C75B3B] transition-colors list-none">
                  {faq.q}
                  <svg className="w-4 h-4 text-[#6B5E55] group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-[#6B5E55] text-sm leading-relaxed border-t border-[#E8E0D5] pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
