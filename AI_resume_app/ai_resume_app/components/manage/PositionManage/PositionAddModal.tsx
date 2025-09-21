import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import TagChipsInput from "@/components/TagChipsInput";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";

interface PositionAddModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPositionAdded?: () => void;
}

const PositionAddModal: React.FC<PositionAddModalProps> = ({
  isOpen,
  onOpenChange,
  onPositionAdded,
}) => {
  const [formData, setFormData] = React.useState({
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
    status: "active" as const,
    urgency: "normal" as const,
    // 新增：硬性关键字（文本输入，逗号/分号分隔）
    mandatory_keywords_text: "",
    // 新增：命中逻辑（默认全部命中）
    mandatory_logic: "all" as const,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.position_name || !formData.job_description) {
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
        ...formData,
        hc: formData.hc ? parseInt(formData.hc) : null,
        // 规范化硬性关键字为字符串数组（小写去空格，过滤空项）
        mandatory_keywords: (formData.mandatory_keywords_text || "")
          .replaceAll("；", ",")
          .replaceAll("，", ",")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0),
        mandatory_logic: formData.mandatory_logic,
      };

      const response = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "添加职位失败");
      }

      addToast({
        title: "添加成功",
        description: `已添加职位：${formData.position_name}`,
        color: "success",
      });

      // 重置表单
      setFormData({
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
        status: "active",
        urgency: "normal",
        mandatory_keywords_text: "",
        mandatory_logic: "all",
      });

      onOpenChange(false);
      onPositionAdded?.();
    } catch (error) {
      addToast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加职位失败",
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
        <ModalHeader>添加职位</ModalHeader>
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
                <SelectItem key="all">
                  必须全部命中（严格）
                </SelectItem>
                <SelectItem key="any">
                  命中任意一个即可（宽松）
                </SelectItem>
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
            {isSubmitting ? "提交中..." : "提交"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PositionAddModal;
