import { NextRequest, NextResponse } from "next/server";
import {
  getDeviceIdFromRequest,
  getAccountId,
  recordInvitation,
  getAccount
} from "@/lib/account";
import { getDb } from "@/lib/cloudbase";

/**
 * POST /api/invite/track
 * 追踪邀请关系（新用户访问带邀请码的链接时调用）
 */
export async function POST(req: NextRequest) {
  try {
    const deviceId = getDeviceIdFromRequest(req);
    const accountId = await getAccountId(deviceId);
    const { invite_code } = await req.json();

    if (!invite_code || typeof invite_code !== "string") {
      return NextResponse.json({ error: "无效的邀请码" }, { status: 400 });
    }

    const normalizedCode = invite_code.trim().toUpperCase();

    // 1. 查找邀请码对应的账号
    const db = getDb();
    const { data: accounts } = await db
      .collection("accounts")
      .where({ invite_code: normalizedCode })
      .get();

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    }

    const inviterAccountId = accounts[0].account_id;

    // 2. 不能邀请自己
    if (inviterAccountId === accountId) {
      return NextResponse.json({ error: "不能使用自己的邀请码" }, { status: 400 });
    }

    // 3. 检查是否已有邀请关系
    const account = await getAccount(accountId);
    if (account?.invited_by) {
      return NextResponse.json({
        already_invited: true,
        message: "您已经使用过邀请码了"
      });
    }

    // 4. 记录邀请关系（但不发放奖励，等兑换时发放）
    await recordInvitation(inviterAccountId, accountId, normalizedCode);

    return NextResponse.json({
      success: true,
      message: "邀请关系已记录，兑换码后双方获得奖励"
    });
  } catch (err) {
    console.error("[invite/track POST] error:", err);
    return NextResponse.json({ error: "记录邀请失败" }, { status: 500 });
  }
}
