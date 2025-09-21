import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import TagChipsInput from "@/components/TagChipsInput";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";

import { Position } from "@/types";

interface PositionModifyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedPosition: Position | null;
  onPositionUpdated?: () => void;
}

const PositionModifyModal: React.FC<PositionModifyModalProps> = ({
  isOpen,
  selectedPosition,
  onOpenChange,
  onPositionUpdated,
}) => {
  const [formData, setFormData] = useState({
    position_name: "",
    company_name: "",
    location: "",
    hc: "",
    salary_range: "",
    job_description: "",
    requirements: "",
    racetrack: "",
    adviser: "",
    level: "",
    intern_available: false,
    reference: "",
    status: "active" as "active" | "paused" | "closed" | "filled",
    urgency: "normal" as "low" | "normal" | "high" | "urgent",
    // 新增：硬性关键字（编辑态使用文本，逗号/分号分隔）
    mandatory_keywords_text: "",
    // 新增：命中逻辑
    mandatory_logic: "all" as const,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (!selectedPosition) return;

    setFormData({
      position_name: selectedPosition.position_name || "",
      company_name: selectedPosition.company_name || "",
      location: selectedPosition.location || "",
      hc: selectedPosition.hc?.toString() || "",
      salary_range: selectedPosition.salary_range || "",
      job_description: selectedPosition.job_description || "",
      requirements: selectedPosition.requirements || "",
      racetrack: selectedPosition.racetrack || "",
      adviser: selectedPosition.adviser || "",
      level: selectedPosition.level || "",
      intern_available: selectedPosition.intern_available || false,
      reference: selectedPosition.reference || "",
      status: selectedPosition.status || "active",
      urgency: selectedPosition.urgency || "normal",
      mandatory_keywords_text: Array.isArray((selectedPosition as any).mandatory_keywords)
        ? ((selectedPosition as any).mandatory_keywords as string[]).join(", ")
        : "",
      mandatory_logic: ((selectedPosition as any).mandatory_logic as any) || "all",
    });
  }, [selectedPosition]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !selectedPosition ||
      !formData.position_name ||
      !formData.job_description
    ) {
      addToast({
        title: "提交失败",
        description: "职位名称和职位描述为必填项",
        color: "danger",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        id: selectedPosition.id,
        ...formData,
        hc: formData.hc ? parseInt(formData.hc) : null,
        // 提交规范化后的硬性关键字数组
        mandatory_keywords: (formData.mandatory_keywords_text || "")
          .replaceAll("；", ",")
          .replaceAll("，", ",")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0),
        mandatory_logic: formData.mandatory_logic,
      };

      const response = await fetch("/api/positions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "更新职位失败");
      }

      addToast({
        title: "修改成功",
        description: `职位「${formData.position_name}」已成功更新`,
        color: "success",
      });

      onOpenChange(false);
      onPositionUpdated?.();
    } catch (error) {
      addToast({
        title: "修改失败",
        description: error instanceof Error ? error.message : "更新职位失败",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition) return;

    if (
      !confirm(
        `确定要删除职位「${selectedPosition.position_name}」吗？此操作不可撤销。`,
      )
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/positions?id=${selectedPosition.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "删除职位失败");
      }

      addToast({
        title: "删除成功",
        description: `职位「${selectedPosition.position_name}」已成功删除`,
        color: "success",
      });

      onOpenChange(false);
      onPositionUpdated?.();
    } catch (error) {
      addToast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除职位失败",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
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
        <ModalHeader>职位修改</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="职位名称"
                placeholder="请输入职位名称"
                value={formData.position_name}
                onValueChange={(value) =>
                  handleInputChange("position_name", value)
                }
              />
              <Input
                label="公司名称"
                placeholder="请输入公司名称"
                value={formData.company_name}
                onValueChange={(value) =>
                  handleInputChange("company_name", value)
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="工作地点"
                placeholder="请输入工作地点"
                value={formData.location}
                onValueChange={(value) => handleInputChange("location", value)}
              />
              <Input
                label="招聘人数"
                placeholder="请输入招聘人数"
                type="number"
                value={formData.hc}
                onValueChange={(value) => handleInputChange("hc", value)}
              />
              <Input
                label="薪资范围"
                placeholder="请输入薪资范围"
                value={formData.salary_range}
                onValueChange={(value) =>
                  handleInputChange("salary_range", value)
                }
              />
            </div>

            <Textarea
              isRequired
              label="职位描述"
              placeholder="请输入详细的职位描述"
              value={formData.job_description}
              onValueChange={(value) =>
                handleInputChange("job_description", value)
              }
            />

            <Textarea
              label="职位要求"
              placeholder="请输入职位要求"
              value={formData.requirements}
              onValueChange={(value) =>
                handleInputChange("requirements", value)
              }
            />

            {/* 硬性关键字输入区 */}
            <div className="space-y-2">
              <TagChipsInput
                label="硬性关键字"
                placeholder="输入后回车添加，或选择下方建议；可直接创建新标签"
                value={(formData.mandatory_keywords_text || "")
                  .replaceAll("；", ",")
                  .replaceAll("，", ",")
                  .split(",")
                  .map((s) => s.trim().toLowerCase())
                  .filter((s) => s.length > 0)}
                onChange={(arr) =>
                  handleInputChange("mandatory_keywords_text", arr.join(", "))
              }
                createApiPath="/api/position-keywords"
              />
              <Select
                label="命中逻辑"
                selectedKeys={[formData.mandatory_logic]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange("mandatory_logic", selected);
                }}
              >
                <SelectItem key="all">必须全部命中（严格）</SelectItem>
                <SelectItem key="any">命中任意一个即可（宽松）</SelectItem>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="赛道"
                placeholder="请输入赛道"
                value={formData.racetrack}
                onValueChange={(value) => handleInputChange("racetrack", value)}
              />
              <Input
                label="顾问"
                placeholder="请输入顾问"
                value={formData.adviser}
                onValueChange={(value) => handleInputChange("adviser", value)}
              />
              <Input
                label="职级"
                placeholder="请输入职级"
                value={formData.level}
                onValueChange={(value) => handleInputChange("level", value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="职位状态"
                selectedKeys={[formData.status]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  handleInputChange("status", selected);
                }}
              >
                <SelectItem key="active">
                  激活
                </SelectItem>
                <SelectItem key="paused">
                  暂停
                </SelectItem>
                <SelectItem key="closed">
                  关闭
                </SelectItem>
                <SelectItem key="filled">
                  已满
                </SelectItem>
              </Select>

              <Select
                label="紧急程度"
                selectedKeys={[formData.urgency]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  handleInputChange("urgency", selected);
                }}
              >
                <SelectItem key="low">
                  低
                </SelectItem>
                <SelectItem key="normal">
                  普通
                </SelectItem>
                <SelectItem key="high">
                  高
                </SelectItem>
                <SelectItem key="urgent">
                  紧急
                </SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                isSelected={formData.intern_available}
                onValueChange={(value) =>
                  handleInputChange("intern_available", value)
                }
              />
              <span>接受实习生</span>
            </div>

            <Input
              label="参考信息"
              placeholder="请输入参考信息"
              value={formData.reference}
              onValueChange={(value) => handleInputChange("reference", value)}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            isLoading={isSubmitting}
            variant="light"
            onPress={handleDelete}
          >
            删除职位
          </Button>
          <Button
            color="secondary"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            color="primary"
            isDisabled={!formData.position_name || !formData.job_description}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? "提交中..." : "保存修改"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PositionModifyModal;
