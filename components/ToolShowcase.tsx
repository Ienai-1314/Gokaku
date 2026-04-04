"use client";

import { motion } from "framer-motion";
import { Search, BookOpen, ArrowRight, Brain } from "lucide-react";
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
            AI Tools
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-[#2D2420] mb-4">
            两个工具，解决两个核心痛点
          </h2>
          <p className="text-[#6B5E55] max-w-2xl mx-auto text-sm leading-relaxed">
            不是让你多背一本书，而是帮你搞懂做错的题、查清搞混的语法。<br />
            每个功能免费试用 3 次，无需注册。
          </p>
        </div>

        {/* 两列卡片 */}
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* ── 卡片 1：语法查询 ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4"
          >
            {/* 痛点标签 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C75B3B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-5 h-5 text-[#C75B3B]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2420] text-lg leading-snug">
                  不只是查语法，还告诉你真题怎么考
                </h3>
                <p className="text-sm text-[#6B5E55] mt-1">
                  每个语法点都标注了在哪套真题出现过、考频多高、常见陷阱是什么。比语法酷多了"真题视角"。
                </p>
              </div>
            </div>

            {/* Mock 界面 */}
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm">
              {/* 输入框 */}
              <div className="px-4 py-3 border-b border-[#E8E0D5] flex items-center gap-3 bg-white">
                <div className="flex-1 bg-[#FAF6F0] rounded-xl px-4 py-2 text-sm text-[#2D2420] font-noto-jp border border-[#E8E0D5]">
                  {QUERY_MOCK.input}
                </div>
                <div className="px-4 py-2 bg-[#C75B3B] text-white rounded-xl text-xs font-semibold">查询</div>
              </div>

              {/* 结果 */}
              <div className="divide-y divide-[#E8E0D5]/60">
                {QUERY_MOCK.sections.map((s, i) => (
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
            {/* 痛点标签 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4A7C59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-[#4A7C59]" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2420] text-lg leading-snug">
                  不只是对答案，还告诉你为什么错
                </h3>
                <p className="text-sm text-[#6B5E55] mt-1">
                  AI 分析你的错误模式（是语法没记住，还是混淆了相似语法）。自动记录你的薄弱点，越用越懂你。
                </p>
              </div>
            </div>

            {/* Mock 界面 */}
            <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm">
              {/* 题目输入 */}
              <div className="px-4 py-3 border-b border-[#E8E0D5] bg-white">
                <p className="text-xs font-semibold text-[#6B5E55] mb-1">题目内容</p>
                <p className="text-sm text-[#2D2420] font-noto-jp leading-relaxed">
                  {ANALYZE_MOCK.question}
                </p>
                <p className="text-xs text-[#6B5E55] mt-1 font-noto-jp">{ANALYZE_MOCK.options}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-[#FAF6F0] border border-[#E8E0D5] rounded-lg px-2 py-1 text-[#6B5E55]">我的答案：③</span>
                  <span className="text-xs bg-[#C75B3B]/8 border border-[#C75B3B]/20 rounded-lg px-2 py-1 text-[#C75B3B]">正确答案：{ANALYZE_MOCK.correct}</span>
                </div>
              </div>

              {/* 结果 */}
              <div className="divide-y divide-[#E8E0D5]/60">
                {ANALYZE_MOCK.sections.map((s, i) => (
                  <MockSection key={i} section={s} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all shadow-[0_4px_20px_rgba(199,91,59,0.25)] hover:shadow-[0_6px_24px_rgba(199,91,59,0.35)]"
          >
            <Brain className="w-4 h-4" />
            免费试用 AI 工具
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-[#6B5E55] mt-3">
            每个功能免费 3 次 · 无需注册 · <span className="text-[#C75B3B]">购买后无限使用</span>
          </p>
        </motion.div>

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
