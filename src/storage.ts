import type { AppData, ForumPost, StrayCatReport } from "./types";
import { loadLanguage } from "./i18n";

const KEY = "mewly-app-data-v2";

export const nowIso = () => new Date().toISOString();
export const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const seedPosts: ForumPost[] = [
  {
    id: "post_seed_1",
    userId: "seed",
    authorName: "奶茶和小鱼干",
    authorAvatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=cat1",
    content: "今天给家里的小朋友换了新猫窝，它先观察了 20 分钟，最后偷偷把脑袋埋进去了。",
    mediaUrls: [],
    topics: ["猫咪日常", "猫咪用品"],
    likeCount: 128,
    commentCount: 18,
    liked: false,
    collected: false,
    followed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "post_seed_2",
    userId: "seed",
    authorName: "软糖铲屎官",
    authorAvatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=cat2",
    content: "新手提醒：猫咪突然躲起来时，先别急着抱，给一点安静空间，再观察食欲和精神。",
    mediaUrls: [],
    topics: ["新手养猫", "猫咪健康"],
    likeCount: 246,
    commentCount: 37,
    liked: false,
    collected: false,
    followed: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const seedStrays: StrayCatReport[] = [
  {
    id: "stray_seed_1",
    userId: "seed",
    approximateLocation: "附近小区东门一带",
    hiddenExactLocation: "仅自己可见：东门便利店后侧",
    images: [],
    videos: [],
    catStatusTags: ["怕人", "需要喂养"],
    needHelpTypes: ["喂养", "绝育帮助"],
    description: "一只橘白猫，常在傍晚出现。对人保持距离，请不要追赶。",
    currentStatus: "待观察",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const emptyData = (): AppData => ({
  user: null,
  cat: null,
  language: loadLanguage(),
  analyses: [],
  album: [],
  healthRecords: [],
  forumPosts: seedPosts,
  comments: [],
  strayReports: seedStrays,
});

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...emptyData(),
      ...parsed,
      language: parsed.language || loadLanguage(),
      forumPosts: parsed.forumPosts?.length ? parsed.forumPosts : seedPosts,
      strayReports: parsed.strayReports?.length ? parsed.strayReports : seedStrays,
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Mewly local save skipped", error);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
