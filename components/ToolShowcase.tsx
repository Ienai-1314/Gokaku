"use client";

import { motion } from "framer-motion";
import { Search, BookOpen, ArrowRight, Brain, FileText } from "lucide-react";
import Link from "next/link";

// ── 语法查询 mock 结果 ──────────────────────────────────────────────────────
const QUERY_MOCK = {
  input: "余儀なく",
  sections: [
    {
      heading: "含义与用法",
      body: "表示「被迫做某事，没有其他选择」。多用于正式文体，主语通常是机构或事件。",
    },
    {
      heading: "接续方式",
      body: "名词 ＋ を余儀なくされる / 動詞 ＋ ことを余儀なくされる",
    },
    {
      heading: "真题例句",
      isExample: true,
      lines: [
        "台風の影響で、イベントは中止を余儀なくされた。",
        "（由于台风影响，活动被迫取消。）",
        "長引く不況により、多くの企業が撤退を余儀なくされている。",
        "（因持续不景气，许多企业被迫撤出市场。）",
      ],
    },
    {
      heading: "易混淆语法",
      body: "vs ざるを得ない：两者都表示「不得不」，但余儀なく更正式，常用于外部强制；ざるを得ない 可用于个人主观无奈。",
    },
  ],
};

// ── 错题分析 mock 结果 ──────────────────────────────────────────────────────
const ANALYZE_MOCK = {
  question: "彼は長い闘病生活の末、ついに病に（　）、帰らぬ人となった。",
  options: ["① 屈して  ② 負けず  ③ 倒れて  ④ 勝てずに"],
  correct: "①",
  sections: [
    {
      heading: "错误分析",
      body: "②③④ 都与「败给」相关，但接续和语感各有陷阱：「負けず」是否定形，语意相反；「倒れて」表物理倒下而非「屈服」；「勝てずに」强调无法取胜，不适合描述死亡结果。",
    },
    {
      heading: "核心语法点",
      body: "「病に屈する」是固定搭配，意为「向病魔屈服」。「屈する」接「に」表示「向…低头/屈服」，是书面语高频搭配。",
    },
    {
      heading: "记忆方法",
      body: "「屈する」＝ 弯腰屈服。想象一个人对着「病」这个大山弯腰鞠躬，就是「病に屈する」。",
    },
  ],
};

export function ToolShowcase() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 标题 */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#C75B3B] uppercase mb-3">
            Core Features
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-4">
            三大核心功能
          </h2>
          <p className="text-[#6B5E55] max-w-2xl mx-auto text-sm leading-relaxed">
            AI工具帮你搞懂语法和错题，真题刷题让你实战演练。<br />
            每个功能免费试用 3 次，无需注册。
          </p>
        </div>

        {/* 三列卡片 */}
        <div className="grid md:grid-cols-3 gap-6 items-start mb-12">

          {/* ── 卡片 1：语法查询 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C75B3B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-5 h-5 text-[#C75B3B]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2420] text-lg leading-snug">语法查询</h3>
                <p className="text-sm text-[#6B5E55] mt-1">告诉你真题怎么考、考频多高、常见陷阱</p>
              </div>
            </div>
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm flex-1">
              <div className="px-4 py-3 border-b border-[#E8E0D5] flex items-center gap-3 bg-white">
                <div className="flex-1 bg-[#FAF6F0] rounded-xl px-4 py-2 text-sm text-[#2D2420] font-noto-jp border border-[#E8E0D5]">
                  {QUERY_MOCK.input}
                </div>
                <div className="px-4 py-2 bg-[#C75B3B] text-white rounded-xl text-xs font-semibold">查询</div>
              </div>
              <div className="divide-y divide-[#E8E0D5]/60">
                {QUERY_MOCK.sections.slice(0, 2).map((s, i) => (
                  <MockSection key={i} section={s} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── 卡片 2：错题分析 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-[#4A7C59]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2420] text-lg leading-snug">错题分析</h3>
                <p className="text-sm text-[#6B5E55] mt-1">AI分析错误模式，记录薄弱点</p>
              </div>
            </div>
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm flex-1">
              <div className="px-4 py-3 border-b border-[#E8E0D5] bg-white">
                <p className="text-xs font-semibold text-[#6B5E55] mb-1">题目内容</p>
                <p className="text-sm text-[#2D2420] font-noto-jp leading-relaxed line-clamp-2">
                  {ANALYZE_MOCK.question}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-[#FAF6F0] border border-[#E8E0D5] rounded-lg px-2 py-1 text-[#6B5E55]">我的：③</span>
                  <span className="text-xs bg-[#C75B3B]/8 border border-[#C75B3B]/20 rounded-lg px-2 py-1 text-[#C75B3B]">正确：{ANALYZE_MOCK.correct}</span>
                </div>
              </div>
              <div className="divide-y divide-[#E8E0D5]/60">
                {ANALYZE_MOCK.sections.slice(0, 2).map((s, i) => (
                  <MockSection key={i} section={s} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── 卡片 3：真题刷题 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-[#D4A574]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2420] text-lg leading-snug">真题刷题</h3>
                <p className="text-sm text-[#6B5E55] mt-1">历年完整真题，模拟考试环境</p>
              </div>
            </div>
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm flex-1">
              <div className="px-4 py-3 bg-white border-b border-[#E8E0D5]">
                <p className="text-xs font-bold text-[#D4A574] mb-2">可用试卷</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-[#FAF6F0] rounded-lg">
                    <span className="text-xs font-noto-jp text-[#2D2420]">2025年12月 N1</span>
                    <span className="text-xs text-[#C75B3B]">180题</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#FAF6F0] rounded-lg">
                    <span className="text-xs font-noto-jp text-[#2D2420]">2025年7月 N1</span>
                    <span className="text-xs text-[#C75B3B]">180题</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-bold text-[#D4A574] mb-1">功能特色</p>
                <ul className="text-xs text-[#6B5E55] space-y-1">
                  <li>• 完整模拟考试环境</li>
                  <li>• 自动计时和评分</li>
                  <li>• 详细成绩报告</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)]"
          >
            <Brain className="w-4 h-4" />
            免费试用 AI 工具
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/exam"
            className="inline-flex items-center gap-2 bg-[#FAF6F0] hover:bg-[#E8E0D5] text-[#2D2420] px-8 py-4 rounded-2xl font-semibold text-base transition-all border-2 border-[#E8E0D5]"
          >
            <FileText className="w-4 h-4" />
            开始刷真题
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
        <p className="text-xs text-[#6B5E55] mt-4 text-center">
          每个功能免费 3 次 · 无需注册 · <span className="text-[#C75B3B]">购买后无限使用</span>
        </p>

      </div>
    </section>
  );
}

// ── Mock 分节渲染 ──────────────────────────────────────────────────────────
function MockSection({ section }: { section: any }) {
  if (section.isExample) {
    return (
      <div className="px-4 py-3 bg-[#FFF8F0]">
        <p className="text-xs font-bold text-[#C75B3B] mb-2">{section.heading}</p>
        <div className="space-y-1.5">
          {section.lines.map((l: string, i: number) => {
            const isJp = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(l) && !l.startsWith("（");
            return isJp ? (
              <p key={i} className="text-xs text-[#2D2420] font-noto-jp font-medium pl-2 border-l-2 border-[#C75B3B]/40">
                {l}
              </p>
            ) : (
              <p key={i} className="text-xs text-[#6B5E55] pl-2">{l}</p>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-bold text-[#C75B3B] mb-1">{section.heading}</p>
      <p className="text-xs text-[#6B5E55] leading-relaxed font-noto-jp">{section.body}</p>
    </div>
  );
}
