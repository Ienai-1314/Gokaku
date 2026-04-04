"use client";

import { useState, useRef } from "react";

interface VoiceInputProps {
  onResult: (text: string) => void;
  language?: string;
}

export default function VoiceInput({ onResult, language = "ja-JP" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // 检查浏览器支持
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("您的浏览器不支持语音输入");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      switch (event.error) {
        case "no-speech":
          setError("未检测到语音，请重试");
          break;
        case "audio-capture":
          setError("无法访问麦克风");
          break;
        case "not-allowed":
          setError("麦克风权限被拒绝");
          break;
        default:
          setError("语音识别失败，请重试");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-3 rounded-full transition-all ${
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-orange-500 hover:bg-orange-600"
        } text-white shadow-lg`}
        title={isListening ? "停止录音" : "开始语音输入"}
      >
        {isListening ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {isListening && (
        <p className="text-sm text-orange-600 font-medium animate-pulse">
          正在听...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
