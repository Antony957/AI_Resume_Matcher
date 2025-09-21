"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

import {
  ResumeProfile,
  Education,
  WorkExperience,
  Project,
  Language,
} from "@/types";

interface ResumeDetailModalProps {
  resume: ResumeProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeDetailModal({
  resume,
  isOpen,
  onClose,
}: ResumeDetailModalProps) {
  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate) return "时间不详";
    if (!endDate || endDate.includes("至今") || endDate.includes("现在")) {
      return `${startDate} 至今`;
    }

    return `${startDate} - ${endDate}`;
  };

  const renderEducation = () => {
    if (!resume.education || resume.education.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🎓 教育背景
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {resume.education.map((edu: Education, index) => (
              <div key={index} className="border-l-3 border-primary-200 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {edu.school || "未知学校"}
                    </h4>
                    <p className="text-gray-600">
                      {edu.degree} {edu.field && `• ${edu.field}`}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDateRange(edu.start_date, edu.end_date)}
                  </span>
                </div>
                {edu.gpa && (
                  <p className="text-sm text-gray-600 mb-2">GPA: {edu.gpa}</p>
                )}
                {edu.description && (
                  <p className="text-sm text-gray-700">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderWorkExperience = () => {
    if (!resume.work_experience || resume.work_experience.length === 0)
      return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            💼 工作经历
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {resume.work_experience.map((work: WorkExperience, index) => (
              <div key={index} className="border-l-3 border-success-200 pl-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {work.position || "未知职位"}
                    </h4>
                    <p className="text-gray-600 font-medium">
                      {work.company || "未知公司"}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDateRange(work.start_date, work.end_date)}
                  </span>
                </div>

                {work.responsibilities && work.responsibilities.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-2">
                      主要职责:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {work.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {work.achievements && work.achievements.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      主要成就:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {work.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-success-700">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderProjects = () => {
    if (!resume.projects || resume.projects.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🚀 项目经历
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {resume.projects.map((project: Project, index) => (
              <div key={index} className="border-l-3 border-warning-200 pl-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {project.name || "未知项目"}
                    </h4>
                    <p className="text-gray-600">
                      {project.role || "项目成员"}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDateRange(project.start_date, project.end_date)}
                  </span>
                </div>

                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-2">技术栈:</h5>
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.description && project.description.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-2">
                      项目描述:
                    </h5>
                    <div className="space-y-1 text-sm text-gray-600">
                      {project.description.map((desc, idx) => (
                        <p key={idx}>{desc}</p>
                      ))}
                    </div>
                  </div>
                )}

                {project.link && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      项目链接:
                    </h5>
                    <a
                      className="text-primary hover:underline text-sm"
                      href={project.link}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {project.link}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderSkills = () => {
    if (!resume.skills || resume.skills.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🛠️ 技能列表
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderLanguages = () => {
    if (!resume.languages || resume.languages.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🌍 语言能力
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resume.languages.map((lang: Language, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{lang.language}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {lang.proficiency}
                  </div>
                  {lang.certificate && (
                    <div className="text-xs text-gray-500">
                      {lang.certificate}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderCertifications = () => {
    if (!resume.certifications || resume.certifications.length === 0)
      return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🏆 证书认证
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {resume.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{cert.name}</h4>
                  {cert.credential_id && (
                    <p className="text-sm text-gray-600">
                      证书编号: {cert.credential_id}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>签发: {cert.issued_date || "未知"}</div>
                  {cert.expiry_date && <div>到期: {cert.expiry_date}</div>}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {(resume.full_name || "未知").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {resume.full_name || "未命名"}
              </h2>
              {resume.headline && (
                <p className="text-gray-600">{resume.headline}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {resume.email && (
              <span className="flex items-center gap-1">📧 {resume.email}</span>
            )}
            {resume.phone && (
              <span className="flex items-center gap-1">📱 {resume.phone}</span>
            )}
            {resume.location && (
              <span className="flex items-center gap-1">
                📍 {resume.location}
              </span>
            )}
            {resume.years_experience && (
              <span className="flex items-center gap-1">
                💼 {resume.years_experience}年经验
              </span>
            )}
          </div>
        </ModalHeader>

        <ModalBody>
          {/* 个人简介 */}
          {resume.summary && (
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📝 个人简介
                </h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {resume.summary}
                </p>
              </CardBody>
            </Card>
          )}

          {renderEducation()}
          {renderWorkExperience()}
          {renderProjects()}
          {renderSkills()}
          {renderLanguages()}
          {renderCertifications()}

          {/* 其他信息 */}
          {resume.extra_sections &&
            Object.keys(resume.extra_sections).length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    📄 其他信息
                  </h3>
                </CardHeader>
                <CardBody>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(resume.extra_sections, null, 2)}
                  </pre>
                </CardBody>
              </Card>
            )}
        </ModalBody>

        <ModalFooter>
          <Button color="primary" variant="light" onPress={onClose}>
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
