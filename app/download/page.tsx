"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Download, Mail, Smartphone, CheckCircle2, Copy, AlertCircle } from "lucide-react";

const DOWNLOAD_LINKS = {
  N1: {
    baidu: { url: "https://pan.baidu.com/s/1aEhEhYZ5egdwa9WgdAYlaQ?pwd=goka", code: "goka" },
    aliyun: { url: "", code: "" },
    quark: { url: "", code: "" },
  },
  N2: {
    baidu: { url: "https://pan.baidu.com/s/1aEhEhYZ5egdwa9WgdAYlaQ?pwd=goka", code: "goka" },
    aliyun: { url: "", code: "" },
    quark: { url: "", code: "" },
  },
};

export default function DownloadPage() {
  const [email, setEmail] = useState("");
  const [orderTail, setOrderTail] = useState("");
  const [level, setLevel] = useState<"N1" | "N2">("N1");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !orderTail.trim()) return;
    setSubmitted(true);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const links = DOWNLOAD_LINKS[level];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-noto-jp text-[#2D2420] font-bold text-lg">合格道</span>
              <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
            </div>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(45,36,32,0.08)] border border-[#E8E0D5]"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#C75B3B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-6 h-6 text-[#C75B3B]" />
                  </div>
                  <h1 className="text-xl font-bold text-[#2D2420]">资料领取</h1>
                  <p className="text-sm text-[#6B5E55] mt-1">
                    在小红书店铺购买后，请在此输入订单信息领取下载链接
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2420] mb-1">邮箱地址</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E55]" />
                      <input
                        type="email"
                        required={!orderTail.trim()}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="购买时填写的邮箱"
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/60 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2420] mb-1">订单号后 4 位</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E55]" />
                      <input
                        type="text"
                        required={!email.trim()}
                        maxLength={4}
                        value={orderTail}
                        onChange={(e) => setOrderTail(e.target.value.replace(/\D/g, ""))}
                        placeholder="例如 1234"
                        className="w-full pl-10 pr-3 py-2.5 bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl text-sm text-[#2D2420] placeholder:text-[#6B5E55]/60 focus:outline-none focus:ring-2 focus:ring-[#C75B3B]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2420] mb-2">选择版本</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLevel("N1")}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          level === "N1"
                            ? "bg-[#C75B3B] text-white border-[#C75B3B]"
                            : "bg-white text-[#6B5E55] border-[#E8E0D5] hover:border-[#C75B3B]/30"
                        }`}
                      >
                        N1 版本
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevel("N2")}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          level === "N2"
                            ? "bg-[#C75B3B] text-white border-[#C75B3B]"
                            : "bg-white text-[#6B5E55] border-[#E8E0D5] hover:border-[#C75B3B]/30"
                        }`}
                      >
                        N2 版本
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#C75B3B] hover:bg-[#A84A2F] text-white py-3 rounded-xl font-semibold text-sm transition-all mt-2"
                  >
                    领取下载链接
                  </button>
                </form>

                <p className="text-xs text-[#6B5E55] text-center mt-4">
                  如遇问题，请联系客服微信或邮箱 contact@gokaku.app
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="links"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(45,36,32,0.08)] border border-[#E8E0D5]"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#4A7C59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-[#4A7C59]" />
                  </div>
                  <h1 className="text-xl font-bold text-[#2D2420]">领取成功</h1>
                  <p className="text-sm text-[#6B5E55] mt-1">
                    以下是 {level} 资料的下载链接，建议尽快保存到网盘
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "baidu", name: "百度网盘", color: "text-[#2932E1]", bg: "bg-[#2932E1]/6" },
                    { key: "aliyun", name: "阿里云盘", color: "text-[#00B578]", bg: "bg-[#00B578]/6" },
                    { key: "quark", name: "夸克网盘", color: "text-[#009FF7]", bg: "bg-[#009FF7]/6" },
                  ].map((p) => {
                    const link = (links as any)[p.key];
                    return (
                      <div key={p.key} className={`rounded-xl p-4 border border-[#E8E0D5] ${p.bg}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${p.color}`}>{p.name}</span>
                          {link.code && (
                            <span className="text-xs text-[#6B5E55] bg-white border border-[#E8E0D5] px-2 py-0.5 rounded">
                              提取码: {link.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs text-[#2D2420] bg-white border border-[#E8E0D5] rounded-lg px-3 py-2 truncate hover:border-[#C75B3B]/30 transition-colors"
                          >
                            {link.url}
                          </a>
                          <button
                            onClick={() => copyToClipboard(link.url, p.key + "-url")}
                            className="p-2 bg-white border border-[#E8E0D5] rounded-lg hover:border-[#C75B3B]/30 transition-colors"
                            title="复制链接"
                          >
                            {copied === p.key + "-url" ? (
                              <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#6B5E55]" />
                            )}
                          </button>
                          {link.code && (
                            <button
                              onClick={() => copyToClipboard(link.code, p.key + "-code")}
                              className="p-2 bg-white border border-[#E8E0D5] rounded-lg hover:border-[#C75B3B]/30 transition-colors"
                              title="复制提取码"
                            >
                              {copied === p.key + "-code" ? (
                                <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
                              ) : (
                                <Copy className="w-4 h-4 text-[#6B5E55]" />
                              )
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-[#FAF6F0] rounded-xl border border-[#E8E0D5]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#C75B3B] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#6B5E55] leading-relaxed">
                      如果链接失效或 10 分钟内未收到自动发货消息，请通过微信或邮箱联系我们补发。
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full mt-4 text-sm text-[#6B5E55] hover:text-[#C75B3B] transition-colors"
                >
                  ← 返回重新填写
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
