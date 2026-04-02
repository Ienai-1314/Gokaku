"use client";

import { GraduationCap, Twitter, Mail, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-[#E8E0D5] bg-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#C75B3B] rounded-lg flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-noto-jp font-bold text-[#2D2420]">合格道</span>
                <span className="font-bebas text-[#C75B3B] text-sm tracking-widest">GOKAKU</span>
              </div>
            </div>
            <p className="text-[#6B5E55] text-sm leading-relaxed">
              基于 59 套真题统计的 JLPT N1/N2 备考资料库，<br />助你高效冲刺合格。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#2D2420] text-sm font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-[#6B5E55] hover:text-[#C75B3B] transition-colors">资料预览</a></li>
              <li><a href="#pricing" className="text-[#6B5E55] hover:text-[#C75B3B] transition-colors">价格方案</a></li>
              <li><a href="#" className="text-[#6B5E55] hover:text-[#C75B3B] transition-colors">常见问题</a></li>
              <li><a href="#" className="text-[#6B5E55] hover:text-[#C75B3B] transition-colors">联系我们</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#2D2420] text-sm font-semibold mb-4">联系我们</h4>
            <div className="space-y-3">
              <a href="mailto:contact@gokaku.app" className="flex items-center gap-2 text-[#6B5E55] hover:text-[#C75B3B] transition-colors text-sm">
                <Mail className="w-4 h-4" />
                <span>contact@gokaku.app</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-[#6B5E55] hover:text-[#C75B3B] transition-colors text-sm">
                <Twitter className="w-4 h-4" />
                <span>@GokakuApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E8E0D5] pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#6B5E55]/60 text-xs">
              © {currentYear} 合格道 Gokaku. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a href="#" className="text-[#6B5E55]/60 hover:text-[#6B5E55] transition-colors flex items-center gap-1">
                <span>隐私政策</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="text-[#6B5E55]/60 hover:text-[#6B5E55] transition-colors flex items-center gap-1">
                <span>服务条款</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
