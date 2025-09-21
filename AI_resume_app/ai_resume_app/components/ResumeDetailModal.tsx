import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

import { ResumeProfile } from "@/types";

interface ResumeDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string | null;
}

const ResumeDetailModal: React.FC<ResumeDetailModalProps> = ({
  isOpen,
  onOpenChange,
  resumeId,
}) => {
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取简历详情
  const fetchResumeDetail = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resume/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch resume details");
      }

      const data = await response.json();

      setResume(data.data);
    } catch (err) {
      console.error("Error fetching resume details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch resume details",
      );
    } finally {
      setLoading(false);
    }
  };

  // 当模态框打开且有简历ID时获取详情
  useEffect(() => {
    if (isOpen && resumeId) {
      fetchResumeDetail(resumeId);
    } else {
      setResume(null);
      setError(null);
    }
  }, [isOpen, resumeId]);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "暂无";
    try {
      return new Date(dateString).toLocaleDateString("zh-CN");
    } catch {
      return dateString;
    }
  };

  // 渲染教育经历
  const renderEducation = (education: any[]) => {
    if (!education || education.length === 0)
      return <div className="text-gray-500">暂无教育经历</div>;

    return education.map((edu, index) => (
      <div
        key={index}
        className="border-b border-gray-200 pb-3 mb-3 last:border-b-0"
      >
        <div className="font-bold text-lg text-gray-800">
          {edu.school || "未知院校"}
        </div>
        <div className="text-gray-600 mt-1">
          {edu.degree || "未知学位"} - {edu.field || "专业未知"}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
        </div>
        {edu.gpa && <div className="text-sm text-gray-500">GPA: {edu.gpa}</div>}
        {edu.description && (
          <div className="text-sm text-gray-600 mt-2">{edu.description}</div>
        )}
      </div>
    ));
  };

  // 渲染工作经历
  const renderWorkExperience = (workExperience: any[]) => {
    if (!workExperience || workExperience.length === 0)
      return <div className="text-gray-500">暂无工作经历</div>;

    return workExperience.map((work, index) => (
      <div
        key={index}
        className="border-b border-gray-200 pb-3 mb-3 last:border-b-0"
      >
        <div className="font-bold text-lg text-gray-800">
          {work.company || "未知公司"}
        </div>
        <div className="text-gray-600 mt-1">{work.position || "未知职位"}</div>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(work.start_date)} - {formatDate(work.end_date)}
        </div>
        {work.responsibilities && work.responsibilities.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700">工作职责：</div>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              {work.responsibilities.map((resp: string, idx: number) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
          </div>
        )}
        {work.achievements && work.achievements.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700">主要成就：</div>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              {work.achievements.map((achievement: string, idx: number) => (
                <li key={idx}>{achievement}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
  };

  // 渲染项目经历
  const renderProjects = (projects: any[]) => {
    if (!projects || projects.length === 0)
      return <div className="text-gray-500">暂无项目经历</div>;

    return projects.map((project, index) => (
      <div
        key={index}
        className="border-b border-gray-200 pb-3 mb-3 last:border-b-0"
      >
        <div className="font-bold text-lg text-gray-800">
          {project.name || "未知项目"}
        </div>
        <div className="text-gray-600 mt-1">{project.role || "未知角色"}</div>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(project.start_date)} - {formatDate(project.end_date)}
        </div>
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700">技术栈：</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {project.tech_stack.map((tech: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
        {project.description && (
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700">项目描述：</div>
            <div className="text-sm text-gray-600 mt-1">
              {Array.isArray(project.description)
                ? project.description.join("; ")
                : project.description}
            </div>
          </div>
        )}
        {project.link && (
          <div className="mt-2">
            <a
              className="text-blue-600 hover:text-blue-800 text-sm"
              href={project.link}
              rel="noopener noreferrer"
              target="_blank"
            >
              查看项目链接
            </a>
          </div>
        )}
      </div>
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">简历详情</h2>
          {resume && (
            <div className="text-sm text-gray-500">
              {resume.full_name} - {resume.headline || "暂无职位标题"}
            </div>
          )}
        </ModalHeader>

        <ModalBody>
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
              <span className="ml-2 text-gray-600">正在加载简历详情...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700">
                <strong>加载失败：</strong> {error}
              </div>
              <Button
                className="mt-2"
                color="danger"
                size="sm"
                onPress={() => resumeId && fetchResumeDetail(resumeId)}
              >
                重试
              </Button>
            </div>
          )}

          {resume && !loading && !error && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-blue-800">
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">姓名：</span>
                    <span className="text-gray-900">{resume.full_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">邮箱：</span>
                    <span className="text-gray-900">
                      {resume.email || "暂无"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">电话：</span>
                    <span className="text-gray-900">
                      {resume.phone || "暂无"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">地址：</span>
                    <span className="text-gray-900">
                      {resume.location || "暂无"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      工作年限：
                    </span>
                    <span className="text-gray-900">
                      {resume.years_experience || 0} 年
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      推荐人：
                    </span>
                    <span className="text-gray-900">
                      {resume.recommend_person || "暂无"}
                    </span>
                  </div>
                </div>
                {resume.summary && (
                  <div className="mt-4">
                    <span className="font-semibold text-gray-700">
                      个人简介：
                    </span>
                    <p className="mt-1 text-gray-900 leading-relaxed">
                      {resume.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* 技能标签 */}
              {resume.tags && resume.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    技能标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 技能列表 */}
              {resume.skills && resume.skills.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    专业技能
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 教育经历 */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  教育经历
                </h3>
                {renderEducation(resume.education || [])}
              </div>

              {/* 工作经历 */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  工作经历
                </h3>
                {renderWorkExperience(resume.work_experience || [])}
              </div>

              {/* 项目经历 */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  项目经历
                </h3>
                {renderProjects(resume.projects || [])}
              </div>

              {/* 语言能力 */}
              {resume.languages && resume.languages.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    语言能力
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {resume.languages.map((lang: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 p-3 rounded"
                      >
                        <div className="font-medium">
                          {lang.language || "未知语言"}
                        </div>
                        <div className="text-sm text-gray-600">
                          熟练度：{lang.proficiency || "未知"}
                        </div>
                        {lang.certificate && (
                          <div className="text-sm text-gray-600">
                            证书：{lang.certificate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 证书认证 */}
              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    证书认证
                  </h3>
                  <div className="space-y-3">
                    {resume.certifications.map((cert: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 p-3 rounded"
                      >
                        <div className="font-medium">
                          {cert.name || "未知证书"}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          发证机构：{cert.issued_date || "未知"}
                        </div>
                        <div className="text-sm text-gray-600">
                          发证日期：{formatDate(cert.issued_date)}
                        </div>
                        {cert.expiry_date && (
                          <div className="text-sm text-gray-600">
                            到期日期：{formatDate(cert.expiry_date)}
                          </div>
                        )}
                        {cert.credential_id && (
                          <div className="text-sm text-gray-600">
                            证书编号：{cert.credential_id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="default"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ResumeDetailModal;
