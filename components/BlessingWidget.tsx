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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
