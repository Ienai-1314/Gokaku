import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CODES_FILE = path.join(process.cwd(), 'lib/data/redeem_codes.json')

interface RedeemCode {
  code: string
  status: 'unused' | 'used'
  createdAt: string
  usedAt?: string
  usedBy?: string
  orderId?: string
  deliveredAt?: string
}

export async function GET() {
  try {
    const codesData = JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8')) as RedeemCode[]

    const stats = {
      available: codesData.filter(c => c.status === 'unused').length,
      delivered: codesData.filter(c => c.status === 'used' && c.orderId && !c.usedBy).length,
      used: codesData.filter(c => c.status === 'used' && c.usedBy).length
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('获取统计失败:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + error.message },
      { status: 500 }
    )
  }
}
