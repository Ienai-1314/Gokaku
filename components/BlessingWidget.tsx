"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function BlessingWidget() {
  const [today, setToday] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [blessed, setBlessed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justBlessed, setJustBlessed] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    fetch("/api/blessing")
      .then((r) => r.json())
      .then((d) => {
        setToday(d.today ?? 0);
        setTotal(d.total ?? 0);
        setBlessed(d.blessed ?? false);
      })
      .catch(() => {});
  }, []);

  async function handleBless() {
    if (blessed || loading) return;
    setLoading(true);

    // 立即触发全屏特效
    setShowEffect(true);
    setTimeout(() => setShowEffect(false), 2500);

    try {
      const res = await fetch("/api/blessing", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setToday(d.today);
        setTotal(d.total);
        setBlessed(true);
        setJustBlessed(true);
        setTimeout(() => setJustBlessed(false), 3000);
      } else if (d.already) {
        setBlessed(true);
      }
    } catch (error) {
      console.error("祈福失败:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 精致全屏特效 */}
      <AnimatePresence>
        {showEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: 'rgba(250, 246, 240, 0.95)' }}
          >
            {/* 背景光晕 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 2], opacity: [0, 0.3, 0] }}
              transition={{ duration: 2 }}
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, #C75B3B 0%, transparent 70%)' }}
            />

            {/* 中心内容 - JLPT考神图 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative max-w-lg mx-6"
            >
              {/* 光环动画 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.1, 1], opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: 1 }}
                className="absolute -inset-4 rounded-3xl"
                style={{ background: 'radial-gradient(ellipse at center, #C75B3B 0%, transparent 70%)' }}
              />

              {/* 考神图片 */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
              >
                <Image
                  src="/jlpt-god.jpg"
                  alt="JLPT考神"
                  width={600}
                  height={450}
                  className="w-full h-auto max-w-md md:max-w-lg"
                  priority
                />
              </motion.div>

              {/* 底部文字 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-6"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#C75B3B] font-noto-jp drop-shadow-sm">
                  全然大丈夫！！！
                </div>
              </motion.div>
            </motion.div>

            {/* 飘落花瓣 */}
            {[...Array(40)].map((_, i) => {
              const startX = Math.random() * 100;
              const drift = (Math.random() - 0.5) * 40;
              return (
                <motion.div
                  key={i}
                  initial={{
                    y: -100,
                    x: `${startX}vw`,
                    opacity: 0.7 + Math.random() * 0.3,
                    rotate: Math.random() * 360,
                    scale: 0.6 + Math.random() * 0.6
                  }}
                  animate={{
                    y: '120vh',
                    x: `${startX + drift}vw`,
                    opacity: 0,
                    rotate: Math.random() * 720,
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 2,
                    delay: Math.random() * 1.5,
                    ease: "linear"
                  }}
                  className="absolute text-3xl pointer-events-none"
                  style={{ left: 0, top: 0 }}
                >
                  🌸
                </motion.div>
              );
            })}

            {/* 飘落"必过"文字 */}
            {[...Array(25)].map((_, i) => {
              const startX = Math.random() * 100;
              const drift = (Math.random() - 0.5) * 30;
              return (
                <motion.div
                  key={`pass-${i}`}
                  initial={{
                    y: -80,
                    x: `${startX}vw`,
                    opacity: 0.8 + Math.random() * 0.2,
                    rotate: -20 + Math.random() * 40,
                    scale: 0.5 + Math.random() * 0.4
                  }}
                  animate={{
                    y: '120vh',
                    x: `${startX + drift}vw`,
                    opacity: 0,
                    rotate: -40 + Math.random() * 80,
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 1.2,
                    ease: "linear"
                  }}
                  className="absolute pointer-events-none font-noto-jp font-bold text-[#C75B3B]"
                  style={{
                    fontSize: `${18 + Math.random() * 20}px`,
                    left: 0,
                    top: 0
                  }}
                >
                  必過
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-14 bg-white">
        <div className="max-w-md mx-auto px-4 text-center">

        {/* 插图 */}
        <div className="relative inline-block mb-5">
          <motion.div
            animate={justBlessed ? { rotate: [0, -5, 5, -3, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="/sakurai.png"
              alt="N1 守护神"
              width={140}
              height={140}
              className="rounded-full border-4 border-[#E8E0D5] shadow-md mx-auto"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </motion.div>
          <AnimatePresence>
            {justBlessed && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, y: -30 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-[#C75B3B] bg-white border border-[#C75B3B]/30 rounded-full px-3 py-1 shadow-sm"
              >
                🌸 祈福成功，合格必至
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 文案 */}
        <p className="text-xs text-[#6B5E55]/60 mb-1 tracking-widest uppercase">N1 守护神</p>
        <h3 className="font-noto-jp text-base font-bold text-[#2D2420] mb-1">
          昔有樱井氏，肩如斜塔，百科不挂
        </h3>
        <p className="text-xs text-[#6B5E55] mb-6">
          庆应义塾大学毕业 · 传说中的 N1 守护神 · 考前祈福，沾沾学神气
        </p>

        {/* 按钮 */}
        <motion.button
          onClick={handleBless}
          disabled={blessed || loading}
          whileTap={!blessed ? { scale: 0.95 } : {}}
          className={`px-8 py-3 rounded-2xl text-sm font-semibold transition-all ${
            blessed
              ? "bg-[#FAF6F0] text-[#6B5E55] border border-[#E8E0D5] cursor-default"
              : "bg-[#C75B3B] text-white shadow-[0_4px_16px_rgba(199,91,59,0.25)] hover:bg-[#A84A2F]"
          }`}
        >
          {loading ? "祈福中…" : blessed ? "✓ 今日已祈福" : "🙏 点击祈福"}
        </motion.button>

        {/* 计数 */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <div className="text-center">
            <div className="font-bebas text-2xl text-[#C75B3B]">
              {today === null ? "—" : today.toLocaleString()}
            </div>
            <div className="text-xs text-[#6B5E55]">今日祈福</div>
          </div>
          <div className="w-px h-8 bg-[#E8E0D5]" />
          <div className="text-center">
            <div className="font-bebas text-2xl text-[#4A7C59]">
              {total === null ? "—" : total.toLocaleString()}
            </div>
            <div className="text-xs text-[#6B5E55]">累计祈福</div>
          </div>
        </div>

        <p className="text-xs text-[#6B5E55]/40 mt-4">每日一次 · 明天可再次祈福</p>
      </div>
    </section>
    </>
  );
}
