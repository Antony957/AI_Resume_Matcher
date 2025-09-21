import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";

interface ResumeMatchResult {
  position_id: string;
  rank_order: number;
  overall_score: number;
  skill_fit_score: number;
  experience_relevance_score: number;
  career_growth_score: number;
  company_culture_fit: number;
  match_reasons: string[];
  development_suggestions: string[];
  matched_at: string;
  position_info: {
    position: string;
    company_name: string;
    location: string;
    salary: string;
    level: number;
  };
}

interface ResumeMatchResultsProps {
  resumeId: string;
  candidateName?: string;
  onPositionClick?: (positionId: string) => void;
}

export default function ResumeMatchResults({
  resumeId,
  candidateName = "候选人",
  onPositionClick,
}: ResumeMatchResultsProps) {
  const [matches, setMatches] = useState<ResumeMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggeringMatch, setTriggeringMatch] = useState(false);

  // 获取匹配结果
  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/llm-match?type=resume&id=${resumeId}&limit=5`,
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
          action: "match_resume",
          resume_id: resumeId,
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
    if (resumeId) {
      fetchMatches();
    }
  }, [resumeId]);

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";

    return "danger";
  };

  // 格式化分数显示
  const formatScore = (score: number) => Math.round(score);

  // 获取职位等级显示
  const getLevelDisplay = (level: number) => {
    const levels = ["实习", "初级", "中级", "高级", "专家", "总监"];

    return levels[level] || `L${level}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* 标题和操作区 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AI推荐职位</h2>
          <p className="text-gray-600 mt-1">
            为 {candidateName} 推荐的最适合职位机会
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
            找到 {matches.length} 个高匹配度职位机会，按推荐度排序：
          </div>

          {matches.map((match) => (
            <Card
              key={match.position_id}
              isPressable
              as="div"
              className="border hover:border-blue-300 transition-colors cursor-pointer"
              onPress={() => onPositionClick?.(match.position_id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {match.position_info.company_name?.charAt(0) || "🏢"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">
                          {match.position_info.position}
                        </h3>
                        <Chip color="primary" size="sm" variant="flat">
                          推荐 #{match.rank_order}
                        </Chip>
                      </div>
                      <p className="text-gray-600 text-sm font-semibold">
                        {match.position_info.company_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>📍 {match.position_info.location}</span>
                        <span>💰 {match.position_info.salary}</span>
                        <span>
                          📊 {getLevelDisplay(match.position_info.level)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatScore(match.overall_score)}
                    </div>
                    <div className="text-sm text-gray-500">匹配度</div>
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
                      color={getScoreColor(match.skill_fit_score)}
                      size="sm"
                      value={match.skill_fit_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">经验相关</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.experience_relevance_score)}
                      size="sm"
                      value={match.experience_relevance_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">职业发展</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.career_growth_score)}
                      size="sm"
                      value={match.career_growth_score}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">文化匹配</div>
                    <Progress
                      showValueLabel
                      color={getScoreColor(match.company_culture_fit)}
                      size="sm"
                      value={match.company_culture_fit}
                    />
                  </div>
                </div>

                {/* 推荐理由 */}
                {match.match_reasons && match.match_reasons.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      🎯 推荐理由:
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

                {/* 发展建议 */}
                {match.development_suggestions &&
                  match.development_suggestions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        🚀 发展建议:
                      </h4>
                      <div className="space-y-1">
                        {match.development_suggestions.map(
                          (suggestion, index) => (
                            <div
                              key={index}
                              className="text-sm text-blue-600 flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{suggestion}</span>
                            </div>
                          ),
                        )}
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
              <div className="text-4xl mb-2">💼</div>
              <h3 className="text-lg font-semibold">暂无匹配职位</h3>
              <p className="text-sm mt-1">
                该简历还没有AI推荐的职位机会，点击&ldquo;重新匹配&rdquo;开始智能匹配
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
