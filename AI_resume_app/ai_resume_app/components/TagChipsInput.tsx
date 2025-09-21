"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";

interface TagChipsInputProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  allowCreate?: boolean;
  className?: string;
  // 可选：创建标签时使用的API路径（默认 /api/position-keywords）
  createApiPath?: string;
}

export default function TagChipsInput({
  label = "标签",
  placeholder = "输入后回车添加，或从下方建议中选择",
  value,
  onChange,
  allowCreate = true,
  className = "",
  createApiPath = "/api/position-keywords",
}: TagChipsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true);
        const res = await fetch(createApiPath);
        const data = await res.json();
        const items = Array.isArray(data?.data)
          ? data.data
              .map((t: any) => (t?.keyword || t?.tag_name ? String(t.keyword || t.tag_name).toLowerCase() : null))
              .filter(Boolean)
          : [];
        setAllTags(items as string[]);
      } catch {
        setAllTags([]);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, [createApiPath]);

  const normalizedSelected = useMemo(
    () => new Set(value.map((v) => v.trim().toLowerCase()).filter(Boolean)),
    [value],
  );

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    const pool = allTags.filter((t) => !normalizedSelected.has(t));
    if (!q) return pool.slice(0, 10);
    return pool.filter((t) => t.includes(q)).slice(0, 10);
  }, [inputValue, allTags, normalizedSelected]);

  const addToken = (raw: string) => {
    const token = raw.trim().toLowerCase();
    if (!token) return;
    if (normalizedSelected.has(token)) return;
    const next = [...Array.from(normalizedSelected), token];
    onChange(next);
    setInputValue("");
    // 若是新标签，则异步保存到数据库，并加入候选池
    if (allowCreate && !allTags.includes(token)) {
      setAllTags((prev) => (prev.includes(token) ? prev : [...prev, token]));
      fetch(createApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: token }),
      }).catch(() => {});
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addToken(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // 删除最后一个
      onChange(value.slice(0, value.length - 1));
    }
  };

  const removeToken = (token: string) => {
    onChange(value.filter((v) => v.toLowerCase() !== token.toLowerCase()));
  };

  const handleCreate = async (name: string) => {
    if (!allowCreate) return addToken(name);
    try {
      setCreating(true);
      const res = await fetch(createApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: name }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        // 即使创建失败也尝试添加本地
        addToken(name);
        return;
      }
      // 成功：合并到 allTags 并添加（API 返回 keyword 或 tag_name）
      const newName = String(data?.data?.keyword || data?.data?.tag_name || name).toLowerCase();
      setAllTags((prev) => (prev.includes(newName) ? prev : [...prev, newName]));
      addToken(newName);
    } catch {
      addToken(name);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <Input
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
        />

        {/* 已选 chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag) => (
              <Chip
                key={tag}
                color="primary"
                size="sm"
                variant="flat"
                onClose={() => removeToken(tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}

        {/* 建议列表 */}
        <div ref={listRef} className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
          {loading ? (
            <div className="text-sm text-gray-500">加载标签...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((s) => (
              <Button key={s} size="sm" variant="bordered" onPress={() => addToken(s)}>
                {s}
              </Button>
            ))
          ) : inputValue ? (
            <Button
              size="sm"
              color="primary"
              isLoading={creating}
              onPress={() => handleCreate(inputValue)}
            >
              创建 “{inputValue.trim()}”
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}


