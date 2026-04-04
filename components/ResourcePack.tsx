"use client";

import { motion } from "framer-motion";
import {
  FileText,
  BookText,
  Headphones,
  BarChart3,
  Library,
  ScrollText,
  ArrowDown,
} from "lucide-react";

const ASSETS = [
  {
    icon: FileText,
    num: "18",
    unit: "套",
    label: "完整真题",
    desc: "1992–2025 年真题原文 + 听力文本 + 答案解析",
    color: "#C75B3B",
  },
  {
    icon: BookText,
    num: "231",
    unit: "条",
    label: "语法点总结",
    desc: "按考频排序，不是按五十音。含义、接续、易混淆对比",
    color: "#4A7C59",
  },
  {
    icon: BarChart3,
    num: "3",
    unit: "份",
    label: "高频考点分析",
    desc: "哪些语法最爱考、哪些题型最容易错、考前冲刺清单",
    color: "#C75B3B",
  },
  {
    icon: ScrollText,
    num: "699",
    unit: "条",
    label: "惯用语库",
    desc: "带中文释义和真题例句，N1 惯用表达基本覆盖",
    color: "#4A7C59",
  },
  {
    icon: Library,
    num: "~6000",
    unit: "词",
    label: "词汇表",
    desc: "N1–N5 分级，标注真题出现记录，可按考频筛选",
    color: "#C75B3B",
  },
  {
    icon: Headphones,
    num: "6",
    unit: "类",
    label: "听力场景词汇",
    desc: "车站、医院、餐厅等场景分类，考前速查",
    color: "#4A7C59",
  },
];

export function ResourcePack() {
  return (
    <section className="py-16 md:py-24 bg-[#FAF6F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#C75B3B] uppercase mb-3">
            Resource Pack
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-4">
            我们做了一件很费时间的事
          </h2>
          <p className="text-[#6B5E55] max-w-2xl mx-auto text-sm leading-relaxed">
            把历年真题全部拆解，按语法点、题型、考频分类整理。<br />
            不是简单的 PDF 合集，而是真正能用来备考的资料库。
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {ASSETS.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-[#E8E0D5] p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}
                >
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-bebas text-2xl" style={{ color: a.color }}>{a.num}</span>
                  <span className="text-sm text-[#6B5E55]">{a.unit}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-[#2D2420] mb-1">{a.label}</p>
              <p className="text-xs text-[#6B5E55] leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center text-[#6B5E55]/50">
          <p className="text-xs mb-2">往下可预览部分报告内容</p>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>

      </div>
    </section>
  );
}
