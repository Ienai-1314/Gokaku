'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Stats {
  total: number;
  available: number;
  delivered: number;
  used: number;
}

interface RecentCode {
  _id: string;
  code: string;
  status: string;
  deliveredAt?: string;
  deliveredTo?: string;
  usedAt?: string;
  usedBy?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDelivered, setRecentDelivered] = useState<RecentCode[]>([]);
  const [recentUsed, setRecentUsed] = useState<RecentCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/codes/stats');
      const json = await res.json();

      if (json.success) {
        setStats(json.data.stats);
        setRecentDelivered(json.data.recentDelivered);
        setRecentUsed(json.data.recentUsed);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('获取统计信息失败：', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('登出失败：', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center">
        <div className="text-[#2D2D2D]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* 顶部导航 */}
      <div className="border-b border-[#2D2D2D]/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-[#C75B3B]" />
            <h1 className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D]">
              管理后台
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/codes')}
              className="flex items-center gap-2 px-4 py-2 text-[#2D2D2D] hover:text-[#C75B3B] transition-colors"
            >
              <Ticket className="w-5 h-5" />
              <span>兑换码管理</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-[#2D2D2D] hover:text-[#C75B3B] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>登出</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-[#2D2D2D]/60" />
              <span className="text-sm text-[#2D2D2D]/60">总兑换码</span>
            </div>
            <div className="text-3xl font-['Bebas_Neue'] text-[#2D2D2D]">
              {stats?.total || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-[#2D2D2D]/60">可用</span>
            </div>
            <div className="text-3xl font-['Bebas_Neue'] text-green-600">
              {stats?.available || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-[#2D2D2D]/60">已发放</span>
            </div>
            <div className="text-3xl font-['Bebas_Neue'] text-blue-600">
              {stats?.delivered || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#C75B3B]" />
              <span className="text-sm text-[#2D2D2D]/60">已使用</span>
            </div>
            <div className="text-3xl font-['Bebas_Neue'] text-[#C75B3B]">
              {stats?.used || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 最近发放 */}
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <h2 className="text-lg font-['Bebas_Neue'] text-[#2D2D2D] mb-4">
              最近发放
            </h2>
            {recentDelivered.length === 0 ? (
              <p className="text-sm text-[#2D2D2D]/60">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {recentDelivered.map((code) => (
                  <div
                    key={code._id}
                    className="p-3 bg-[#FFFEF9] rounded-lg text-sm"
                  >
                    <div className="font-mono text-[#C75B3B] mb-1">
                      {code.code}
                    </div>
                    <div className="text-[#2D2D2D]/60">
                      {code.deliveredTo || '未知买家'} •{' '}
                      {code.deliveredAt
                        ? new Date(code.deliveredAt).toLocaleString('zh-CN')
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 最近使用 */}
          <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6">
            <h2 className="text-lg font-['Bebas_Neue'] text-[#2D2D2D] mb-4">
              最近使用
            </h2>
            {recentUsed.length === 0 ? (
              <p className="text-sm text-[#2D2D2D]/60">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {recentUsed.map((code) => (
                  <div
                    key={code._id}
                    className="p-3 bg-[#FFFEF9] rounded-lg text-sm"
                  >
                    <div className="font-mono text-[#C75B3B] mb-1">
                      {code.code}
                    </div>
                    <div className="text-[#2D2D2D]/60">
                      {code.usedBy || '未知用户'} •{' '}
                      {code.usedAt
                        ? new Date(code.usedAt).toLocaleString('zh-CN')
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
