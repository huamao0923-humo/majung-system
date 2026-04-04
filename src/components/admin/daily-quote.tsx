"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  "摸對牌，今天順！",
  "胡得早，睡得好",
  "三缺一不如缺你一個",
  "手氣好不如運氣好，運氣好不如胡得早",
  "摸牌前深呼吸，胡牌後淺微笑",
  "輸了別急，下圈還有機會",
  "好牌不嫌少，廢牌一張就夠",
  "打麻將靠的是專注，不是運氣",
  "聽牌的瞬間，心跳加速一秒",
  "槓上開花，人生巔峰",
  "今日不胡牌，明日再努力",
  "摸到好牌要淡定，別讓臉色洩了底",
  "清一色不易，人生亦然",
  "七對子稀有，好心情更稀有",
  "桌上輸贏一局，桌下情誼千年",
];

export default function DailyQuote() {
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  if (!quote) return null;

  return (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-widest" style={{ color: "#D4AF3740" }}>
        今日牌語
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: "#D4AF3770" }}>
        {quote}
      </p>
    </div>
  );
}
