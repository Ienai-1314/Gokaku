"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ToolShowcase } from "@/components/ToolShowcase";
import { BlessingWidget } from "@/components/BlessingWidget";
import { ResourcePack } from "@/components/ResourcePack";
import { ContentPreview } from "@/components/ContentPreview";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { apiFetch } from "@/lib/api-client";

export default function Home() {
  const [activeLevel, setActiveLevel] = useState<"N1" | "N2">("N1");
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  useEffect(() => {
    // 检测 URL 中的 invite 参数
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');

    if (inviteCode) {
      // 保存到 localStorage
      localStorage.setItem('pending_invite_code', inviteCode);

      // 显示提示
      setInviteNotice(`您正在使用邀请码 ${inviteCode}`);

      // 调用 API 记录邀请关系
      apiFetch('/api/invite/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('邀请关系已记录');
          }
        })
        .catch(err => {
          console.error('记录邀请关系失败:', err);
        });

      // 3秒后隐藏提示
      setTimeout(() => setInviteNotice(null), 5000);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      {/* 邀请提示 */}
      {inviteNotice && (
        <div className="bg-gradient-to-r from-[#4A7C59] to-[#5A8C69] text-white py-3 px-4 text-center text-sm">
          🎉 {inviteNotice}，兑换码后您和邀请人都将获得奖励！
        </div>
      )}

      <main className="flex-1">
        <Hero activeLevel={activeLevel} />
        <ToolShowcase />
        <ResourcePack />
        <ContentPreview activeLevel={activeLevel} />
        <Pricing />
        <BlessingWidget />
      </main>
      <Footer />
    </div>
  );
}

