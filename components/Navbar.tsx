"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Menu, X, ShoppingBag } from "lucide-react";

// TODO: 替换为你的小红书店铺/笔记链接
const XIAOHONGSHU_SHOP_URL = "https://www.xiaohongshu.com/";

interface NavbarProps {
  activeLevel: "N1" | "N2";
  onLevelChange: (level: "N1" | "N2") => void;
}

export function Navbar({ activeLevel, onLevelChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8E0D5]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 bg-[#C75B3B] rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(199,91,59,0.25)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-noto-jp text-[#2D2420] font-bold text-lg leading-tight">合格道</span>
              <span className="font-bebas text-[#C75B3B] text-base tracking-widest">GOKAKU</span>
            </div>
          </div>

          {/* Desktop Level Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <div className="bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl p-1 flex gap-1">
              <button
                onClick={() => onLevelChange("N1")}
                className={cn(
                  "px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
                  activeLevel === "N1"
                    ? "bg-[#C75B3B] text-white shadow-sm"
                    : "text-[#6B5E55] hover:text-[#2D2420] hover:bg-white"
                )}
              >
                N1
              </button>
              <button
                onClick={() => onLevelChange("N2")}
                className={cn(
                  "px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
                  activeLevel === "N2"
                    ? "bg-[#C75B3B] text-white shadow-sm"
                    : "text-[#6B5E55] hover:text-[#2D2420] hover:bg-white"
                )}
              >
                N2
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={XIAOHONGSHU_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-[0_2px_12px_rgba(199,91,59,0.25)] hover:shadow-[0_4px_16px_rgba(199,91,59,0.35)] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>¥39 早鸟价</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#6B5E55] hover:text-[#2D2420] p-2 cursor-pointer transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E8E0D5]/60">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { onLevelChange("N1"); setMobileMenuOpen(false); }}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  activeLevel === "N1"
                    ? "bg-[#C75B3B] text-white"
                    : "bg-[#FAF6F0] text-[#6B5E55] border border-[#E8E0D5]"
                )}
              >
                N1
              </button>
              <button
                onClick={() => { onLevelChange("N2"); setMobileMenuOpen(false); }}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  activeLevel === "N2"
                    ? "bg-[#C75B3B] text-white"
                    : "bg-[#FAF6F0] text-[#6B5E55] border border-[#E8E0D5]"
                )}
              >
                N2
              </button>
            </div>
            <a
              href={XIAOHONGSHU_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#C75B3B] hover:bg-[#A84A2F] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>¥39 早鸟价</span>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
