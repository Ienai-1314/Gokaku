"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function MiniBlessing() {
  const [today, setToday] = useState<number | null>(null);
  const [blessed, setBlessed] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    fetch("/api/blessing")
      .then((r) => r.json())
      .then((d) => {
        setToday(d.today ?? 0);
        setBlessed(d.blessed ?? false);
      })
      .catch(() => {});
  }, []);

  async function handleBless() {
    setShowEffect(true);
    setTimeout(() => setShowEffect(false), 2500);

    if (blessed) return;

    try {
      const res = await fetch("/api/blessing", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setToday(d.today);
        setBlessed(true);
      }
    } catch {}
  }

  const blessedTexts = ["溜肩之力已加持", "哥哥附体中", "合格气运+1", "斜塔护体", "樱井光环笼罩"];
  const randomText = blessedTexts[Math.floor(Math.random() * blessedTexts.length)];

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

            {/* 飘落花瓣 - 增加到40个 */}
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

            {/* 飘落"必过"文字 - 增加到25个，覆盖全屏 */}
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

      {/* 祈福卡片 - 小徽章样式 */}
      <div className="mb-6 flex justify-center">
        <motion.button
          onClick={handleBless}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            blessed
              ? "bg-[#C75B3B]/10 border-[#C75B3B]/30 text-[#C75B3B]"
              : "bg-white border-[#E8E0D5] text-[#2D2420] hover:border-[#C75B3B]/30 hover:bg-[#C75B3B]/5"
          }`}
        >
          <Image
            src="/sakurai.png"
            alt="考前沾喜气"
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-sm font-semibold">
            {blessed ? randomText : "考前沾沾喜气"}
          </span>
          {!blessed && <span className="text-xs text-[#6B5E55]">🙏</span>}
          {blessed && (
            <span className="text-xs text-[#C75B3B]/60">
              · 今日 {today ?? "—"} 人
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}
