import { NextRequest, NextResponse } from "next/server";
import { getAccountIdFromRequest } from "@/lib/account";
import { getUserProfile } from "@/lib/error-classification";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 获取用户学习画像
 */
export async function GET(req: NextRequest) {
  try {
    const accountId = await getAccountIdFromRequest(req);

    if (!accountId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(accountId);

    if (!profile) {
      return NextResponse.json({
        accountId,
        weakAreas: [],
        errorPatterns: {
          concept: 0,
          careless: 0,
          unfamiliar: 0,
          confusion: 0,
          complex: 0,
        },
        recommendations: [],
        totalErrors: 0,
        lastUpdated: new Date(),
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("获取学习画像失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
