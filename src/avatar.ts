import type { CatProfile } from "./types";

const colorMap: Record<string, string> = {
  橘: "#EFA55F",
  橘白: "#F2B873",
  白: "#F8F1E7",
  黑: "#4B3E3B",
  灰: "#A8A8A8",
  蓝: "#9AAFC4",
  三花: "#F3C17C",
  奶牛: "#F8F1E7",
  暹罗: "#C7A27B",
  玳瑁: "#8B5D46",
};

function pickColor(color: string) {
  const hit = Object.keys(colorMap).find((key) => color.includes(key));
  return hit ? colorMap[hit] : "#EFB7A6";
}

export function generateCatAvatar(profile: Pick<CatProfile, "name" | "gender" | "color" | "personalityTags" | "breed">) {
  const base = pickColor(profile.color || profile.breed);
  const shy = profile.personalityTags.includes("胆小") || profile.personalityTags.includes("怕生");
  const lively = profile.personalityTags.includes("活泼") || profile.personalityTags.includes("爱玩");
  const clingy = profile.personalityTags.includes("粘人");
  const decoration = profile.gender === "妹妹" ? "bow" : profile.gender === "弟弟" ? "bell" : "fish";
  const eye = shy ? "M73 103c8 3 13 3 20 0" : lively ? "M75 103c7-7 13-7 20 0" : "M78 102h13";
  const eye2 = shy ? "M119 103c8 3 13 3 20 0" : lively ? "M121 103c7-7 13-7 20 0" : "M124 102h13";
  const mouth = clingy ? "M94 129c8 10 20 10 28 0" : shy ? "M97 129c6 4 14 4 20 0" : "M94 128c8 7 20 7 28 0";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
  <style>
    @keyframes blink{0%,88%,100%{transform:scaleY(1)}92%,96%{transform:scaleY(.08)}}
    .eye{transform-origin:center;animation:blink 4s infinite}
  </style>
  <rect width="220" height="220" rx="42" fill="#FFF3DD"/>
  <circle cx="110" cy="113" r="73" fill="${base}"/>
  <path d="M49 76 70 28l35 43M171 76 150 28l-35 43" fill="${base}"/>
  <path d="M66 61 74 43l14 20M154 61l-8-18-14 20" fill="#F8D3C3" opacity=".9"/>
  <path d="M50 130c-17-5-30-12-40-22M170 130c17-5 30-12 40-22" stroke="#B97967" stroke-width="6" stroke-linecap="round" opacity=".75"/>
  <path d="M52 146c-16 2-30 1-42-3M168 146c16 2 30 1 42-3" stroke="#B97967" stroke-width="6" stroke-linecap="round" opacity=".75"/>
  <g class="eye" stroke="#4F3A33" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="${eye}"/>
    <path d="${eye2}"/>
  </g>
  <path d="M105 117h10l-5 7-5-7Z" fill="#DF7985"/>
  <path d="${mouth}" stroke="#4F3A33" stroke-width="6" stroke-linecap="round" fill="none"/>
  ${profile.color.includes("三花") ? '<path d="M83 55c11-14 28-11 34 3-9 12-24 17-34-3Z" fill="#5B4438" opacity=".9"/><path d="M124 62c12-8 28-2 31 10-10 5-23 4-31-10Z" fill="#FFFFFF" opacity=".8"/>' : ""}
  ${profile.color.includes("奶牛") ? '<path d="M62 86c15-20 41-17 48 1-11 16-33 22-48-1Z" fill="#4B3E3B"/><path d="M132 71c11-10 27-5 30 8-10 8-23 6-30-8Z" fill="#4B3E3B"/>' : ""}
  ${decoration === "bow" ? '<path d="M133 52c14-15 32-10 35 8-14 12-27 11-35-8ZM125 52c-14-15-32-10-35 8 14 12 27 11 35-8Z" fill="#FF9CAF"/><circle cx="129" cy="60" r="8" fill="#F36F8F"/>' : ""}
  ${decoration === "bell" ? '<circle cx="110" cy="178" r="12" fill="#F8C64F"/><path d="M99 177h22" stroke="#9B6C32" stroke-width="4" stroke-linecap="round"/>' : ""}
  ${decoration === "fish" ? '<path d="M137 177c16-12 31-10 41 0-10 10-25 12-41 0Z" fill="#8DBDD8"/><path d="M178 177l13-10v20l-13-10Z" fill="#8DBDD8"/>' : ""}
  <text x="110" y="205" font-family="Arial, sans-serif" font-size="15" text-anchor="middle" fill="#7A5144">${profile.name || "小猫猫"}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
