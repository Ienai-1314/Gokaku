"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { MiniBlessing } from "./MiniBlessing";

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

          {/* 迷你祈福 */}
          <MiniBlessing />

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
            <span className="text-sm font-semibold tracking-wide">2026 年 7 月 JLPT，一起加油吧 💪</span>
          </motion.div>

          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D2420] leading-tight">
              备考不用那么累
            </h1>
            <div className="font-noto-jp text-lg md:text-xl text-[#6B5E55] mt-4 leading-relaxed">
              让真题告诉你该复习什么，做错题越多越懂你的弱点
            </div>
          </motion.div>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-[#6B5E55] mb-10 max-w-xl mx-auto leading-relaxed font-noto-jp"
          >
            我们把历年真题扒了一遍，帮你找出高频考点和薄弱环节
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 mb-6"
          >
            <Link
              href="/tool"
              className="w-full sm:w-auto bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)] flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              查语法 · 查词汇 · 分析错题
            </Link>

            {/* 功能说明 */}
            <p className="text-sm text-[#6B5E55] text-center max-w-md">
              遇到不会的语法、纠结的词汇、分不清的用法，直接问 AI，用真题例子带你搞懂
            </p>
          </motion.div>

          {/* 免费说明标签 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {[
              { icon: Sparkles, text: "每个功能免费试用 3 次，每日一练不限次" },
              { icon: Zap, text: "基于 30 套真题数据，1500+ 语法词汇" },
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
