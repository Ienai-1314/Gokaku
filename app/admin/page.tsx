'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Order {
  orderId: string
  buyerId: string
  code: string
  createdAt: string
}

export default function AdminPage() {
  const [orderId, setOrderId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code: string } | null>(null)
  const [error, setError] = useState('')
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<{ available: number; delivered: number; used: number } | null>(null)

  // 获取统计信息
  const fetchStats = async () => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('获取统计失败:', err)
    }
  }

  // 获取最近订单
  const fetchRecentOrders = async () => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      setRecentOrders(data.orders || [])
    } catch (err) {
      console.error('获取订单失败:', err)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchStats()
    fetchRecentOrders()
  }, [])

  // 分配兑换码
  const handleAllocate = async () => {
    if (!orderId.trim() || !buyerId.trim()) {
      setError('请填写订单号和买家信息')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/admin/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, buyerId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '分配失败')
      }

      setResult({ code: data.code })
      setOrderId('')
      setBuyerId('')

      // 刷新数据
      fetchStats()
      fetchRecentOrders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 复制兑换码
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('兑换码已复制！')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">兑换码管理后台</h1>
          <p className="text-gray-600">收到小红书订单后，在这里分配兑换码</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-sm mb-1">可用兑换码</div>
              <div className="text-3xl font-bold text-green-600">{stats.available}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-sm mb-1">已发货</div>
              <div className="text-3xl font-bold text-blue-600">{stats.delivered}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-sm mb-1">已使用</div>
              <div className="text-3xl font-bold text-orange-600">{stats.used}</div>
            </div>
          </div>
        )}

        {/* 分配表单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">分配新兑换码</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                订单号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="例如：XHS20260403001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                买家信息 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                placeholder="小红书昵称或备注"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-2">兑换码已生成：</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-3 rounded border border-green-300 text-lg font-mono font-bold text-green-700">
                    {result.code}
                  </code>
                  <button
                    onClick={() => copyCode(result.code)}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    复制
                  </button>
                </div>
                <div className="text-sm text-green-600 mt-2">
                  ✓ 请复制这个兑换码，通过小红书私信发给买家
                </div>
              </div>
            )}

            <button
              onClick={handleAllocate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '分配中...' : '分配兑换码'}
            </button>
          </div>
        </motion.div>

        {/* 最近订单 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">最近订单</h2>

          {recentOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无订单记录</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{order.orderId}</div>
                    <div className="text-sm text-gray-600">{order.buyerId}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1 bg-white rounded border border-gray-300 text-sm font-mono">
                      {order.code}
                    </code>
                    <button
                      onClick={() => copyCode(order.code)}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                      复制
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
