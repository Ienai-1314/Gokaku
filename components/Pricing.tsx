"use client";

import { motion } from "framer-motion";
import {
  Check,
  Shield,
  Mail,
  Zap,
  FileText,
  Sparkles,
  BookText,
  ShoppingBag,
  Download,
  Smartphone,
  RefreshCw,
  Package,
  Headphones,
} from "lucide-react";

// TODO: 替换为你的小红书店铺/笔记链接
const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

interface PricingProps {}

export function Pricing({}: PricingProps) {
  const deliverables = [
    {
      icon: FileText,
      title: "N1 量化考点分析报告",
      desc: "基于30+套完整真题数据：语法TOP30（含出现次数+轮空年数+例句）、近义辨析15组、读解高频主题+作者态度句式、听力场景词量化统计",
    },
    {
      icon: Sparkles,
      title: "2026年7月量化押题预测单",
      desc: "用量化模型预测高/中押中概率语法考点、文字词汇/读解/听力方向，考前1晚必背20条、必错陷阱点TOP20",
    },
    {
      icon: BookText,
      title: "高频词汇量化库 + 全料资料包",
      desc: "200核心名词+100惯用语+听力场景速查量化表，另含语法大全/近6000词Excel/699惯用语/1992-2025真题库等 176 份文件",
    },
  ];

  const guarantees = [
    "一次购买，永久回看",
    "预测模型持续更新至考前",
    "176 份量化资料一次给齐",
    "N1/N2 双版本通用",
  ];

  const trustModules = [
    {
      icon: Package,
      title: "产品和权益",
      desc: "主权益：3 份基于59套真题的量化分析报告。赠权益：20+ 份语法/听力/词汇/惯用句/真题原始资料（txt/pdf/excel）。",
    },
    {
      icon: Smartphone,
      title: "设备与支持",
      desc: "手机 / 平板 / 电脑全平台可阅读 PDF。兼容微信内置浏览器、Edge、Chrome、Safari。",
    },
    {
      icon: Mail,
      title: "发货与激活",
      desc: "支付成功后，可通过领取页获取网盘下载链接。支持百度网盘 / 阿里云盘 / 夸克网盘备用。",
    },
    {
      icon: RefreshCw,
      title: "更新说明",
      desc: "押题预测等时效性量化内容持续更新至 2026 年 7 月考前。词汇库、语法库等随资料完善不定期增补。",
    },
    {
      icon: Shield,
      title: "退款政策",
      desc: "支持支付后 12 小时内的无条件退款。超过 12 小时或已领取网盘链接后不再接受退款。",
    },
    {
      icon: Headphones,
      title: "售后保障",
      desc: "链接失效？联系客服微信 / 邮箱补发。资料打开有问题？提供网盘二次下载。",
    },
  ];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-[#FAF6F0]" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#C75B3B] uppercase mb-3">
            Pricing
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-3">
            ¥29.9 能买到什么？
          </h2>
          <p className="text-[#6B5E55] max-w-lg mx-auto text-sm leading-relaxed">
            不是经验帖，是<b>基于59套真题数据的量化结论</b>。一次买断，整整 1 套 N1 备考资产库：
          </p>
        </div>

        {/* Value Prop Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-12 max-w-5xl mx-auto">
          {[
            { num: "01", title: "考点怎么抓？", answer: "用量化模型统计30+套完整真题数据，告诉你哪些语法轮空 3 年以上、今年反弹概率最高，并配真题例句。" },
            { num: "02", title: "考前押什么？", answer: "基于轮空周期和出现频率的押题预测单，给你高概率考点 + 考前 1 晚必背 20 条，直击 7 月考点。" },
            { num: "03", title: "资料够不够？", answer: "不止 3 份量化报告，还打包了 699 惯用语、近 6000 词表、语法大全、1992–2025 真题库等 176 份文件。" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
              <div className="text-[#C75B3B] font-bebas text-3xl mb-2">{item.num}</div>
              <h3 className="font-semibold text-[#2D2420] mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B5E55] leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(45,36,32,0.1)] border border-[#E8E0D5]">
            {/* Header */}
            <div className="px-8 py-8 text-center border-b border-[#E8E0D5] bg-[#FDF8F3]">
              <div className="inline-flex items-center gap-2 border border-[#F0A500]/40 bg-[#F0A500]/10 text-[#C75B3B] px-3 py-1 rounded-full text-xs font-semibold mb-5">
                <Zap className="w-3 h-3" />
                <span>限时早鸟价</span>
              </div>
              <div className="flex items-baseline justify-center gap-3">
                <span className="font-bebas text-7xl text-[#2D2420]">¥29.9</span>
                <div className="flex flex-col items-start">
                  <span className="text-[#6B5E55] line-through text-lg">¥99</span>
                  <span className="text-[#6B5E55] text-xs">买断制 · 无二次付费</span>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            <div className="px-8 py-6">
              <div className="space-y-4 mb-8">
                {deliverables.map((d, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C75B3B]/8 border border-[#C75B3B]/15 flex items-center justify-center flex-shrink-0">
                      <d.icon className="w-4 h-4 text-[#C75B3B]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2D2420]">{d.title}</div>
                      <div className="text-xs text-[#6B5E55] leading-relaxed mt-0.5">{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guarantees */}
              <ul className="grid grid-cols-2 gap-3 mb-8">
                {guarantees.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#4A7C59]/10 border border-[#4A7C59]/25 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#4A7C59]" />
                    </div>
                    <span className="text-[#6B5E55] text-xs">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={XIAOHONGSHU_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#C75B3B] hover:bg-[#A84A2F] text-white py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>立即购买 ¥29.9</span>
              </a>

              {/* Payment methods & channels */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-[#1677FF]/10 text-[#1677FF] text-xs font-medium">
                    支付宝
                  </span>
                  <span className="px-2 py-1 rounded bg-[#07C160]/10 text-[#07C160] text-xs font-medium">
                    微信支付
                  </span>
                </div>
                <p className="text-[10px] text-[#6B5E55]/70 text-center">
                  可在小红书 / 微信公众号 / 闲鱼购买，资料通用
                </p>
              </div>

              {/* Secondary link */}
              <div className="mt-4 text-center">
                <a
                  href="/download"
                  className="inline-flex items-center gap-1 text-xs text-[#C75B3B] hover:underline"
                >
                  <Download className="w-3 h-3" />
                  已购买？点击领取下载链接
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Modules */}
        <div className="mt-14 max-w-5xl mx-auto">
          <h3 className="font-bebas text-2xl text-[#2D2420] text-center mb-6 tracking-wide">
            购买无忧 · 六大保障
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
        <div className="mt-14 max-w-xl mx-auto">
          <h3 className="font-bebas text-2xl text-[#2D2420] text-center mb-6 tracking-wide">
            常见问题
          </h3>
          <div className="space-y-3">
            {[
              {
                q: "在小红书购买后，怎么拿到资料？",
                a: "购买成功后，你可以点击本页面的「已购买，点击领取」进入下载页，输入订单信息即可获取网盘链接。我也会在店铺自动发货消息里发送领取方式。",
              },
              {
                q: "资料会更新吗？",
                a: "会！购买后可持续获得更新，包括每次考试前的量化押题预测更新，直到 2026 年 7 月考前最后一天。",
              },
              {
                q: "买了可以分享给别人吗？",
                a: "仅供个人学习使用。你的资料会带有专属水印，感谢支持我们把真题量化分析继续做下去。",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl overflow-hidden group border border-[#E8E0D5]"
              >
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-[#2D2420] text-sm font-medium hover:text-[#C75B3B] transition-colors list-none">
                  {faq.q}
                  <span className="text-[#6B5E55] group-open:text-[#C75B3B] transition-colors ml-4 flex-shrink-0">
                    <svg className="w-4 h-4 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
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
