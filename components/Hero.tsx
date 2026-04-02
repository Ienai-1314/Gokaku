"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, ShoppingBag, Zap } from "lucide-react";
import Link from "next/link";

const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

interface HeroProps {
  activeLevel: "N1" | "N2";
}

export function Hero({ activeLevel }: HeroProps) {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#FAF6F0]">
      {/* 背景水印 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-10 -right-20 font-bebas text-[28rem] md:text-[38rem] text-[#E8E0D5]/40 leading-none select-none pointer-events-none"
          style={{ transform: "rotate(-12deg)" }}
        >
          合格
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#C75B3B]/8 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 border border-[#C75B3B]/30 bg-[#C75B3B]/8 text-[#C75B3B] px-4 py-2 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C75B3B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C75B3B]" />
            </span>
            <span className="text-sm font-semibold tracking-wide">距 2026 年 7 月考试还有 3 个月</span>
          </motion.div>

          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="font-bebas text-7xl md:text-9xl lg:text-[10rem] text-[#2D2420] leading-none tracking-wide">
              GOKAKU
            </h1>
            <div className="font-noto-jp text-xl md:text-2xl text-[#2D2420] mt-3 leading-snug font-bold">
              做错了题，看懂了解析——
              <span className="text-[#C75B3B]">下次还是会错</span>
            </div>
          </motion.div>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-[#6B5E55] mb-10 max-w-xl mx-auto leading-relaxed font-noto-jp"
          >
            语法随时可查，错题拍照就分析。<br />
            <span className="text-[#2D2420] font-semibold">两个 AI 工具</span>背后，是{" "}
            <span className="text-[#2D2420] font-semibold">231 条语法库</span>与{" "}
            <span className="text-[#2D2420] font-semibold">176 份 {activeLevel} 备考资料</span>的支撑。
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/tool"
              className="w-full sm:w-auto bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)] flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              免费体验 AI 工具
            </Link>
            <a
              href={XIAOHONGSHU_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white hover:bg-[#FAF6F0] text-[#2D2420] border border-[#E8E0D5] hover:border-[#C75B3B]/30 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              早鸟价 ¥39 购买资料
            </a>
          </motion.div>

          {/* 免费说明标签 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {[
              { icon: Sparkles, text: "每个功能免费试用 3 次，无需注册" },
              { icon: Zap, text: "语法查询 + 错题分析，两大 AI 工具" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-[#6B5E55]">
                <item.icon className="w-3.5 h-3.5 text-[#C75B3B]" />
                {item.text}
              </div>
            ))}
          </motion.div>

          {/* 数据统计 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-[#E8E0D5] pt-10"
          >
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#C75B3B]">18</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">套完整真题</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#4A7C59]">231</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">条语法全解</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#C75B3B]">176</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">份备考资料</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
