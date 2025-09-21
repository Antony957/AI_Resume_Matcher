"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addToast } from "@heroui/toast";

import { supabase } from "@/config/supabaseClient";
import { ResumeProfile } from "@/types";
import { ResumeEditForm } from "@/components/ResumeEditForm";

export default function ResumeForm() {
  const router = useSearchParams();
  const resumeId = router.get("id");
  const [resumeData, setResumeData] = useState<ResumeProfile>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (resumeId) {
      const fetchResumeData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("resume")
            .select("*")
            .eq("id", resumeId)
            .single();

          if (error) {
            throw error;
          }
          setResumeData(data);
        } catch (error) {
          setError("error fetching resume data");
        } finally {
          setLoading(false);
        }
      };

      fetchResumeData();
    }
  }, [resumeId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!resumeData) {
    return <div>Resume not found</div>;
  }

  return (
    <div>
      <ResumeEditForm
        profile={resumeData}
        onSave={(updatedProfile) => {
          console.log("简历信息已更新:", updatedProfile);
          addToast({
            title: "保存成功",
            description: "简历信息已更新",
            color: "success",
            promise: new Promise((resolve) => setTimeout(resolve, 1000)),
          });
        }}
      />
    </div>
  );
}
