import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cloudbase";
import { addBonus, getBonusRemaining } from "@/lib/ratelimit";

const OWNER_BONUS = 5;   // 邀请成功，邀请人获得
const REDEEMER_BONUS = 3; // 被邀请人访问后获得

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function generateCode(): string {
  // 去掉易混淆字符 O/0/I/1
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** GET /api/invite — 获取当前 IP 的邀请码，不存在则创建 */
export async function GET(req: NextRequest) {
  const ip = getIp(req);
  try {
    const db = getDb();
    const { data } = await db.collection("invite_codes").where({ owner_ip: ip }).get();

    let code: string;
    let redeemed_count = 0;

    if (data && data.length > 0) {
      code = data[0].code;
      redeemed_count = data[0].redeemed_count ?? 0;
    } else {
      // 生成唯一码（碰撞重试）
      let attempts = 0;
      do {
        code = generateCode();
        const { data: existing } = await db.collection("invite_codes").where({ code }).get();
        if (!existing || existing.length === 0) break;
        attempts++;
      } while (attempts < 5);

      await db.collection("invite_codes").add({
        code,
        owner_ip: ip,
        redeemed_count: 0,
        created_at: new Date().toISOString(),
      });
    }

    const bonus_remaining = await getBonusRemaining(ip);

    return NextResponse.json({ code, redeemed_count, bonus_remaining });
  } catch (err) {
    console.error("[invite GET] error:", err);
    return NextResponse.json({ error: "获取邀请码失败" }, { status: 500 });
  }
}

/** POST /api/invite — 核销邀请码 */
export async function POST(req: NextRequest) {
  const redeemer_ip = getIp(req);
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "无效邀请码" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const db = getDb();

    // 查找邀请码
    const { data: codeData } = await db.collection("invite_codes").where({ code: normalizedCode }).get();
    if (!codeData || codeData.length === 0) {
      return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    }

    const owner_ip = codeData[0].owner_ip;

    // 不能自己用自己的码
    if (owner_ip === redeemer_ip) {
      return NextResponse.json({ error: "不能使用自己的邀请码" }, { status: 400 });
    }

    // 检查是否已核销过
    const { data: existing } = await db
      .collection("invite_redemptions")
      .where({ code: normalizedCode, redeemer_ip })
      .get();

    if (existing && existing.length > 0) {
      return NextResponse.json({ already: true, bonus_remaining: await getBonusRemaining(redeemer_ip) });
    }

    // 写入核销记录
    await db.collection("invite_redemptions").add({
      code: normalizedCode,
      owner_ip,
      redeemer_ip,
      redeemed_at: new Date().toISOString(),
    });

    // 更新邀请码使用次数
    await db.collection("invite_codes").doc(codeData[0]._id as string).update({
      redeemed_count: db.command.inc(1),
    });

    // 发放奖励
    await Promise.all([
      addBonus(owner_ip, OWNER_BONUS),
      addBonus(redeemer_ip, REDEEMER_BONUS),
    ]);

    return NextResponse.json({ success: true, bonus_added: REDEEMER_BONUS });
  } catch (err) {
    console.error("[invite POST] error:", err);
    return NextResponse.json({ error: "核销失败，请稍后重试" }, { status: 500 });
  }
}
