"use client";

import { useState } from "react";

interface JapaneseKeyboardProps {
  onInsert: (text: string) => void;
}

export default function JapaneseKeyboard({ onInsert }: JapaneseKeyboardProps) {
  const [activeTab, setActiveTab] = useState<"hiragana" | "katakana" | "symbols">("hiragana");

  const hiraganaKeys = [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "nu", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "ゆ", "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", "を", "ん"],
    ["が", "ぎ", "ぐ", "げ", "ご"],
    ["ざ", "じ", "ず", "ぜ", "ぞ"],
    ["だ", "ぢ", "づ", "で", "ど"],
    ["ば", "び", "ぶ", "べ", "ぼ"],
    ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
    ["ゃ", "ゅ", "ょ", "っ"],
  ];

  const katakanaKeys = [
    ["ア", "イ", "ウ", "エ", "オ"],
    ["カ", "キ", "ク", "ケ", "コ"],
    ["サ", "シ", "ス", "セ", "ソ"],
    ["タ", "チ", "ツ", "テ", "ト"],
    ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    ["マ", "ミ", "ム", "メ", "モ"],
    ["ヤ", "ユ", "ヨ"],
    ["ラ", "リ", "ル", "レ", "ロ"],
    ["ワ", "ヲ", "ン"],
    ["ガ", "ギ", "グ", "ゲ", "ゴ"],
    ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
    ["ダ", "ヂ", "ヅ", "デ", "ド"],
    ["バ", "ビ", "ブ", "ベ", "ボ"],
    ["パ", "ピ", "プ", "ペ", "ポ"],
    ["ャ", "ュ", "ョ", "ッ"],
  ];

  const symbolKeys = [
    ["～", "〜", "ー", "・", "、"],
    ["。", "！", "？", "「", "」"],
    ["『", "』", "（", "）", "【"],
    ["】", "…", "‥", "々", "〇"],
    ["の", "に", "を", "は", "が"],
    ["で", "と", "も", "から", "まで"],
  ];

  const getKeys = () => {
    switch (activeTab) {
      case "hiragana":
        return hiraganaKeys;
      case "katakana":
        return katakanaKeys;
      case "symbols":
        return symbolKeys;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
      {/* Tab 切换 */}
      <div className="flex gap-2 mb-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("hiragana")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === "hiragana"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          平假名
        </button>
        <button
          onClick={() => setActiveTab("katakana")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === "katakana"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          片假名
        </button>
        <button
          onClick={() => setActiveTab("symbols")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === "symbols"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          符号/助词
        </button>
      </div>

      {/* 键盘按键 */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {getKeys().map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onInsert(key)}
                className="min-w-[36px] h-9 px-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded text-sm font-medium transition-colors active:bg-orange-100"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 常用操作 */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
        <button
          onClick={() => onInsert("　")}
          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
        >
          全角空格
        </button>
        <button
          onClick={() => onInsert(" ")}
          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
        >
          半角空格
        </button>
      </div>
    </div>
  );
}
