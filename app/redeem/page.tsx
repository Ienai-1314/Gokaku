'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: '请输入兑换码' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await apiFetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: data.message || '兑换成功！已开通会员账号'
        });
        setCode('');

        // 3秒后跳转到个人中心
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || '兑换失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#FFF8F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E8DCC8]">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-[#D4772C] to-[#E89A5C] text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              兑换AI工具额度
            </div>
            <h1 className="text-2xl font-bold text-[#2D2420] mb-2">
              输入兑换码
            </h1>
            <p className="text-[#6B5E54] text-sm">
              兑换后获得会员账号，每天100次查询额度
            </p>
          </div>

          {/* 输入框 */}
          <div className="mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GOKAKU-XXXX-XXXX"
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-lg focus:border-[#D4772C] focus:outline-none text-center text-lg font-mono tracking-wider"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">{message.text}</p>
              {message.type === 'success' && (
                <p className="text-xs mt-1 opacity-75">即将跳转到个人中心...</p>
              )}
            </div>
          )}

          {/* 兑换按钮 */}
          <button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="w-full bg-gradient-to-r from-[#D4772C] to-[#E89A5C] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '兑换中...' : '立即兑换'}
          </button>

          {/* 说明 */}
          <div className="mt-6 pt-6 border-t border-[#E8DCC8]">
            <p className="text-xs text-[#6B5E54] text-center mb-3">
              💡 兑换说明
            </p>
            <ul className="text-xs text-[#6B5E54] space-y-2">
              <li>• 兑换码即为您的会员账号ID</li>
              <li>• 会员每天100次查询额度，有效期至12月</li>
              <li>• 可在最多3台设备上使用</li>
              <li>• 换设备时输入兑换码即可同步数据</li>
            </ul>
          </div>

          {/* 返回首页 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-[#D4772C] hover:underline"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#6B5E54]">
            还没有兑换码？
            <a href="/#pricing" className="text-[#D4772C] hover:underline ml-1">
              立即购买
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
