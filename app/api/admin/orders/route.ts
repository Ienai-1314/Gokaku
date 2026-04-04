import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ORDERS_FILE = path.join(process.cwd(), 'lib/data/orders.json')

interface Order {
  orderId: string
  buyerId: string
  code: string
  createdAt: string
}

export async function GET() {
  try {
    let ordersData: Order[] = []

    if (fs.existsSync(ORDERS_FILE)) {
      ordersData = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'))
    }

    // 返回最近20条订单
    const recentOrders = ordersData.slice(0, 20)

    return NextResponse.json({ orders: recentOrders })
  } catch (error: any) {
    console.error('获取订单失败:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + error.message },
      { status: 500 }
    )
  }
}
