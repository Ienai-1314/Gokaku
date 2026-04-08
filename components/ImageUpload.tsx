"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
  type?: "question" | "vocab";
  buttonText?: string;
}

export default function ImageUpload({
  onTextExtracted,
  type = "question",
  buttonText = "拍照/上传图片"
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // 检查文件类型
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("仅支持 JPG、PNG、WebP 格式");
      return;
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 显示预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 转换为 base64
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(",")[1]; // 移除 data:image/xxx;base64, 前缀

      // 调用 OCR API
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "识别失败");
      }

      if (data.text) {
        onTextExtracted(data.text);
        setPreview(null);
      } else {
        throw new Error("未能识别图片中的文字");
      }
    } catch (err: any) {
      setError(err.message || "图片识别失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError("");
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-xl text-[#6B5E55] hover:border-[#C75B3B]/40 hover:bg-[#FAF6F0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>识别中...</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-xl overflow-hidden border border-[#E8E0D5]"
          >
            <img
              src={preview}
              alt="预览"
              className="w-full h-auto max-h-48 object-contain bg-[#FAF6F0]"
            />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-[#6B5E55]/60 text-center">
        支持 JPG、PNG、WebP 格式，最大 10MB
      </div>
    </div>
  );
}
