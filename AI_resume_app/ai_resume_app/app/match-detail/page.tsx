"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

interface MatchItem {
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

interface MatchDetailData {
  sourceType: "position" | "resume";
  sourceItem: any; // 固定的职位或简历信息
  matchItems: MatchItem[]; // 匹配的简历或职位列表
  currentMatch: MatchItem | null; // 当前选中的匹配项
}

// 规范化语言数据，确保为数组
function normalizeLanguages(languages: any): any[] {
  if (Array.isArray(languages)) return languages;
  if (!languages) return [];
  if (typeof languages === "string") {
    try {
      const parsed = JSON.parse(languages);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof languages === "object") {
    // 兼容可能的 { languages: [...] } 结构
    if (Array.isArray((languages as any).languages)) return (languages as any).languages;
    return [];
  }
  return [];
}

// 通用数组规范化：支持数组或可解析为数组的 JSON 字符串
function normalizeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value) return [] as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      // 尝试逗号分隔（多用于字符串标签/技能等简单场景）
      const parts = value.split?.(",");
      return Array.isArray(parts)
        ? (parts.map((p: string) => p.trim()).filter(Boolean) as T[])
        : ([] as T[]);
    }
  }
  // 对象场景无法可靠推断，返回空数组更安全
  return [] as T[];
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full w-12 h-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <div className="text-gray-600">加载中...</div>
      </div>
    </div>}>
      <MatchDetailContent />
    </Suspense>
  );
}

function MatchDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [matchData, setMatchData] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const resumeId = searchParams.get("resume_id");
  const positionId = searchParams.get("position_id");
  const sourceTypeParam = searchParams.get("source") as "position" | "resume"; // 新增：源类型参数

  useEffect(() => {
    if ((resumeId && positionId) || (sourceTypeParam && (resumeId || positionId))) {
      fetchMatchDetail();
    }
  }, [resumeId, positionId, sourceTypeParam]);

  const fetchMatchDetail = async () => {
    try {
      setLoading(true);

      // 确定源类型：如果有明确的source参数则使用，否则根据业务逻辑推断
      const actualSourceType =
        sourceTypeParam || (positionId && resumeId ? "position" : null);

      if (actualSourceType === "position" && positionId) {
        // 从职位进入：获取职位信息和匹配的简历列表
        const [positionRes, matchesRes] = await Promise.all([
          fetch(`/api/positions/${positionId}`),
          fetch("/api/simple-matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "position", id: positionId }),
          }),
        ]);

        const [positionData, matchesData] = await Promise.all([
          positionRes.json(),
          matchesRes.json(),
        ]);

        if (positionData.success && matchesData.success) {
          const currentMatch = resumeId
            ? matchesData.data.find(
              (m: MatchItem) =>
                m.resume?.id === resumeId || m.resume_id === resumeId,
            )
            : matchesData.data[0];

          setMatchData({
            sourceType: "position",
            sourceItem: positionData.data,
            matchItems: matchesData.data,
            currentMatch,
          });
        }
      } else if (actualSourceType === "resume" && resumeId) {
        // 从简历进入：获取简历信息和匹配的职位列表
        const [resumeRes, matchesRes] = await Promise.all([
          fetch(`/api/resumes/${resumeId}`),
          fetch("/api/simple-matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "resume", id: resumeId }),
          }),
        ]);

        const [resumeData, matchesData] = await Promise.all([
          resumeRes.json(),
          matchesRes.json(),
        ]);

        if (resumeData.success && matchesData.success) {
          const currentMatch = positionId
            ? matchesData.data.find(
              (m: MatchItem) =>
                m.positions?.id === positionId ||
                m.position_id === positionId,
            )
            : matchesData.data[0];

          setMatchData({
            sourceType: "resume",
            sourceItem: resumeData.data,
            matchItems: matchesData.data,
            currentMatch,
          });
        }
      } else if (resumeId && positionId) {
        // 兼容原有的直接匹配模式
        const [resumeRes, positionRes, matchRes] = await Promise.all([
          fetch(`/api/resumes/${resumeId}`),
          fetch(`/api/positions/${positionId}`),
          fetch("/api/simple-matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "match_detail",
              resume_id: resumeId,
              position_id: positionId,
            }),
          }),
        ]);

        const [resumeData, positionData, matchResult] = await Promise.all([
          resumeRes.json(),
          positionRes.json(),
          matchRes.json(),
        ]);

        if (resumeData.success && positionData.success && matchResult.success) {
          // 创建兼容的数据结构
          const matchItem: MatchItem = {
            resume_id: resumeId,
            position_id: positionId,
            tag_match_count: matchResult.data.tag_match_count,
            tag_match_ratio: matchResult.data.tag_match_ratio,
            education_match: matchResult.data.education_match,
            match_details: matchResult.data.match_details,
            created_at: matchResult.data.created_at,
            resume: resumeData.data,
            positions: positionData.data,
          };

          setMatchData({
            sourceType: "position", // 默认以职位为源
            sourceItem: positionData.data,
            matchItems: [matchItem],
            currentMatch: matchItem,
          });
        }
      }
    } catch (error) {
      console.error("获取匹配详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMatch = (matchId: string) => {
    if (!matchData) return;

    const selectedMatch = matchData.matchItems.find((m) =>
      matchData.sourceType === "position"
        ? m.resume?.id === matchId || m.resume_id === matchId
        : m.positions?.id === matchId || m.position_id === matchId,
    );

    if (selectedMatch) {
      setMatchData({
        ...matchData,
        currentMatch: selectedMatch,
      });

      // 更新URL参数以保持状态同步
      const newParams = new URLSearchParams(searchParams);

      if (matchData.sourceType === "position") {
        newParams.set(
          "resume_id",
          selectedMatch.resume?.id || selectedMatch.resume_id || "",
        );
      } else {
        newParams.set(
          "position_id",
          selectedMatch.positions?.id || selectedMatch.position_id || "",
        );
      }
      router.replace(`/match-detail?${newParams.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <div className="text-gray-800">加载匹配详情中...</div>
        </div>
      </div>
    );
  }

  if (!matchData || !matchData.currentMatch) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌</div>
          <div className="text-gray-800">无法加载匹配详情</div>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => router.back()}
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  const { sourceType, sourceItem, matchItems, currentMatch } = matchData;
  const resume = sourceType === "resume" ? sourceItem : currentMatch.resume;
  const position =
    sourceType === "position" ? sourceItem : currentMatch.positions;
  const matchInfo = currentMatch;
  const languages = normalizeLanguages(resume.languages);
  const educationLevels: string[] = normalizeArray(resume.education_levels);
  const educationList: any[] = normalizeArray(resume.education);
  const workExperienceList: any[] = normalizeArray(resume.work_experience);
  const projectsList: any[] = normalizeArray(resume.projects);
  const certificationsList: any[] = normalizeArray(resume.certifications);
  const universityLevels: string[] = normalizeArray(position.university_levels);
  const requiredSkills: string[] = normalizeArray(position.required_skills);

  return (
    <div className="fixed inset-0 pt-16 bg-white">
      <div className="h-full p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button
                color="primary"
                startContent={<span>←</span>}
                variant="light"
                onPress={() => router.back()}
              >
                返回匹配结果
              </Button>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                匹配详情对比
              </h1>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  标签匹配: {matchInfo.tag_match_count}个
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  匹配率: {(matchInfo.tag_match_ratio * 100).toFixed(1)}%
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${matchInfo.education_match
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                    }`}
                >
                  学历: {matchInfo.education_match ? "匹配" : "不匹配"}
                </span>
                {Array.isArray(position?.mandatory_keywords) && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      matchInfo.match_details?.tag_details?.mandatory_satisfied
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                    title={
                      matchInfo.match_details?.tag_details?.mandatory_satisfied
                        ? "已满足硬性关键字"
                        : `缺少: ${
                            (matchInfo.match_details?.tag_details?.missing_mandatory_keywords || [])
                              .join(', ')
                          }`
                    }
                  >
                    硬性关键字: {matchInfo.match_details?.tag_details?.mandatory_satisfied ? "满足" : "不满足"}
                  </span>
                )}
              </div>

              {/* 切换选择器 */}
              {matchItems.length > 1 && (
                <div className="max-w-md mx-auto">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {sourceType === "position"
                        ? "选择候选简历"
                        : "选择匹配职位"}
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={
                        sourceType === "position"
                          ? currentMatch.resume?.id || currentMatch.resume_id
                          : currentMatch.positions?.id || currentMatch.position_id
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSwitchMatch(e.target.value);
                        }
                      }}
                    >
                      {matchItems.map((item) => {
                        if (sourceType === "position") {
                          // 显示简历选项
                          const resumeData = item.resume;
                          const key = resumeData?.id || item.resume_id;
                          const label = `${resumeData?.full_name || "未知"} - 匹配率${(item.tag_match_ratio * 100).toFixed(1)}%`;

                          return (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          );
                        } else {
                          // 显示职位选项
                          const positionData = item.positions;
                          const key = positionData?.id || item.position_id;
                          const label = `${positionData?.position_name || "未知职位"} - ${positionData?.company_name || "未知公司"} - 匹配率${(item.tag_match_ratio * 100).toFixed(1)}%`;

                          return (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          );
                        }
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-800">
              {new Date(matchInfo.created_at).toLocaleDateString("zh-CN")}
            </div>
          </div>

          {/* 左右对比布局 */}
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* 左侧 - 简历信息 */}
            <Card className="h-fit">
              <CardHeader className="bg-white border-b">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      📄 候选人简历
                    </h2>
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">简历</span>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    👤 基本信息
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">
                      {resume.status || "已处理"}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">姓名</span>
                        <div className="font-medium text-lg text-gray-900">
                          {resume.full_name || "未知"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">工作经验</span>
                        <div className="font-medium text-lg text-gray-900">
                          {resume.years_experience || 0} 年
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">联系电话</span>
                        <div className="font-medium text-gray-900">
                          {resume.phone || "未提供"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">邮箱地址</span>
                        <div className="font-medium text-sm text-gray-900">
                          {resume.email || "未提供"}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">居住地址</span>
                      <div className="font-medium text-gray-900">
                        {resume.location || "未提供"}
                      </div>
                    </div>
                    {resume.headline && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <span className="text-sm text-gray-700">个人标题</span>
                        <div className="font-medium text-gray-900 text-sm">
                          {resume.headline}
                        </div>
                      </div>
                    )}
                    {resume.recommend_person && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <span className="text-sm text-gray-700">推荐人</span>
                        <div className="font-medium text-gray-900">
                          {resume.recommend_person}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 教育背景 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    🎓 教育背景
                    <span
                      className={`px-2 py-1 rounded text-sm ${matchInfo.education_match
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                        }`}
                    >
                      {matchInfo.education_match ? "匹配" : "不匹配"}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">最高学历</span>
                      <div className="font-medium text-lg text-gray-900">
                        {resume.highest_education_level || "未知"}
                      </div>
                    </div>
                    {educationLevels.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-700 block mb-2">
                            院校层次
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {educationLevels.map(
                              (level: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                >
                                  {level}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {educationList.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-700 block mb-2">
                          教育详情
                        </span>
                        <div className="space-y-3">
                          {educationList.map((edu: any, i: number) => (
                            <div key={i} className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                              <div className="text-sm text-gray-900 space-y-1">
                                {edu.school && (
                                  <div>
                                    <strong>学校:</strong> {edu.school}
                                  </div>
                                )}
                                {edu.degree && (
                                  <div>
                                    <strong>学位:</strong> {edu.degree}
                                  </div>
                                )}
                                {edu.field && (
                                  <div>
                                    <strong>专业:</strong> {edu.field}
                                  </div>
                                )}
                                {(edu.start_date || edu.end_date) && (
                                  <div>
                                    <strong>时间:</strong> {edu.start_date} - {edu.end_date}
                                  </div>
                                )}
                                {edu.gpa && (
                                  <div>
                                    <strong>GPA:</strong> {edu.gpa}
                                  </div>
                                )}
                                {edu.description && (
                                  <div className="mt-2 text-gray-700">
                                    {edu.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 技能标签 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    🏷️ 技能标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.tags?.map((tag: string, i: number) => {
                      const isMatched =
                        matchInfo.match_details?.tag_details?.matched_tags?.includes(
                          tag.toLowerCase(),
                        );

                      return (
                        <span
                          key={i}
                          className={`px-3 py-1 rounded-full text-sm border ${isMatched
                              ? "bg-green-100 text-green-800 border-green-300 font-medium"
                              : "bg-white text-gray-700 border-gray-300"
                            }`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 语言能力 */}
                {languages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🌍 语言能力
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {languages.map((lang: any, i: number) => (
                        <div key={i} className="p-3 bg-gray-100 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">
                              {lang.language || lang.name}
                            </span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">
                              {lang.proficiency || lang.level || "熟练"}
                            </span>
                          </div>
                          {lang.certificate && (
                            <div className="text-xs text-gray-600 mt-1">
                              证书: {lang.certificate}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 证书资质 */}
                {certificationsList.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🏆 证书资质
                    </h3>
                    <div className="space-y-3">
                      {certificationsList.map((cert: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-100 rounded-lg border border-gray-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {cert.name || cert.title}
                            </h4>
                            {cert.issued_date && (
                              <span className="text-sm text-gray-700">
                                {cert.issued_date}
                              </span>
                            )}
                          </div>
                          {cert.issuer && (
                            <div className="text-sm text-gray-700 mb-1">
                              颁发机构: {cert.issuer}
                            </div>
                          )}
                          {cert.credential_id && (
                            <div className="text-xs text-gray-600">
                              证书编号: {cert.credential_id}
                            </div>
                          )}
                          {cert.expiry_date && (
                            <div className="text-xs text-gray-600">
                              有效期至: {cert.expiry_date}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-500">
                    暂无证书
                  </div>
                )}


                {/* 技能详情 */}
                {Array.isArray(resume.skills) && resume.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      💻 技能详情
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill: string, i: number) => {
                          const isMatched = resume.tags?.includes(skill) ||
                            matchInfo.match_details?.tag_details?.matched_tags?.includes(skill.toLowerCase());

                          return (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-sm border ${isMatched
                                  ? "bg-green-100 text-green-800 border-green-300 font-medium"
                                  : "bg-white text-gray-700 border-gray-300"
                                }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 工作经历 */}
                {workExperienceList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      💼 工作经历
                    </h3>
                    <div className="space-y-3">
                      {workExperienceList.map((exp: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-100 rounded-lg border border-gray-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">
                              {exp.position || exp.title}
                            </h4>
                            <span className="text-sm text-gray-700">
                              {exp.start_date && exp.end_date
                                ? `${exp.start_date} - ${exp.end_date}`
                                : (exp.duration || exp.period)
                              }
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            {exp.company}
                          </div>
                          {exp.responsibilities && (
                            <div className="text-sm text-gray-800 mb-1">
                              <strong>工作职责:</strong> {exp.responsibilities}
                            </div>
                          )}
                          {exp.achievements && (
                            <div className="text-sm text-gray-800">
                              <strong>工作成果:</strong> {exp.achievements}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 项目经验 */}
                {projectsList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🚀 项目经验
                    </h3>
                    <div className="space-y-3">
                      {projectsList.map((project: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 bg-gray-100 rounded-lg border border-gray-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">
                              {project.name || project.title}
                            </h4>
                          </div>
                          {project.role && (
                            <div className="text-sm text-gray-700 mb-1">
                              角色: {project.role}
                            </div>
                          )}
                          {project.description && (
                            <p className="text-sm text-gray-800 mt-2">
                              {project.description}
                            </p>
                          )}
                          {project.tech_stack && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-700 mb-1">
                                技术栈:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(project.tech_stack) ? project.tech_stack : project.tech_stack.split(','))
                                  .map((tech: string, j: number) => (
                                    <span
                                      key={j}
                                      className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                    >
                                      {typeof tech === 'string' ? tech.trim() : tech}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                          {project.links && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-700 mb-1">
                                相关链接:
                              </div>
                              <div className="text-sm text-blue-600 underline">
                                {project.links}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 个人简介 */}
                {resume.summary && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      📝 个人简介
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {resume.summary}
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* 右侧 - 职位信息 */}
            <Card className="h-fit">
              <CardHeader className="bg-white border-b">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      💼 目标职位
                    </h2>
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">职位</span>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="space-y-6">
                {/* 职位基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    📋 职位信息
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {position.status || "active"}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">职位名称</span>
                      <div className="font-medium text-xl text-gray-900">
                        {position.position_name}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">公司名称</span>
                        <div className="font-medium text-gray-900">
                          {position.company_name || "未知公司"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">工作地点</span>
                        <div className="font-medium text-gray-900">
                          {position.location || "未指定"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">薪资范围</span>
                        <div className="font-medium text-gray-900">
                          {position.salary_range || "面议"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">招聘人数</span>
                        <div className="font-medium text-gray-900">
                          {position.hc || "不限"} 人
                        </div>
                      </div>
                    </div>
                    {(position.level || position.urgency) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">职级</span>
                          <div className="font-medium text-gray-900">
                            {position.level || "未指定"}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">
                            紧急程度
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-sm ${position.urgency === "urgent"
                                ? "bg-red-100 text-red-800"
                                : position.urgency === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                          >
                            {position.urgency === "urgent"
                              ? "紧急"
                              : position.urgency === "high"
                                ? "较急"
                                : "普通"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 教育要求 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    🎓 教育要求
                    <span
                      className={`px-2 py-1 rounded text-sm ${matchInfo.education_match
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                        }`}
                    >
                      {matchInfo.education_match ? "满足" : "不满足"}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">
                        最低学历要求
                      </span>
                      <div className="font-medium text-lg text-gray-900">
                        {position.min_education_level || "不限"}
                      </div>
                    </div>
                {universityLevels.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-700 block mb-2">
                            院校要求
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {universityLevels.map(
                              (level: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                >
                                  {level}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {position.experience_requirements &&
                      Object.keys(position.experience_requirements).length >
                      0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 block mb-2">
                            经验要求
                          </span>
                          <div className="text-sm text-gray-900">
                            {JSON.stringify(
                              position.experience_requirements,
                              null,
                              2,
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* 技能要求 */}
<div>
  <h3 className="text-lg font-semibold mb-3 text-gray-900">
    🏷️ 技能要求
  </h3>
  {Array.isArray(position.tags) && position.tags.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {position.tags.map((tag: string, i: number) => {
        const isMatched =
          matchInfo.match_details?.tag_details?.matched_tags?.includes(
            tag.toLowerCase()
          );
        return (
          <span
            key={i}
            className={`px-3 py-1 rounded-full text-sm border ${
              isMatched
                ? "bg-green-100 text-green-800 border-green-300 font-medium"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  ) : (
    <div className="p-4 bg-gray-50 rounded-lg text-gray-500">
      暂无技能标签
    </div>
  )}
</div>


                {/* 技能要求详情 */}
                {requiredSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🛠️ 技能要求详情
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.map((skill: string, i: number) => {
                          const isMatched = resume.tags?.includes(skill) ||
                            resume.skills?.includes(skill) ||
                            matchInfo.match_details?.tag_details?.matched_tags?.includes(skill.toLowerCase());

                          return (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-sm border ${isMatched
                                  ? "bg-green-100 text-green-800 border-green-300 font-medium"
                                  : "bg-orange-100 text-orange-800 border-orange-300"
                                }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 公司信息 */}
                {(position.company_info || position.company_description) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🏢 公司信息
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {position.company_name}
                          </span>
                          {position.company_scale && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">
                              {position.company_scale}
                            </span>
                          )}
                        </div>
                        {(position.company_info || position.company_description) && (
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {position.company_info || position.company_description}
                          </p>
                        )}
                        {position.industry && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">行业:</span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">
                              {position.industry}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 福利待遇 */}
                {(position.benefits || position.welfare) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      🎁 福利待遇
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="text-sm text-gray-800 leading-relaxed">
                        {position.benefits || position.welfare}
                      </div>
                    </div>
                  </div>
                )}

                {/* 职位描述 */}
                {position.job_description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      📝 职位描述
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                      <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {position.job_description}
                      </div>
                    </div>
                  </div>
                )}

                {/* 任职要求 */}
                {position.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      ✅ 任职要求
                    </h3>
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 max-h-48 overflow-y-auto">
                      <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {position.requirements}
                      </div>
                    </div>
                  </div>
                )}

                {/* 联系信息 */}
                {(position.contact_person || position.contact_email || position.contact_phone) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      📞 联系信息
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {position.contact_person && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">联系人</span>
                          <div className="font-medium text-gray-900">
                            {position.contact_person}
                          </div>
                        </div>
                      )}
                      {position.contact_email && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">邮箱</span>
                          <div className="font-medium text-gray-900 text-sm">
                            {position.contact_email}
                          </div>
                        </div>
                      )}
                      {position.contact_phone && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">电话</span>
                          <div className="font-medium text-gray-900">
                            {position.contact_phone}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 其他信息 */}
                {(position.work_hours || position.work_type || position.work_mode) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      ⚙️ 其他信息
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {position.work_hours && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">工作时间</span>
                          <div className="font-medium text-gray-900">
                            {position.work_hours}
                          </div>
                        </div>
                      )}
                      {position.work_type && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">工作类型</span>
                          <div className="font-medium text-gray-900">
                            {position.work_type}
                          </div>
                        </div>
                      )}
                      {position.work_mode && (
                        <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                          <span className="text-sm text-gray-700">工作模式</span>
                          <div className="font-medium text-gray-900">
                            {position.work_mode}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 底部匹配分析 */}
          <Card className="mt-6">
            <CardHeader className="bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                🔍 详细匹配分析
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* 匹配得分卡片 */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      {matchInfo.tag_match_count}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      标签匹配数量
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      共有 {matchInfo.tag_match_count} 个相同技能标签
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      {(matchInfo.tag_match_ratio * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      标签匹配率
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${matchInfo.tag_match_ratio * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      职位要求的技能匹配程度
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                    <div
                      className={`text-4xl font-bold mb-2 ${matchInfo.education_match ? "text-gray-800" : "text-gray-600"}`}
                    >
                      {matchInfo.education_match ? "✓" : "✗"}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      学历匹配
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {matchInfo.education_match
                        ? "学历和院校要求满足"
                        : "学历或院校要求不满足"}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* 技能标签对比 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      🎯 匹配的技能标签
                      {matchInfo.match_details?.tag_details?.matched_tags && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {
                            matchInfo.match_details.tag_details.matched_tags
                              .length
                          }
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matchInfo.match_details?.tag_details?.matched_tags?.map(
                        (tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ),
                      ) || (
                          <div className="text-sm text-gray-900">
                            暂无匹配的技能标签
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      🚫 不匹配的标签
                      {matchInfo.match_details?.tag_details
                        ?.unmatched_position_tags && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                            {
                              matchInfo.match_details.tag_details
                                .unmatched_position_tags.length
                            }
                          </span>
                        )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matchInfo.match_details?.tag_details?.unmatched_position_tags?.map(
                        (tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm border border-orange-300"
                          >
                            {tag}
                          </span>
                        ),
                      ) || (
                          <div className="text-sm text-gray-900">
                            候选人技能覆盖良好
                          </div>
                        )}
                    </div>
                    {Array.isArray(position?.mandatory_keywords) &&
                      matchInfo.match_details?.tag_details &&
                      matchInfo.match_details.tag_details.mandatory_satisfied === false && (
                        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                          缺少硬性关键字：
                          <span className="font-medium">
                            {(matchInfo.match_details.tag_details.missing_mandatory_keywords || []).join(
                              ", "
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* 关键信息对比 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      📊 候选人亮点
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm text-gray-700">工作经验</span>
                        <span className="font-medium text-green-800">
                          {resume.years_experience || 0} 年
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">最高学历</span>
                        <span className="font-medium text-blue-800">
                          {resume.highest_education_level || "未知"}
                        </span>
                      </div>
                      {certificationsList.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                          <span className="text-sm text-gray-700">证书数量</span>
                          <span className="font-medium text-yellow-800">
                            {certificationsList.length} 个
                          </span>
                        </div>
                      )}
                      {languages.length > 0 && (
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <span className="text-sm text-gray-700">语言能力</span>
                          <span className="font-medium text-purple-800">
                            {languages.length} 种语言
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      🏆 职位要求
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">最低学历</span>
                        <span className="font-medium text-gray-800">
                          {position.min_education_level || "不限"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">薪资范围</span>
                        <span className="font-medium text-gray-800">
                          {position.salary_range || "面议"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">工作地点</span>
                        <span className="font-medium text-gray-800">
                          {position.location || "未指定"}
                        </span>
                      </div>
                      {position.urgency && (
                        <div className="flex items-center justify-between p-2 bg-gray-100 rounded border border-gray-300">
                          <span className="text-sm text-gray-700">紧急程度</span>
                          <span
                            className={`px-2 py-1 rounded text-sm ${position.urgency === "urgent"
                                ? "bg-red-100 text-red-800"
                                : position.urgency === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                          >
                            {position.urgency === "urgent"
                              ? "索急"
                              : position.urgency === "high"
                                ? "较急"
                                : "普通"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* 综合匹配建议 */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    💡 匹配建议与分析
                  </h4>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-900">
                      {matchInfo.tag_match_ratio >= 0.8 ? (
                        <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                          <p className="font-medium text-green-800 mb-2">
                            🌟 强烈推荐 - 高度匹配候选人
                          </p>
                          <p className="text-green-700">
                            技能匹配度达到 <strong>{(matchInfo.tag_match_ratio * 100).toFixed(1)}%</strong>，
                            {matchInfo.education_match
                              ? "学历要求也完全符合。强烈建议立即安排面试。"
                              : "但需要注意学历要求不匹配，可考虑经验补偿。"}
                          </p>
                        </div>
                      ) : matchInfo.tag_match_ratio >= 0.5 ? (
                        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <p className="font-medium text-yellow-800 mb-2">
                            👍 推荐 - 有潜力的候选人
                          </p>
                          <p className="text-yellow-700">
                            技能匹配度为 <strong>{(matchInfo.tag_match_ratio * 100).toFixed(1)}%</strong>，
                            具备一定基础。建议通过面试深入了解其能力和经验。
                          </p>
                        </div>
                      ) : matchInfo.tag_match_ratio >= 0.3 ? (
                        <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                          <p className="font-medium text-orange-800 mb-2">
                            🤔 谨慎考虑 - 需要进一步评估
                          </p>
                          <p className="text-orange-700">
                            技能匹配度较低（<strong>{(matchInfo.tag_match_ratio * 100).toFixed(1)}%</strong>），
                            建议评估候选人的学习能力和成长潜力。
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                          <p className="font-medium text-red-800 mb-2">
                            ❌ 不推荐 - 匹配度过低
                          </p>
                          <p className="text-red-700">
                            技能匹配度仅为 <strong>{(matchInfo.tag_match_ratio * 100).toFixed(1)}%</strong>，
                            与职位要求差距较大，不建议继续推进。
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 面试建议 */}
                    <div className="p-3 bg-white rounded-lg border">
                      <p className="font-medium text-gray-900 mb-2">
                        📝 面试关注点：
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1 ml-4">
                        {matchInfo.match_details?.tag_details?.matched_tags?.length > 0 && (
                          <li>• 重点考查已匹配技能的实际应用经验</li>
                        )}
                        {matchInfo.match_details?.tag_details?.unmatched_position_tags?.length > 0 && (
                          <li>• 了解对未匹配技能的学习意愿和能力</li>
                        )}
                        <li>• 评估候选人的沟通能力和团队协作精神</li>
                        {resume.years_experience > 0 && (
                          <li>• 深入了解其工作经验中的项目成果</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
