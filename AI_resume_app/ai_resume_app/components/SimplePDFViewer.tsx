"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";

interface SimplePDFViewerProps {
  pdfUrl: string;
  fileName?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export default function SimplePDFViewer({
  pdfUrl,
  fileName = "document.pdf",
  onLoadSuccess,
  onLoadError,
}: SimplePDFViewerProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useObject, setUseObject] = useState<boolean>(false);

  useEffect(() => {
    // 重置错误状态
    setLoadError(null);
  }, [pdfUrl]);

  const handleIframeError = () => {
    console.log("❌ iframe 加载失败，尝试 object 标签");
    setLoadError("iframe加载失败");
    setUseObject(true);
    onLoadError?.(new Error("iframe加载失败"));
  };

  const handleIframeLoad = () => {
    console.log("✅ iframe 加载成功");
    setLoadError(null);
    onLoadSuccess?.();
  };

  const handleObjectError = () => {
    console.log("❌ object 标签也加载失败");
    setLoadError("PDF无法在浏览器中显示");
    onLoadError?.(new Error("object标签加载失败"));
  };

  if (loadError && useObject) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-50 border rounded-lg">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">PDF预览不可用</h3>
          <p className="text-gray-600 mb-4">
            您的浏览器可能不支持PDF内嵌显示或文件无法访问。
          </p>
          <div className="space-x-2">
            <Button
              color="primary"
              onPress={() => window.open(pdfUrl, "_blank")}
            >
              在新窗口中打开
            </Button>
            <Button
              color="secondary"
              onPress={() => {
                const link = document.createElement("a");

                link.href = pdfUrl;
                link.download = fileName;
                link.click();
              }}
            >
              下载PDF
            </Button>
            <Button
              color="warning"
              variant="light"
              onPress={() => {
                setLoadError(null);
                setUseObject(false);
              }}
            >
              重试
            </Button>
          </div>

          {/* 显示错误信息 */}
          <div className="mt-4 p-2 bg-red-50 rounded text-sm text-red-600">
            错误: {loadError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 控制栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">📄 {fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            color="primary"
            size="sm"
            variant="light"
            onPress={() => window.open(pdfUrl, "_blank")}
          >
            新窗口
          </Button>
          <Button
            color="secondary"
            size="sm"
            variant="light"
            onPress={() => {
              const link = document.createElement("a");

              link.href = pdfUrl;
              link.download = fileName;
              link.click();
            }}
          >
            下载
          </Button>
        </div>
      </div>

      {/* PDF显示区域 */}
      <div className="relative">
        {!useObject ? (
          <iframe
            className="border-0 min-h-[700px] bg-white"
            height="calc(100vh - 200px)"
            src={pdfUrl}
            title="PDF预览"
            width="100%"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          >
            <p className="p-4">
              您的浏览器不支持PDF预览。
              <a
                className="text-blue-500 hover:underline"
                href={pdfUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                点击这里在新窗口中查看
              </a>
            </p>
          </iframe>
        ) : (
          <object
            className="min-h-[700px] bg-white"
            data={pdfUrl}
            height="calc(100vh - 200px)"
            type="application/pdf"
            width="100%"
          >
            <p className="p-4">
              您的浏览器不支持PDF预览。
              <a
                className="text-blue-500 hover:underline"
                href={pdfUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                点击这里在新窗口中查看
              </a>
            </p>
          </object>
        )}
      </div>
    </div>
  );
}
