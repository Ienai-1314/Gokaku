'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  ArrowLeft,
  Zap,
  BookMarked,
  AlertCircle,
  User,
  Clock,
  Users,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

interface ProgressStats {
  totalQueries: number;
  grammarQueries: number;
  vocabQueries: number;
  analyzeQueries: number;
  totalCollections: number;
  grammarCollections: number;
  vocabCollections: number;
  totalErrors: number;
  weaknessCount: number;
  quotaUsed: number;
  quotaRemaining: number;
  studyDays: number;
  grammarMastery: number;
  vocabMastery: number;
  accountId?: string;
  accountType?: 'free' | 'redeem';
  expiresAt?: string;
  dailyQuota?: number;
  cashback?: {
    totalRewards: number;
    currentProgress: number;
    nextMilestone: number;
    remainingForNext: number;
    progressPercentage: number;
    history: Array<{
      milestone: number;
      rewardValue: number;
      newExpiry: string;
      createdAt: string;
    }>;
  };
  invite?: {
    invite_code: string;
    invite_count: number;
    invite_rewards: number;
  };
}

interface LearningProfile {
  weakAreas: Array<{
    knowledgeType: string;
    specificPoint: string;
    errorCount: number;
    lastError: string;
  }>;
  errorPatterns: {
    concept: number;
    careless: number;
    unfamiliar: number;
    confusion: number;
    complex: number;
  };
  recommendations: string[];
  totalErrors: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    loadLearningProfile();
  }, []);

  async function loadProgress() {
    try {
      const res = await apiFetch('/api/progress');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Load progress error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLearningProfile() {
    try {
      const res = await apiFetch('/api/profile/learning');
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Load learning profile error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#6B5E54]">加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#C75B3B]">加载失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#FFF8F0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/tool" className="text-[#6B5E54] hover:text-[#2D2420]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <TrendingUp className="w-6 h-6 text-[#D4772C]" />
            <h1 className="text-xl font-bold text-[#2D2420]">学习进度</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 账号信息 */}
        <div className="bg-gradient-to-r from-[#D4772C] to-[#E89A5C] rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-bold">我的账号</h2>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-90">账号ID:</span>
                  <span className="font-mono text-sm font-semibold">
                    {stats.accountId || '未绑定'}
                  </span>
                </div>

                {stats.accountType === 'redeem' && stats.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 opacity-90" />
                    <span className="text-sm">
                      会员有效期至: {new Date(stats.expiresAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}

                {stats.accountType === 'redeem' && stats.dailyQuota && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 opacity-90" />
                    <span className="text-sm">
                      每日额度: {stats.dailyQuota} 次
                    </span>
                  </div>
                )}

                {stats.accountType === 'free' && (
                  <div className="text-sm opacity-90">
                    免费用户 · 每日 3 次查询额度
                  </div>
                )}
              </div>
            </div>

            {stats.accountType === 'free' && (
              <Link
                href="/redeem"
                className="bg-white text-[#D4772C] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
              >
                兑换会员
              </Link>
            )}
          </div>
        </div>

        {/* 学习概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="学习天数"
            value={stats.studyDays}
            unit="天"
            color="blue"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="总查询"
            value={stats.totalQueries}
            unit="次"
            color="green"
          />
          <StatCard
            icon={<BookMarked className="w-5 h-5" />}
            label="收藏"
            value={stats.totalCollections}
            unit="条"
            color="purple"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="错题"
            value={stats.totalErrors}
            unit="道"
            color="orange"
          />
        </div>

        {/* 掌握度 */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
          <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4772C]" />
            知识点掌握度
          </h2>

          <div className="space-y-4">
            <ProgressBar
              label="N1 语法"
              current={stats.grammarQueries}
              total={210}
              percentage={stats.grammarMastery}
              color="blue"
            />
            <ProgressBar
              label="N1 词汇"
              current={stats.vocabQueries}
              total={1311}
              percentage={stats.vocabMastery}
              color="green"
            />
          </div>

          <div className="mt-4 p-3 bg-[#FAF6F0] rounded-lg">
            <p className="text-xs text-[#6B5E54]">
              💡 掌握度基于你的查询和收藏记录计算。继续学习，提升掌握度！
            </p>
          </div>
        </div>

        {/* 学习分布 */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
          <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4772C]" />
            学习分布
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.grammarQueries}</div>
              <div className="text-xs text-[#6B5E54] mt-1">语法查询</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.vocabQueries}</div>
              <div className="text-xs text-[#6B5E54] mt-1">词汇查询</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.analyzeQueries}</div>
              <div className="text-xs text-[#6B5E54] mt-1">错题分析</div>
            </div>
          </div>
        </div>

        {/* 学习画像 */}
        {profile && profile.totalErrors > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
            <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4772C]" />
              学习画像
            </h2>

            {/* 薄弱点 Top 3 */}
            {profile.weakAreas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#6B5E54] mb-3">薄弱知识点</h3>
                <div className="space-y-2">
                  {profile.weakAreas.slice(0, 3).map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4772C] text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#2D2420]">{area.specificPoint}</div>
                          <div className="text-xs text-[#6B5E54]">
                            {area.knowledgeType === 'grammar' ? '语法' :
                             area.knowledgeType === 'vocab' ? '词汇' :
                             area.knowledgeType === 'kanji' ? '汉字' :
                             area.knowledgeType === 'reading' ? '阅读' : '听力'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#C75B3B]">{area.errorCount}</div>
                        <div className="text-xs text-[#6B5E54]">次错误</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 错误模式分析 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#6B5E54] mb-3">错误模式分析</h3>
              <div className="grid grid-cols-2 gap-2">
                <ErrorPatternBadge label="概念理解" count={profile.errorPatterns.concept} />
                <ErrorPatternBadge label="粗心大意" count={profile.errorPatterns.careless} />
                <ErrorPatternBadge label="不熟悉" count={profile.errorPatterns.unfamiliar} />
                <ErrorPatternBadge label="知识混淆" count={profile.errorPatterns.confusion} />
                <ErrorPatternBadge label="复杂题目" count={profile.errorPatterns.complex} />
              </div>
            </div>

            {/* 学习建议 */}
            {profile.recommendations.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-[#D4772C]/10 to-[#E89A5C]/10 rounded-lg">
                <h3 className="text-sm font-semibold text-[#2D2420] mb-2 flex items-center gap-2">
                  💡 学习建议
                </h3>
                <ul className="space-y-2">
                  {profile.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-[#6B5E54] flex items-start gap-2">
                      <span className="text-[#D4772C] mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 额度使用 */}
        {stats.quotaRemaining > 0 && (
          <div className="bg-gradient-to-r from-[#D4772C]/10 to-[#E89A5C]/10 rounded-2xl border border-[#E8E0D5] p-6">
            <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D4772C]" />
              已解锁额度
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-[#D4772C]">{stats.quotaRemaining}</div>
                <div className="text-sm text-[#6B5E54] mt-1">剩余查询次数</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-[#6B5E54]">{stats.quotaUsed}</div>
                <div className="text-xs text-[#6B5E54]">已使用</div>
              </div>
            </div>
          </div>
        )}

        {/* 邀请奖励 */}
        {stats.accountType === 'redeem' && stats.invite && (
          <div className="bg-gradient-to-r from-[#4A7C59]/10 to-[#5A8C69]/10 rounded-2xl border border-[#4A7C59]/20 p-6">
            <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4A7C59]" />
              邀请奖励
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-[#4A7C59]">{stats.invite.invite_count}</div>
                <div className="text-xs text-[#6B5E54] mt-1">成功邀请人数</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-[#D4772C]">{stats.invite.invite_rewards}</div>
                <div className="text-xs text-[#6B5E54] mt-1">获得奖励月数</div>
              </div>
            </div>

            <Link
              href="/invite"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#4A7C59] to-[#5A8C69] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
            >
              <Gift className="w-4 h-4" />
              查看我的邀请码
            </Link>

            <p className="text-xs text-[#6B5E54] mt-3 text-center">
              邀请好友兑换码，您的会员时长延长1个月
            </p>
          </div>
        )}

        {/* 返现进度 */}
        {stats.accountType === 'redeem' && stats.cashback && (
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
            <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4772C]" />
              返现进度
            </h2>

            <div className="space-y-4">
              {/* 当前进度 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B5E54]">当前进度</span>
                  <span className="text-lg font-bold text-[#D4772C]">
                    {stats.cashback.currentProgress} / 100
                  </span>
                </div>

                <div className="h-3 bg-[#E8E0D5] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.cashback.progressPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#D4772C] to-[#E89A5C]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B5E54]">
                  <span>还需 {stats.cashback.remainingForNext} 道题</span>
                  <span>下次返现: {stats.cashback.nextMilestone} 道</span>
                </div>
              </div>

              {/* 返现统计 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-[#D4772C]/10 to-[#E89A5C]/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-[#D4772C]">{stats.cashback.totalRewards}</div>
                  <div className="text-xs text-[#6B5E54] mt-1">已获得返现</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalErrors}</div>
                  <div className="text-xs text-[#6B5E54] mt-1">累计错题</div>
                </div>
              </div>

              {/* 返现历史 */}
              {stats.cashback.history.length > 0 && (
                <div className="border-t border-[#E8E0D5] pt-3">
                  <div className="text-xs font-medium text-[#6B5E54] mb-2">返现记录</div>
                  <div className="space-y-2">
                    {stats.cashback.history.map((record, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-[#6B5E54]">
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <span className="text-[#2D2420] font-medium">
                          {record.milestone} 道题 → 延长 {record.rewardValue} 个月
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#6B5E54] bg-[#FAF6F0] rounded-lg p-2">
                💡 每完成 100 道错题分析，自动延长会员 1 个月
              </p>
            </div>
          </div>
        )}

        {/* 成就徽章 */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6">
          <h2 className="text-lg font-bold text-[#2D2420] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4772C]" />
            学习成就
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Badge
              emoji="🔥"
              label="初学者"
              unlocked={stats.totalQueries >= 1}
              desc="完成首次查询"
            />
            <Badge
              emoji="📚"
              label="勤奋学习"
              unlocked={stats.totalQueries >= 50}
              desc="查询50次"
            />
            <Badge
              emoji="⭐"
              label="收藏达人"
              unlocked={stats.totalCollections >= 20}
              desc="收藏20条内容"
            />
            <Badge
              emoji="🎯"
              label="坚持不懈"
              unlocked={stats.studyDays >= 7}
              desc="学习7天"
            />
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/collection"
            className="bg-white rounded-xl border border-[#E8E0D5] p-4 hover:shadow-md transition-shadow text-center"
          >
            <BookMarked className="w-6 h-6 text-[#D4772C] mx-auto mb-2" />
            <div className="text-sm font-medium text-[#2D2420]">我的收藏</div>
            <div className="text-xs text-[#6B5E54] mt-1">{stats.totalCollections} 条</div>
          </Link>
          <Link
            href="/report"
            className="bg-white rounded-xl border border-[#E8E0D5] p-4 hover:shadow-md transition-shadow text-center"
          >
            <AlertCircle className="w-6 h-6 text-[#D4772C] mx-auto mb-2" />
            <div className="text-sm font-medium text-[#2D2420]">薄弱点报告</div>
            <div className="text-xs text-[#6B5E54] mt-1">{stats.weaknessCount} 个语法点</div>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8E0D5] p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-[#2D2420]">{value}</div>
      <div className="text-xs text-[#6B5E54] mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ label, current, total, percentage, color }: {
  label: string;
  current: number;
  total: number;
  percentage: number;
  color: 'blue' | 'green';
}) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#2D2420]">{label}</span>
        <span className="text-sm text-[#6B5E54]">
          {current} / {total} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${colors[color]}`}
        />
      </div>
    </div>
  );
}

function Badge({ emoji, label, unlocked, desc }: {
  emoji: string;
  label: string;
  unlocked: boolean;
  desc: string;
}) {
  return (
    <div className={`p-3 rounded-xl border ${
      unlocked
        ? 'bg-gradient-to-br from-[#D4772C]/10 to-[#E89A5C]/10 border-[#D4772C]/30'
        : 'bg-gray-50 border-gray-200 opacity-50'
    }`}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xs font-medium text-[#2D2420]">{label}</div>
      <div className="text-xs text-[#6B5E54] mt-0.5">{desc}</div>
    </div>
  );
}

function ErrorPatternBadge({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-3 bg-[#FAF6F0] rounded-lg text-center">
      <div className="text-xl font-bold text-[#D4772C]">{count}</div>
      <div className="text-xs text-[#6B5E54] mt-1">{label}</div>
    </div>
  );
}
