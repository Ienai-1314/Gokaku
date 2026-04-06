"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, GraduationCap, Users, Gift } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

const BASE_URL = "https://gokaku.cn";

export default function InvitePage() {
  const [code, setCode] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [inviteRewards, setInviteRewards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    apiFetch("/api/invite")
      .then((r) => r.json())
      .then((d) => {
        setCode(d.invite_code ?? null);
        setInviteCount(d.invite_count ?? 0);
        setInviteRewards(d.invite_rewards ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareLink = code ? `${BASE_URL}/?invite=${code}` : "";

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      (navigator as any).share({
        title: "合格道 Gokaku · N1 备考 AI 工具",
        text: `我在用 Gokaku 备考 N1，用我的邀请码 ${code} 注册可以获得额外奖励！`,
        url: shareLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl text-[#2D2420]">邀请好友获得奖励</h1>
          <p className="text-sm text-[#6B5E55] mt-1">
            邀请好友兑换码，您的会员时长延长1个月
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-8 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#E8E0D5] border-t-[#C75B3B] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 专属邀请码 */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
              <p className="text-xs font-semibold text-[#6B5E55] mb-3 uppercase tracking-wide">你的专属邀请码</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#FAF6F0] rounded-xl px-5 py-3 border border-[#E8E0D5]">
                  <span className="font-bebas text-2xl tracking-[0.15em] text-[#C75B3B]">
                    {code ?? "——"}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className="px-4 py-3 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#6B5E55] hover:border-[#C75B3B]/40 transition-colors flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#4A7C59]" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? "已复制" : "复制码"}
                </button>
              </div>
            </div>

            {/* 分享链接 */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
              <p className="text-xs font-semibold text-[#6B5E55] mb-3 uppercase tracking-wide">专属邀请链接</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#FAF6F0] rounded-xl px-4 py-3 border border-[#E8E0D5] overflow-hidden">
                  <p className="text-sm text-[#2D2420] truncate">{shareLink || "加载中…"}</p>
                </div>
                <button
                  onClick={copyLink}
                  className="px-4 py-3 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#6B5E55] hover:border-[#C75B3B]/40 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#4A7C59]" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "已复制" : "复制"}
                </button>
              </div>
              <button
                onClick={handleShare}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-[#C75B3B] hover:bg-[#A84A2F] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                分享给朋友
              </button>
            </div>

            {/* 奖励说明 */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
              <p className="text-xs font-semibold text-[#6B5E55] mb-4 uppercase tracking-wide flex items-center gap-2">
                <Gift className="w-4 h-4" />
                奖励规则
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C75B3B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#C75B3B]">1</span>
                  </div>
                  <p className="text-sm text-[#6B5E55]">
                    分享您的专属邀请链接给好友
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C75B3B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#C75B3B]">2</span>
                  </div>
                  <p className="text-sm text-[#6B5E55]">
                    好友通过链接访问并兑换码
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#4A7C59]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Gift className="w-3 h-3 text-[#4A7C59]" />
                  </div>
                  <p className="text-sm text-[#6B5E55]">
                    您的会员时长自动延长 <span className="text-[#2D2420] font-semibold">1个月</span>
                  </p>
                </div>
                <p className="text-xs text-[#6B5E55]/60 pt-2 border-t border-[#E8E0D5]">
                  每位好友只计一次 · 奖励自动发放 · 可无限邀请
                </p>
              </div>
            </div>

            {/* 我的数据 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5 text-center">
                <div className="font-bebas text-4xl text-[#C75B3B]">{inviteCount}</div>
                <p className="text-xs text-[#6B5E55] mt-1">成功邀请人数</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5 text-center">
                <div className="font-bebas text-4xl text-[#4A7C59]">{inviteRewards}</div>
                <p className="text-xs text-[#6B5E55] mt-1">获得奖励月数</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E8E0D5] py-6 text-center text-xs text-[#6B5E55]">
        <Link href="/dashboard" className="hover:text-[#C75B3B] transition-colors">← 返回个人中心</Link>
      </footer>
    </div>
  );
}
