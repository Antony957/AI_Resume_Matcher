"use client";

import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";

import ResumeCardList from "@/components/manage/ResumeManage/ResumeCardList";
import PaginationComponent from "@/components/manage/PaginationComponent";
import ResumeDetailModal from "@/components/manage/ResumeManage/ResumeDetailModal";
import { ResumeProfile, Position } from "@/types";
import { supabase } from "@/config/supabaseClient";
import PositionCardList from "@/components/manage/PositionManage/PositionCardList";
import PositionRecommendModal from "@/components/manage/PositionManage/PositionRecommendModal";
import PositionAddModal from "@/components/manage/PositionManage/PositionAddModal";
import PositionModifyModal from "@/components/manage/PositionManage/PositionModifyModal";
interface TabData {
  id: string;
  label: string;
  data: any[];
}

const PAGE_SIZE = 8;

export default function FilterPage() {
  async function getResumeProfile() {
    console.log("正在查询resume表...");
    const { data: resume_profiles, error } = await supabase
      .from("resume")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return { data: resume_profiles, error };
  }
  async function getResumePosition() {
    try {
      console.log("🔍 开始获取职位数据...");
      const response = await fetch("/api/positions");
      console.log("📡 API响应状态:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log("📊 获取到的职位数据:", result);
      console.log("📊 职位数据数量:", result.data?.length || 0);

      return { data: result.data || [], error: null };
    } catch (error) {
      console.error("❌ 获取职位数据失败:", error);

      return { data: [], error: error };
    }
  }
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "简历管理",
      label: "简历管理",
      data: [],
    },
    {
      id: "职位管理",
      label: "职位管理",
      data: [],
    },
  ]);

  const [tabPages, setTabPages] = useState<{ [tabId: string]: number }>({
    简历管理: 1,
    职位管理: 2,
  });

  const [selectedResume, setSelectedResume] = useState<ResumeProfile | null>(
    null,
  );
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const resumeModal = useDisclosure();
  const positionModal = useDisclosure();
  const addPositionModal = useDisclosure();
  const modifyPositionModal = useDisclosure();

  useEffect(() => {
    async function fetchData() {
      try {
        const [ResumeProfileResult, ResumePositionResult] = await Promise.all([
          getResumeProfile(),
          getResumePosition(),
        ]);

        console.log("📊 设置tabs数据:");
        console.log("简历数据数量:", ResumeProfileResult.data?.length || 0);
        console.log("职位数据数量:", ResumePositionResult.data?.length || 0);

        setTabs([
          {
            id: "简历管理",
            label: "简历管理",
            data: ResumeProfileResult.data || [],
          },
          {
            id: "职位管理",
            label: "职位管理",
            data: ResumePositionResult.data || [],
          },
        ]);
        setTabPages({
          简历管理: 1,
          职位管理: 1,  // 修复：都从第1页开始
        });
      } catch (error) {
        console.error("数据加载失败:", error);
      }
    }
    fetchData();
  }, []);

  const handlePageChange = (tabId: string, page: number) => {
    setTabPages((prev) => ({ ...prev, [tabId]: page }));
  };
  const handleResumeDeleted = () => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        resumes: tab.data.filter((resume) => resume.id !== selectedResume?.id),
      })),
    );
  };

  const refreshPositionData = async () => {
    try {
      const ResumePositionResult = await getResumePosition();

      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === "职位管理"
            ? { ...tab, data: ResumePositionResult.data || [] }
            : tab,
        ),
      );
    } catch (error) {
      console.error("刷新职位数据失败:", error);
    }
  };

  return (
    <div className="fixed inset-0 pt-16 bg-white">
      <div className="h-full p-6 overflow-y-auto">
        <div className="max-w-none mx-auto">
          <div className="flex w-full flex-col">
            <Tabs aria-label="管理">
              {tabs.map((tab) => {
                const totalPages = Math.ceil(
                  (tab.data?.length || 0) / PAGE_SIZE,
                );
                const currentPage = tabPages[tab.id] || 1;
                const pageDatas =
                  tab.data?.slice(
                    (currentPage - 1) * PAGE_SIZE,
                    currentPage * PAGE_SIZE,
                  ) || [];

                return (
                  <Tab key={tab.id} className="flex flex-col" title={tab.label}>
                    {tab.label === "简历管理" ? (
                      <>
                        <ResumeCardList
                          resumes={pageDatas}
                          setSelectedResume={setSelectedResume}
                          onOpen={resumeModal.onOpen}
                        />
                        {totalPages > 1 && (
                          <PaginationComponent
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) =>
                              handlePageChange(tab.id, page)
                            }
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          className="mb-4 mt-4"
                          color="primary"
                          onPress={addPositionModal.onOpen}
                        >
                          添加职位
                        </Button>
                        <PositionCardList
                          positions={pageDatas}
                          setSelectedPosition={setSelectedPosition}
                          onPositionModifyOpen={modifyPositionModal.onOpen}
                          onPositionOpen={positionModal.onOpen}
                        />
                        {totalPages > 1 && (
                          <PaginationComponent
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) =>
                              handlePageChange(tab.id, page)
                            }
                          />
                        )}
                      </>
                    )}
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
      <ResumeDetailModal
        isOpen={resumeModal.isOpen}
        selectedResume={selectedResume}
        onOpenChange={resumeModal.onOpenChange}
        onResumeDeleted={handleResumeDeleted}
      />
      <PositionRecommendModal
        isOpen={positionModal.isOpen}
        selectedPosition={selectedPosition}
        onOpenChange={positionModal.onOpenChange}
      />
      <PositionAddModal
        isOpen={addPositionModal.isOpen}
        onOpenChange={addPositionModal.onOpenChange}
        onPositionAdded={refreshPositionData}
      />
      <PositionModifyModal
        isOpen={modifyPositionModal.isOpen}
        selectedPosition={selectedPosition}
        onOpenChange={modifyPositionModal.onOpenChange}
        onPositionUpdated={refreshPositionData}
      />
    </div>
  );
}
