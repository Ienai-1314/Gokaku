import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 兑换码数据文件路径
const CODES_FILE = path.join(process.cwd(), 'lib/data/redeem_codes.json')
const ORDERS_FILE = path.join(process.cwd(), 'lib/data/orders.json')

interface RedeemCode {
  code: string
  status: 'unused' | 'used'
  createdAt: string
  usedAt?: string
  usedBy?: string
  orderId?: string
  deliveredAt?: string
}

interface Order {
  orderId: string
  buyerId: string
  code: string
  createdAt: string
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, buyerId } = await request.json()

    if (!orderId || !buyerId) {
      return NextResponse.json(
        { error: '订单号和买家信息不能为空' },
        { status: 400 }
      )
    }

    // 读取兑换码数据
    const codesData = JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8')) as RedeemCode[]

    // 读取订单数据
    let ordersData: Order[] = []
    if (fs.existsSync(ORDERS_FILE)) {
      ordersData = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'))
    }

    // 检查订单是否已存在
    const existingOrder = ordersData.find(o => o.orderId === orderId)
    if (existingOrder) {
      return NextResponse.json(
        { error: '该订单已分配过兑换码', code: existingOrder.code },
        { status: 400 }
      )
    }

    // 找到第一个未使用的兑换码
    const availableCode = codesData.find(c => c.status === 'unused')

    if (!availableCode) {
      return NextResponse.json(
        { error: '兑换码已用完，请联系管理员' },
        { status: 500 }
      )
    }

    // 标记为已发货
    availableCode.status = 'used' // 先标记为used，等用户真正兑换后再更新
    availableCode.orderId = orderId
    availableCode.deliveredAt = new Date().toISOString()

    // 保存兑换码数据
    fs.writeFileSync(CODES_FILE, JSON.stringify(codesData, null, 2))

    // 记录订单
    const newOrder: Order = {
      orderId,
      buyerId,
      code: availableCode.code,
      createdAt: new Date().toISOString()
    }
    ordersData.unshift(newOrder) // 添加到开头

    // 保存订单数据
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersData, null, 2))

    return NextResponse.json({
      success: true,
      code: availableCode.code,
      orderId,
      buyerId
    })

  } catch (error: any) {
    console.error('分配兑换码失败:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + error.message },
      { status: 500 }
    )
  }
}
