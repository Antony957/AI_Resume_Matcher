"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface Option {
  id: string;
  label: string;
  value: string;
}

interface ButtonSelectorProps {
  options: Option[];
  value?: string[];
  onChange?: (value: string[]) => void;
  multiple?: boolean;
  showScrollButtons?: boolean;
  className?: string;
}

export default function ButtonSelector({
  options,
  value = [],
  onChange,
  multiple = true,
  showScrollButtons = true,
  className = "",
}: ButtonSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  useEffect(() => {
    if (scrollContainer) {
      const checkScroll = () => {
        setCanScrollLeft(scrollContainer.scrollLeft > 0);
        setCanScrollRight(
          scrollContainer.scrollLeft <
            scrollContainer.scrollWidth - scrollContainer.clientWidth,
        );
      };

      checkScroll();
      scrollContainer.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        scrollContainer.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [scrollContainer]);

  const handleOptionToggle = (optionValue: string) => {
    let newValues: string[];

    if (multiple) {
      newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
    } else {
      newValues = selectedValues.includes(optionValue) ? [] : [optionValue];
    }

    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainer) {
      const scrollAmount = 200;

      scrollContainer.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getSelectedLabels = () => {
    return selectedValues
      .map((value) => options.find((option) => option.value === value)?.label)
      .filter(Boolean);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 滚动按钮 */}
      {showScrollButtons && (
        <>
          <Button
            isIconOnly
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
            size="sm"
            variant="flat"
            onPress={() => scroll("left")}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            isIconOnly
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
            size="sm"
            variant="flat"
            onPress={() => scroll("right")}
          >
            <ChevronRightIcon />
          </Button>
        </>
      )}

      {/* 可滑动的按钮容器 */}
      <div className="relative">
        <div
          ref={setScrollContainer}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-2 pb-2 min-w-max px-2">
            {options.map((option) => (
              <Button
                key={option.id}
                className="whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:scale-105"
                color={
                  selectedValues.includes(option.value) ? "primary" : "default"
                }
                size="sm"
                variant={
                  selectedValues.includes(option.value) ? "solid" : "bordered"
                }
                onPress={() => handleOptionToggle(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 选中的标签显示 */}
      {selectedValues.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {getSelectedLabels().map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 border border-primary-200"
              >
                {label}
                <button
                  className="ml-2 text-primary-600 hover:text-primary-800 transition-colors"
                  onClick={() =>
                    handleOptionToggle(
                      options.find((option) => option.label === label)?.value ||
                        "",
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
