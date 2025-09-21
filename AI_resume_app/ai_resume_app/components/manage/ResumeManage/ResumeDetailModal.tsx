import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";

import EducationalExperience from "./terms/EducationalExperience";

import { ResumeProfile } from "@/types";
import ProjectExperience from "@/components/manage/ResumeManage/terms/ProjectExperience";
import Language from "@/components/manage/ResumeManage/terms/Language";
import Certification from "@/components/manage/ResumeManage/terms/Certification";
import { supabase } from "@/config/supabaseClient";
interface ResumeDetailModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedResume: ResumeProfile | null;
  onResumeDeleted: () => void;
}

const ResumeDetailModal: React.FC<ResumeDetailModalProps> = ({
  isOpen,
  onOpenChange,
  selectedResume,
  onResumeDeleted,
}) => {
  const deleteResume = (id: string | undefined) => async () => {
    if (!id) {
      addToast({
        title: "error",
        description: "id不能为空！",
        color: "danger",
      });

      return;
    }

    const isConfirmed = window.confirm("确认要删除这份简历吗？");

    if (!isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase.from("resume").delete().eq("id", id);

      if (error) {
        addToast({
          title: "error",
          description: "删除简历失败，请重试",
          color: "danger",
        });
      } else {
        addToast({
          title: "success",
          description: "删除简历成功",
          color: "success",
        });
        onResumeDeleted(); // 删除成功后调用回调函数，通知父组件更新页面
        onOpenChange(); // 关闭模态框
      }
    } catch (error) {
      addToast({
        title: "error",
        description: "删除简历失败，请重试",
        color: "danger",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader>简历详情</ModalHeader>
        <ModalBody>
          {selectedResume && (
            <div className="space-y-3 text-base">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <b>姓名：</b>
                  {selectedResume.full_name || "-"}
                </div>
                <div>
                  <b>邮箱：</b>
                  {selectedResume.email || "-"}
                </div>
                <div>
                  <b>电话：</b>
                  {selectedResume.phone || "-"}
                </div>
                <div>
                  <b>地区：</b>
                  {selectedResume.location || "-"}
                </div>
                <div>
                  <b>头衔：</b>
                  {selectedResume.headline || "-"}
                </div>
                <div>
                  <b>工龄：</b>
                  {selectedResume.years_experience ?? "-"}
                </div>
                <div>
                  <b>创建时间：</b>
                  {selectedResume.created_at || "-"}
                </div>
                <div>
                  <b>更新时间：</b>
                  {selectedResume.updated_at || "-"}
                </div>
                <div>
                  <b>状态：</b>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      selectedResume.status === "matched"
                        ? "bg-green-100 text-green-800"
                        : selectedResume.status === "tagged"
                          ? "bg-blue-100 text-blue-800"
                          : selectedResume.status === "processed"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedResume.status === "matched"
                      ? "已匹配"
                      : selectedResume.status === "tagged"
                        ? "已标记"
                        : selectedResume.status === "processed"
                          ? "已处理"
                          : "初始化"}
                  </span>
                </div>
                <div>
                  <b>归属人：</b>
                  {selectedResume.recommend_person || "-"}
                </div>
              </div>
              <div>
                <b>标签：</b>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedResume.tags && selectedResume.tags.length > 0 ? (
                    selectedResume.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">暂无标签</span>
                  )}
                </div>
              </div>
              <div>
                <b>简介：</b>
                {selectedResume.summary || "-"}
              </div>
              <div>
                <b>教育经历：</b>
                {typeof selectedResume.education !== "string" ? (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {selectedResume.education.map((education, _index) => (
                      <EducationalExperience key={_index} {...education} />
                    ))}
                  </div>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                    {selectedResume.education
                      ? JSON.stringify(selectedResume.education, null, 2)
                      : "-"}
                  </pre>
                )}
              </div>
              <div>
                <b>工作经历：</b>
                {typeof selectedResume.work_experience !== "string" ? (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {/*{selectedResume.work_experience.map((work, _index) => (*/}
                    {/*  <WorkExperience key={_index} {...work} />*/}
                    {/*))}*/}
                  </div>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                    {selectedResume.work_experience
                      ? JSON.stringify(selectedResume.work_experience, null, 2)
                      : "-"}
                  </pre>
                )}
              </div>
              <div>
                <b>项目经历：</b>
                {typeof selectedResume.projects !== "string" ? (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {selectedResume.projects.map((project, _index) => (
                      <ProjectExperience key={_index} {...project} />
                    ))}
                  </div>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                    {selectedResume.projects
                      ? JSON.stringify(selectedResume.projects, null, 2)
                      : "-"}
                  </pre>
                )}
              </div>
              <div>
                <b>技能：</b>
                <span>
                  {selectedResume.skills
                    ? selectedResume.skills.join("，")
                    : "-"}
                </span>
              </div>
              <div>
                <b>证书：</b>
                {typeof selectedResume.certifications !== "string" ? (
                  <div className={"grid grid-cols-3 gap-4 mt-4"}>
                    {selectedResume.certifications.map(
                      (certification, _index) => (
                        <Certification key={_index} {...certification} />
                      ),
                    )}
                  </div>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                    {selectedResume.certifications
                      ? JSON.stringify(selectedResume.certifications, null, 2)
                      : "-"}
                  </pre>
                )}
              </div>
              <div>
                <b>语言：</b>
                {typeof selectedResume.languages !== "string" ? (
                  <div className="grid grid-cols-9 gap-4 mt-4">
                    {selectedResume.languages.map((language, _index) => (
                      <Language key={_index} {...language} />
                    ))}
                  </div>
                ) : (
                  <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                    {selectedResume.languages
                      ? JSON.stringify(selectedResume.languages, null, 2)
                      : "-"}
                  </pre>
                )}
              </div>
              <div>
                <b>附加信息：</b>
                <pre className="bg-gray-100 rounded p-2 text-sm whitespace-pre-wrap">
                  {selectedResume.extra_sections
                    ? JSON.stringify(selectedResume.extra_sections, null, 2)
                    : "-"}
                </pre>
              </div>
              {/*<div>*/}
              {/*  <b>原始JSON：</b>*/}
              {/*  <pre className="bg-gray-100 rounded p-2 text-xs whitespace-pre-wrap">*/}
              {/*    {selectedResume.raw_json*/}
              {/*      ? JSON.stringify(selectedResume.raw_json, null, 2)*/}
              {/*      : "-"}*/}
              {/*  </pre>*/}
              {/*</div>*/}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onPress={deleteResume(selectedResume?.id)}>
            删除
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ResumeDetailModal;
