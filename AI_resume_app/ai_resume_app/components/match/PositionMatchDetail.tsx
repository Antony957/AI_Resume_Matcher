"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

import ResumeDetailModal from "./ResumeDetailModal";

import { supabase } from "@/config/supabaseClient";
import { Position, MatchResult, ResumeProfile } from "@/types";

interface PositionMatchDetailProps {
  position: Position;
  isOpen: boolean;
  onClose: () => void;
}

interface MatchedResume extends MatchResult {
  resume_profile: ResumeProfile;
}

export default function PositionMatchDetail({
  position,
  isOpen,
  onClose,
}: PositionMatchDetailProps) {
  const [matchedResumes, setMatchedResumes] = useState<MatchedResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeProfile | null>(
    null,
  );
  const [showResumeDetail, setShowResumeDetail] = useState(false);

  useEffect(() => {
    if (isOpen && position.id) {
      fetchMatchedResumes();
    }
  }, [isOpen, position.id]);

  const fetchMatchedResumes = async () => {
    try {
      setLoading(true);

      // 获取该职位的所有匹配结果，包含简历信息
      const { data: matches, error } = await supabase
        .from("match_result")
        .select(
          `
          *,
          resume(*)
        `,
        )
        .eq("position_id", position.id)
        .order("sum_score", { ascending: false });

      if (error) {
        console.error("获取匹配简历失败:", error);

        return;
      }

      if (matches) {
        // 处理数据结构，因为 Supabase 的嵌套查询返回格式可能不同
        const processedMatches = matches.map((match) => ({
          ...match,
          resume_profile: match.resume,
        }));

        setMatchedResumes(processedMatches);
      }
    } catch (error) {
      console.error("获取匹配简历失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeClick = (resume: ResumeProfile) => {
    setSelectedResume(resume);
    setShowResumeDetail(true);
  };

  const handleCloseResumeDetail = () => {
    setShowResumeDetail(false);
    setSelectedResume(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
 
    return "danger";
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";

    return "text-red-600";
  };

  return (
    <>
      <Modal
        isOpen={isOpen} 
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">{position.position}</h2>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span>📍 {position.location || "未指定"}</span>
              <span>🏢 {position.company_name || "未指定"}</span>
              <span>💰 {position.salary || "面议"}</span>
              {position.level && <span>📊 Level {position.level}</span>}
            </div>
          </ModalHeader>

          <ModalBody>
            {/* 职位详情 */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">职位详情</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {position.jd && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">职位描述</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {position.jd}
                    </p>
                  </div>
                )}

                {position.require && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">职位要求</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {position.require}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {position.racetrack && (
                    <div>
                      <span className="font-medium text-gray-700">赛道: </span>
                      <span className="text-gray-600">
                        {position.racetrack}
                      </span>
                    </div>
                  )}

                  {position.adviser && (
                    <div>
                      <span className="font-medium text-gray-700">顾问: </span>
                      <span className="text-gray-600">{position.adviser}</span>
                    </div>
                  )}

                  {position.hc && (
                    <div>
                      <span className="font-medium text-gray-700">
                        招聘人数:{" "}
                      </span>
                      <span className="text-gray-600">{position.hc}</span>
                    </div>
                  )}

                  {position.intern && (
                    <div>
                      <span className="font-medium text-gray-700">
                        实习情况:{" "}
                      </span>
                      <span className="text-gray-600">{position.intern}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* 推荐简历列表 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  推荐简历 ({matchedResumes.length})
                </h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  按匹配度排序
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <div className="text-gray-600">加载推荐简历中...</div>
                  </div>
                </div>
              ) : matchedResumes.length === 0 ? (
                <Card>
                  <CardBody className="text-center py-8">
                    <div className="text-gray-500 mb-2">暂无匹配的简历</div>
                    <p className="text-sm text-gray-400">
                      该职位还没有匹配到合适的简历
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-4">
                  {matchedResumes.map((match, index) => (
                    <Card
                      key={match.id}
                      isPressable
                      as="div"
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onPress={() => handleResumeClick(match.resume_profile)}
                    >
                      <CardBody>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-semibold text-primary">
                                #{index + 1}
                              </span>
                              <h4 className="text-lg font-semibold">
                                {match.resume_profile.full_name || "未命名"}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  match.sum_score >= 80
                                    ? "bg-green-100 text-green-800"
                                    : match.sum_score >= 60
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                总分: {match.sum_score.toFixed(1)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                              {match.resume_profile.email && (
                                <span>📧 {match.resume_profile.email}</span>
                              )}
                              {match.resume_profile.phone && (
                                <span>📱 {match.resume_profile.phone}</span>
                              )}
                              {match.resume_profile.location && (
                                <span>📍 {match.resume_profile.location}</span>
                              )}
                              {match.resume_profile.years_experience && (
                                <span>
                                  💼 {match.resume_profile.years_experience}
                                  年经验
                                </span>
                              )}
                            </div>

                            {match.resume_profile.headline && (
                              <p className="text-gray-700 mb-3">
                                {match.resume_profile.headline}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 评分详情 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">
                                技能匹配
                              </span>
                              <span
                                className={`text-sm font-medium ${getScoreColorClass(match.skill_score)}`}
                              >
                                {match.skill_score.toFixed(1)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  match.skill_score >= 80
                                    ? "bg-green-500"
                                    : match.skill_score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(match.skill_score, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">
                                教育背景
                              </span>
                              <span
                                className={`text-sm font-medium ${getScoreColorClass(match.education_score)}`}
                              >
                                {match.education_score.toFixed(1)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  match.education_score >= 80
                                    ? "bg-green-500"
                                    : match.education_score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(match.education_score, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">
                                其他因素
                              </span>
                              <span
                                className={`text-sm font-medium ${getScoreColorClass(match.other_score)}`}
                              >
                                {match.other_score.toFixed(1)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  match.other_score >= 80
                                    ? "bg-green-500"
                                    : match.other_score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(match.other_score, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 技能预览 */}
                        {match.resume_profile.skills &&
                          match.resume_profile.skills.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-600 mb-2 block">
                                主要技能:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.resume_profile.skills
                                  .slice(0, 8)
                                  .map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {match.resume_profile.skills.length > 8 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    +{match.resume_profile.skills.length - 8}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                        <div className="mt-4 flex justify-end">
                          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                            查看简历详情 →
                          </button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color="primary" variant="light" onPress={onClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 简历详情模态框 */}
      {selectedResume && (
        <ResumeDetailModal
          isOpen={showResumeDetail}
          resume={selectedResume}
          onClose={handleCloseResumeDetail}
        />
      )}
    </>
  );
}
