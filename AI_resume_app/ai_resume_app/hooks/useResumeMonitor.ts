import { useState, useEffect, useCallback } from "react";

import { ResumeFile, ResumeProfile } from "@/types";

interface UseResumeMonitorResult {
  file: ResumeFile | null;
  profile: ResumeProfile | null;
  isMonitoring: boolean;
  error: string | null;
  startMonitoring: (fileName: string) => void;
  stopMonitoring: () => void;
}

export function useResumeMonitor(): UseResumeMonitorResult {
  const [file, setFile] = useState<ResumeFile | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async (fileName: string) => {
    try {
      console.log("检查文件状态:", fileName);
      const response = await fetch(
        `/api/resume-status?fileName=${encodeURIComponent(fileName)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("收到响应:", data);

      if (data.found) {
        console.log("找到文件记录:", data.file);
        setFile(data.file);
        setProfile(data.profile);
        setError(null);

        // 如果LLM处理完成或失败，停止监控
        if (
          data.file.llm_status === "completed" ||
          data.file.llm_status === "failed"
        ) {
          console.log("LLM处理完成，停止监控");
          stopMonitoring();
        }
      } else {
        // 文件还没有被处理，继续监控
        console.log("文件还没有被处理，继续监控");
        setFile(null);
        setProfile(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "监控状态时发生错误";

      setError(errorMessage);
      console.error("Error checking status:", err);
    }
  }, []);

  const startMonitoring = useCallback(
    (fileName: string) => {
      // 清除之前的定时器
      if (intervalId) {
        clearInterval(intervalId);
      }

      setIsMonitoring(true);
      setError(null);
      setFile(null);
      setProfile(null);

      // 立即检查一次
      checkStatus(fileName);

      // 每2秒检查一次
      const id = setInterval(() => {
        checkStatus(fileName);
      }, 2000);

      setIntervalId(id);
    },
    [checkStatus, intervalId],
  );

  const stopMonitoring = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsMonitoring(false);
  }, [intervalId]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    file,
    profile,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
  };
}
