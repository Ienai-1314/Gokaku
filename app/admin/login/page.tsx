'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (json.success) {
        router.push('/admin/dashboard');
      } else {
        setError(json.error || '登录失败');
      }
    } catch (error) {
      console.error('登录失败：', error);
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF9] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-['Bebas_Neue'] text-[#2D2D2D] mb-2">
            GOKAKU
          </h1>
          <p className="text-[#2D2D2D]/60">管理后台</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2D2D]/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-[#2D2D2D]/10 rounded-lg focus:outline-none focus:border-[#C75B3B] transition-colors"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2D2D]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 border border-[#2D2D2D]/10 rounded-lg focus:outline-none focus:border-[#C75B3B] transition-colors"
                  required
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C75B3B] text-white rounded-lg hover:bg-[#B54A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 p-3 bg-[#FFFEF9] rounded-lg text-sm text-[#2D2D2D]/60">
            <p className="mb-1">默认账号：admin</p>
            <p>默认密码：gokaku2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
