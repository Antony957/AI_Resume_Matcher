import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";

interface PositionMatchResult {
  resume_id: string;
  rank_order: number;
  overall_score: number;
  skill_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  potential_score: number;
  match_reasons: string[];
  risk_factors: string[];
  matched_at: string;
  candidate_info: {
    full_name: string;
    headline: string;
    years_experience: number;
    location: string;
    skills: string[];
  };
}

interface PositionMatchResultsProps {
  positionId: string;
  positionTitle?: string;
  companyName?: string;
  onResumeClick?: (resumeId: string) => void;
}

export default function PositionMatchResults({
  positionId,
  positionTitle = "未知职位",
  companyName = "未知公司",
  onResumeClick,
}: PositionMatchResultsProps) {
  const [matches, setMatches] = useState<PositionMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggeringMatch, setTriggeringMatch] = useState(false);

  // 获取匹配结果
  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/llm-match?type=position&id=${positionId}&limit=10`,
      );
      const data = await response.json();

      if (data.success) {
        setMatches(data.data || []);
      } else {
        setError(data.error || "获取匹配结果失败");
      }
    } catch (err) {
      console.error("获取匹配结果出错:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 触发匹配任务
  const triggerMatch = async () => {
    setTriggeringMatch(true);
    setError(null);

    try {
      const response = await fetch("/api/llm-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "match_position",
          position_id: positionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 匹配任务创建成功，等待一段时间后重新获取结果
        setTimeout(() => {
          fetchMatches();
        }, 3000);
      } else {
        setError(data.error || "触发匹配失败");
      }
    } catch (err) {
      console.error("触发匹配出错:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setTriggeringMatch(false);
    }
  };

  useEffect(() => {
    if (positionId) {
      fetchMatches();
    }
  }, [positionId]);

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";

    return "danger";
  };

  // 格式化分数显示
  const formatScore = (score: number) => Math.round(score);

  return (
    <div className="w-full space-y-4">
      {/* 标题和操作区 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AI智能推荐简历</h2>
          <p className="text-gray-600 mt-1">
            职位: {positionTitle} @ {companyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button color="primary" isDisabled={loading} onPress={fetchMatches}>
            刷新结果
          </Button>
          <Button
            color="secondary"
            isDisabled={loading}
            isLoading={triggeringMatch}
            onPress={triggerMatch}
          >
            重新匹配
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">正在获取匹配结果...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <div className="text-red-700">
              <strong>获取失败：</strong> {error}
            </div>
            <Button
              className="mt-2"
              color="danger"
              size="sm"
              onPress={fetchMatches}
            >
              重试
            </Button>
          </CardBody>
        </Card>
      )}

      {/* 匹配结果 */}
      {!loading && !error && matches.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            找到 {matches.length} 个高匹配度候选人，按推荐度排序：
          </div>

          {matches.map((match) => (
            <Card
              key={match.resume_id}
              isPressable
              as="div"
              className="border hover:border-blue-300 transition-colors cursor-pointer"
              onPress={() => onResumeClick?.(match.resume_id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="bg-blue-100 text-blue-700"
                      name={match.candidate_info.full_name}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {match.candidate_info.full_name}
                        </h3>
                        <Chip color="primary" size="sm" variant="flat">
                          排名 #{match.rank_order}
                        </Chip>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {match.candidate_info.headline} •{" "}
                        {match.candidate_info.years_experience}年经验
                      </p>
                      <p className="text-gray-500 text-sm">
                        📍 {match.candidate_info.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatScore(match.overall_score)}
                    </div>
                    <div className="text-sm text-gray-500">综合评分</div>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                {/* 详细评分 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">技能匹配</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.skill_match_score)}
                      size="sm"
                      value={match.skill_match_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">经验匹配</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.experience_match_score)}
                      size="sm"
                      value={match.experience_match_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">教育匹配</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.education_match_score)}
                      size="sm"
                      value={match.education_match_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">发展潜力</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.potential_score)}
                      size="sm"
                      value={match.potential_score}
                    />
                  </div>
                </div>

                {/* 推荐理由 */}
                {match.match_reasons && match.match_reasons.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      ✨ 推荐理由:
                    </h4>
                    <div className="space-y-1">
                      {match.match_reasons.map((reason, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <span className="text-green-500 mt-1">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风险因素 */}
                {match.risk_factors && match.risk_factors.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      ⚠️ 需要关注:
                    </h4>
                    <div className="space-y-1">
                      {match.risk_factors.map((risk, index) => (
                        <div
                          key={index}
                          className="text-sm text-amber-600 flex items-start gap-2"
                        >
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 技能标签 */}
                {match.candidate_info.skills &&
                  match.candidate_info.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        🔧 核心技能:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {match.candidate_info.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            color="default"
                            size="sm"
                            variant="flat"
                          >
                            {skill}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 匹配时间 */}
                <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                  匹配时间: {new Date(match.matched_at).toLocaleString("zh-CN")}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* 无匹配结果 */}
      {!loading && !error && matches.length === 0 && (
        <Card className="border-gray-200">
          <CardBody className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-lg font-semibold">暂无匹配结果</h3>
              <p className="text-sm mt-1">
                该职位还没有AI匹配的简历推荐，点击&ldquo;重新匹配&rdquo;开始智能匹配
              </p>
            </div>
            <Button
              color="primary"
              isLoading={triggeringMatch}
              onPress={triggerMatch}
            >
              开始AI匹配
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
