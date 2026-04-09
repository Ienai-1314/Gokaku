'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

interface Code {
  _id: string;
  code: string;
  status: 'available' | 'delivered' | 'used';
  createdAt: string;
  deliveredAt?: string;
  deliveredTo?: string;
  orderId?: string;
  usedAt?: string;
  usedBy?: string;
  membershipType?: string;
  membershipDays?: number;
}

export default function AdminCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const limit = 20;

  useEffect(() => {
    fetchCodes();
  }, [page, status, search]);

  async function fetchCodes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
      });

      if (search) {
        params.append('search', search);
      }

      const res = await fetch(`/api/admin/codes?${params}`);
      const json = await res.json();

      if (json.success) {
        setCodes(json.data.codes);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('获取兑换码列表失败：', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setPage(1);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs rounded">
            <CheckCircle2 className="w-3 h-3" />
            可用
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
            <Clock className="w-3 h-3" />
            已发放
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#C75B3B]/10 text-[#C75B3B] text-xs rounded">
            <XCircle className="w-3 h-3" />
            已使用
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* 顶部导航 */}
      <div className="border-b border-[#2D2D2D]/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-[#2D2D2D] hover:text-[#C75B3B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回仪表盘</span>
          </button>

          <h1 className="text-2xl font-['Bebas_Neue'] text-[#2D2D2D]">
            兑换码管理
          </h1>

          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl border border-[#2D2D2D]/10 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-[#2D2D2D]/60" />
            <div className="flex gap-2">
              {['all', 'available', 'delivered', 'used'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    status === s
                      ? 'bg-[#C75B3B] text-white'
                      : 'bg-[#2D2D2D]/5 text-[#2D2D2D] hover:bg-[#2D2D2D]/10'
                  }`}
                >
                  {s === 'all' && '全部'}
                  {s === 'available' && '可用'}
                  {s === 'delivered' && '已发放'}
                  {s === 'used' && '已使用'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2D2D]/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索兑换码..."
                className="w-full pl-10 pr-4 py-2 border border-[#2D2D2D]/10 rounded-lg focus:outline-none focus:border-[#C75B3B] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-[#C75B3B] text-white rounded-lg hover:bg-[#B54A2A] transition-colors"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 兑换码列表 */}
        <div className="bg-white rounded-xl border border-[#2D2D2D]/10 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#2D2D2D]/60">
              加载中...
            </div>
          ) : codes.length === 0 ? (
            <div className="p-12 text-center text-[#2D2D2D]/60">
              暂无数据
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FFFEF9] border-b border-[#2D2D2D]/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#2D2D2D]">
                        兑换码
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#2D2D2D]">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#2D2D2D]">
                        会员类型
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#2D2D2D]">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-[#2D2D2D]">
                        发放/使用信息
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2D2D]/10">
                    {codes.map((code) => (
                      <tr key={code._id} className="hover:bg-[#FFFEF9]">
                        <td className="px-6 py-4">
                          <code className="text-sm font-mono text-[#C75B3B]">
                            {code.code}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(code.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#2D2D2D]">
                          {code.membershipDays
                            ? `${code.membershipDays}天`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#2D2D2D]/60">
                          {new Date(code.createdAt).toLocaleDateString(
                            'zh-CN'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#2D2D2D]/60">
                          {code.status === 'delivered' && code.deliveredTo && (
                            <div>
                              发放给：{code.deliveredTo}
                              <br />
                              {code.deliveredAt &&
                                new Date(code.deliveredAt).toLocaleString(
                                  'zh-CN'
                                )}
                            </div>
                          )}
                          {code.status === 'used' && code.usedBy && (
                            <div>
                              使用者：{code.usedBy}
                              <br />
                              {code.usedAt &&
                                new Date(code.usedAt).toLocaleString('zh-CN')}
                            </div>
                          )}
                          {code.status === 'available' && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="px-6 py-4 border-t border-[#2D2D2D]/10 flex items-center justify-between">
                <div className="text-sm text-[#2D2D2D]/60">
                  共 {total} 条，第 {page}/{totalPages} 页
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-[#2D2D2D]/10 rounded-lg hover:bg-[#2D2D2D]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-[#2D2D2D]/10 rounded-lg hover:bg-[#2D2D2D]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
