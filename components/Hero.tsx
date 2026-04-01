"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, BookOpen, Zap, ShoppingBag, Download } from "lucide-react";

// TODO: 替换为你的小红书店铺/笔记链接
const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

interface HeroProps {
  activeLevel: "N1" | "N2";
}

export function Hero({ activeLevel }: HeroProps) {
  const features = [
    { icon: Target, text: "59套真题数据" },
    { icon: TrendingUp, text: "176份备考资料" },
    { icon: BookOpen, text: "近6000词大表" },
    { icon: Zap, text: "考前7天押题" },
  ];

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#FAF6F0]">
      {/* Background: large kanji watermark */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-10 -right-20 font-bebas text-[28rem] md:text-[38rem] text-[#E8E0D5]/40 leading-none select-none pointer-events-none"
          style={{ transform: "rotate(-12deg)" }}
        >
          合格
        </div>
        {/* Subtle radial glow under heading */}
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C75B3B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C75B3B]"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide">2026年7月 JLPT 考前冲刺</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="font-bebas text-7xl md:text-9xl lg:text-[10rem] text-[#2D2420] leading-none tracking-wide">
              GOKAKU
            </h1>
            <div className="font-noto-jp text-2xl md:text-3xl text-[#6B5E55] mt-2 leading-relaxed">
              <span className="text-[#C75B3B] font-bold">{activeLevel}</span> 冲刺全料包 · 3份AI报告+176份备考资料
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-[#6B5E55] mb-8 max-w-2xl mx-auto leading-relaxed font-noto-jp"
          >
            基于 <span className="text-[#2D2420] font-semibold">2010-2025 年 59 套真题</span> 统计，
            包含 3 份 AI 深度报告 + 语法/听力/词汇/惯用语/真题全套资料 176 个文件。
            不是 3 份零散资料，是 1 套完整的 N1 备考资产库，¥29.9 一次买断。
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.07 }}
                className="flex items-center gap-2 bg-white border border-[#E8E0D5] px-4 py-2 rounded-full shadow-sm"
              >
                <feature.icon className="w-3.5 h-3.5 text-[#C75B3B]" />
                <span className="text-sm text-[#6B5E55]">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={XIAOHONGSHU_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)] cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              ¥29.9 在小红书购买
            </a>
            <a
              href="/download"
              className="w-full sm:w-auto bg-white hover:bg-[#FAF6F0] text-[#2D2420] border border-[#E8E0D5] hover:border-[#C75B3B]/30 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              已购买，点击领取
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-[#E8E0D5] pt-10"
          >
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#C75B3B]">59</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">套真题数据</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#4A7C59]">176</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">份备考资料</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-4xl md:text-5xl text-[#C75B3B]">6K</div>
              <div className="text-sm text-[#6B5E55] mt-1 font-noto-jp">词带例句库</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
