"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";

import ResumeDetailModal from "@/components/ResumeDetailModal";

// Helper to ensure tags always come back as an array of strings
function normalizeTags(tags?: any): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (tags && typeof tags === "object") {
    const maybe = tags.skills ?? tags.category ?? tags.market;
    return Array.isArray(maybe) ? maybe : [];
  }
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.skills)) {
        return parsed.skills;
      }
    } catch {
      // Fallback to comma-separated
      return tags.split(",").map(t => t.trim()).filter(t => t);
    }
  }
  return [];
}

interface SimpleMatchStats {
  position?: any;
  resume?: any;
  total_matches: number;
  tag_matches: number;
  education_matches: number;
  latest_match_date: string;
  avg_tag_ratio: number;
  match_details: any[];
}

interface DetailMatch {
  resume_id?: string;
  position_id?: string;
  tag_match_count: number;
  tag_match_ratio: number;
  education_match: boolean;
  match_details: any;
  created_at: string;
  resume?: any;
  positions?: any;
}

export default function MatchResultsPage() {
  const router = useRouter();
  const [positionStats, setPositionStats] = useState<SimpleMatchStats[]>([]);
  const [resumeStats, setResumeStats] = useState<SimpleMatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("positions");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailMatches, setDetailMatches] = useState<DetailMatch[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 模态框控制
  const detailModal = useDisclosure();
  const resumeDetailModal = useDisclosure();
  const [detailResumeId, setDetailResumeId] = useState<string | null>(null);

  useEffect(() => {
    fetchSimpleMatches();
  }, []);

  const fetchSimpleMatches = async () => {
    try {
      setLoading(true);
      const [positionsRes, resumesRes] = await Promise.all([
        fetch(`/api/simple-matches?view=positions&limit=50`),
        fetch(`/api/simple-matches?view=resumes&limit=50`),
      ]);

      const positionsData = await positionsRes.json();
      const resumesData = await resumesRes.json();

      if (positionsData.success) setPositionStats(positionsData.data || []);
      if (resumesData.success) setResumeStats(resumesData.data || []);
    } catch (error) {
      console.error("获取匹配结果失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: any, type: "position" | "resume") => {
    try {
      const response = await fetch("/api/simple-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id: type === "position" ? item.position.id : item.resume.id,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.[0]) {
        const firstMatch = data.data[0];
        const positionId = type === "position" ? item.position.id : firstMatch.position_id;
        const resumeId = type === "resume"
          ? item.resume.id
          : firstMatch.resume_id || firstMatch.resume?.id;
        router.push(
          `/match-detail?source=${type}&${
            type === "position"
              ? `position_id=${positionId}&resume_id=${resumeId}`
              : `resume_id=${resumeId}&position_id=${positionId}`
          }`,
        );
      } else {
        console.error("没有找到匹配数据");
      }
    } catch (error) {
      console.error("获取匹配数据失败:", error);
    }
  };

  const handleResumeClick = (resumeId: string) => {
    setDetailResumeId(resumeId);
    resumeDetailModal.onOpen();
  };

  const renderPositionStats = () => {
    if (!positionStats.length) {
      return (
        <Card className="p-8">
          <CardBody className="text-center">
            <div className="text-gray-500 mb-4">
              {/* SVG omitted for brevity */}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无职位匹配结果</h3>
            <p className="text-gray-600">还没有任何职位匹配结果，请先运行批量匹配算法。</p>
          </CardBody>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {positionStats.map((stats) => (
          <Card
            key={stats.position.id}
            isPressable
            as="div"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onPress={() => handleItemClick(stats, "position")}
          >
            <CardHeader className="flex gap-3">
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">
                    {stats.position.position_name}
                  </h3>
                  <Chip color="primary" size="sm" variant="flat">
                    {stats.total_matches} 个候选人
                  </Chip>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                  <span>🏢 {stats.position.company_name || "未知公司"}</span>
                  <span>📍 {stats.position.location || "未指定"}</span>
                  <span>💰 {stats.position.salary_range || "面议"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {normalizeTags(stats.position.tags).slice(0, 3).map((tag, i) => (
                    <Chip key={i} className="text-xs" size="sm" variant="bordered">
                      {tag}
                    </Chip>
                  ))}
                  {normalizeTags(stats.position.tags).length > 3 && (
                    <Chip className="text-xs" size="sm" variant="bordered">
                      +{normalizeTags(stats.position.tags).length - 3}
                    </Chip>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center gap-2">
                <div className="text-sm text-gray-500">最新匹配</div>
                <div className="text-sm font-medium">
                  {new Date(stats.latest_match_date).toLocaleDateString("zh-CN")}
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_matches}</div>
                  <div className="text-sm text-gray-500">总匹配数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.tag_matches}</div>
                  <div className="text-sm text-gray-500">标签匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.education_matches}</div>
                  <div className="text-sm text-gray-500">学历匹配</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">平均标签匹配率:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {(stats.avg_tag_ratio * 100).toFixed(1)}%
                  </span>
                </div>
                <Button color="primary" size="sm" variant="flat">
                  查看候选人对比 →
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  const renderResumeStats = () => {
    if (resumeStats.length === 0) {
      return (
        <Card className="p-8">
          <CardBody className="text-center">
            <div className="text-gray-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无简历匹配结果
            </h3>
            <p className="text-gray-600">
              还没有任何简历匹配结果，请先运行批量匹配算法。
            </p>
          </CardBody>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {resumeStats.map((stats, index) => (
          <Card
            key={stats.resume.id}
            isPressable
            as="div"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onPress={() => handleItemClick(stats, "resume")}
          >
            <CardHeader className="flex gap-3">
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">
                    {stats.resume.full_name}
                  </h3>
                  <Chip color="success" size="sm" variant="flat">
                    {stats.total_matches} 个职位推荐
                  </Chip>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                  <span>
                    🎓 {stats.resume.highest_education_level || "未知学历"}
                  </span>
                  <span>💼 {stats.resume.years_experience || 0} 年经验</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      stats.resume.status === "tagged"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {stats.resume.status === "tagged"
                      ? "已处理"
                      : stats.resume.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {normalizeTags(stats.resume.tags)
                    .slice(0, 3)
                    .map((tag: string, i: number) => (
                      <Chip
                        key={i}
                        className="text-xs"
                        size="sm"
                        variant="bordered"
                      >
                        {tag}
                      </Chip>
                    ))}
                  {normalizeTags(stats.resume.tags).length > 3 && (
                    <Chip className="text-xs" size="sm" variant="bordered">
                      +{normalizeTags(stats.resume.tags).length - 3}
                    </Chip>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center gap-2">
                <div className="text-sm text-gray-500">最新匹配</div>
                <div className="text-sm font-medium">
                  {new Date(stats.latest_match_date).toLocaleDateString(
                    "zh-CN",
                  )}
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total_matches}
                  </div>
                  <div className="text-sm text-gray-500">总匹配数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.tag_matches}
                  </div>
                  <div className="text-sm text-gray-500">标签匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.education_matches}
                  </div>
                  <div className="text-sm text-gray-500">学历匹配</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">平均标签匹配率:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {(stats.avg_tag_ratio * 100).toFixed(1)}%
                  </span>
                </div>
                <Button color="success" size="sm" variant="flat">
                  查看职位对比 →
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const isPosition = activeTab === "positions";

    // 确保 selectedItem 的结构与当前 tab 匹配
    const hasValidData = isPosition
      ? selectedItem.position
      : selectedItem.resume;

    if (!hasValidData) {
      return null; // 如果数据结构不匹配，不渲染模态框
    }

    const title = isPosition
      ? `${selectedItem.position?.position_name || "未知职位"} - 推荐简历`
      : `${selectedItem.resume?.full_name || "未知姓名"} - 推荐职位`;

    return (
      <Modal
        isOpen={detailModal.isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={detailModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="text-sm text-gray-600">
              共找到 {detailMatches.length} 个匹配结果
            </div>
          </ModalHeader>

          <ModalBody>
            {loadingDetail ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {detailMatches.map((match, index) => (
                  <Card key={index} className="border">
                    <CardBody>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          {isPosition ? (
                            // 显示简历信息
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold">
                                  {match.resume?.full_name}
                                </h4>
                                <Button
                                  color="primary"
                                  size="sm"
                                  variant="light"
                                  onPress={() =>
                                    handleResumeClick(match.resume?.id)
                                  }
                                >
                                  查看详情
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                                <span>
                                  🎓{" "}
                                  {match.resume?.highest_education_level ||
                                    "未知学历"}
                                </span>
                                <span>
                                  💼 {match.resume?.years_experience || 0}{" "}
                                  年经验
                                </span>
                                <span>
                                  📱 {match.resume?.phone || "未提供"}
                                </span>
                                <span>
                                  📧 {match.resume?.email || "未提供"}
                                </span>
                              </div>
                              {match.resume?.tags && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {match.resume.tags.map(
                                    (tag: string, i: number) => (
                                      <Chip
                                        key={i}
                                        className="text-xs"
                                        size="sm"
                                        variant="bordered"
                                      >
                                        {tag}
                                      </Chip>
                                    ),
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            // 显示职位信息
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold">
                                  {match.positions?.position_name}
                                </h4>
                                <Chip color="primary" size="sm" variant="flat">
                                  {match.positions?.company_name}
                                </Chip>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                                <span>
                                  📍 {match.positions?.location || "未指定"}
                                </span>
                                <span>
                                  💰 {match.positions?.salary_range || "面议"}
                                </span>
                                <span>
                                  🎓{" "}
                                  {match.positions?.min_education_level ||
                                    "不限"}
                                </span>
                              </div>
                              {match.positions?.tags && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {match.positions.tags.map(
                                    (tag: string, i: number) => (
                                      <Chip
                                        key={i}
                                        className="text-xs"
                                        size="sm"
                                        variant="bordered"
                                      >
                                        {tag}
                                      </Chip>
                                    ),
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-blue-600">
                                {match.tag_match_count}
                              </div>
                              <div className="text-gray-500">标签匹配</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-green-600">
                                {(match.tag_match_ratio * 100).toFixed(1)}%
                              </div>
                              <div className="text-gray-500">匹配率</div>
                            </div>
                          </div>

                          <div className="text-center">
                            <Chip
                              color={
                                match.education_match ? "success" : "default"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {match.education_match
                                ? "✓ 学历匹配"
                                : "✗ 学历不匹配"}
                            </Chip>
                          </div>

                          <div className="text-xs text-gray-500 text-center">
                            {new Date(match.created_at).toLocaleDateString(
                              "zh-CN",
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              color="primary"
              variant="light"
              onPress={detailModal.onClose}
            >
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <div className="text-gray-600">加载匹配结果中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pt-16 bg-white">
      <div className="h-full p-6 overflow-y-auto">
        <div className="max-w-none mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              智能匹配结果
            </h1>
            <p className="text-gray-600">
              基于标签和学历的简历职位匹配结果，点击查看详细匹配信息
            </p>
          </div>

          {/* 视图切换 */}
          <Tabs
            className="mb-6"
            selectedKey={activeTab}
            onSelectionChange={(key) => {
              setActiveTab(key.toString());
              // 切换标签时清理选中项和详细匹配数据，避免数据结构不匹配
              setSelectedItem(null);
              setDetailMatches([]);
              detailModal.onClose(); // 关闭可能打开的模态框
            }}
          >
            <Tab
              key="positions"
              title={
                <div className="flex items-center space-x-2">
                  <span>📋 职位推荐</span>
                  <Chip color="primary" size="sm" variant="flat">
                    {positionStats.length}
                  </Chip>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    职位的简历推荐
                  </h2>
                  <div className="text-sm text-gray-500">
                    展示每个职位匹配到的候选简历
                  </div>
                </div>
                {renderPositionStats()}
              </div>
            </Tab>

            <Tab
              key="resumes"
              title={
                <div className="flex items-center space-x-2">
                  <span>👤 简历推荐</span>
                  <Chip color="success" size="sm" variant="flat">
                    {resumeStats.length}
                  </Chip>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    简历的职位推荐
                  </h2>
                  <div className="text-sm text-gray-500">
                    展示每份简历匹配到的职位推荐
                  </div>
                </div>
                {renderResumeStats()}
              </div>
            </Tab>
          </Tabs>

          {/* 详情模态框 */}
          {renderDetailModal()}

          {/* 简历详情模态框 */}
          <ResumeDetailModal
            isOpen={resumeDetailModal.isOpen}
            resumeId={detailResumeId}
            onOpenChange={resumeDetailModal.onOpenChange}
          />
        </div>
      </div>
    </div>
  );
}
