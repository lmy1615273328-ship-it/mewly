export type Gender = "妹妹" | "弟弟" | "未知";
export type Severity = "轻微" | "中等" | "严重";
export type RiskLevel = "正常" | "需观察" | "建议咨询兽医" | "尽快就医";
export type MediaType = "image" | "video" | "audio";

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  emailOrPhone: string;
  createdAt: string;
  lastActiveAt: string;
  realUsageScore: number;
  canUseStrayCatMap: boolean;
}

export interface CatProfile {
  id: string;
  userId: string;
  name: string;
  gender: Gender;
  birthday: string;
  age: string;
  breed: string;
  color: string;
  weight: string;
  sterilized: boolean;
  vaccineStatus: string;
  personalityTags: string[];
  habitTags: string[];
  habitsText: string;
  ownerNickname: string;
  cartoonAvatar: string;
  createdAt: string;
}

export interface MediaAnalysis {
  id: string;
  userId: string;
  catId: string;
  mediaType: MediaType;
  fileUrl: string;
  selectedBehaviorTags: string[];
  resultMood: string;
  resultIntent: string;
  confidence: number;
  reasons: string[];
  suggestions: string[];
  riskNotice: string;
  createdAt: string;
}

export interface AlbumItem {
  id: string;
  userId: string;
  catId: string;
  mediaType: Exclude<MediaType, "audio">;
  fileUrl: string;
  tags: string[];
  note: string;
  detectedMood: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  catId: string;
  abnormalTypes: string[];
  severity: Severity;
  duration: string;
  appetiteChanged: boolean;
  energyChanged: boolean;
  toiletChanged: boolean;
  note: string;
  mediaUrls: string[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  suggestions: string[];
  createdAt: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaUrls: string[];
  topics: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  collected: boolean;
  followed: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface StrayCatReport {
  id: string;
  userId: string;
  approximateLocation: string;
  hiddenExactLocation: string;
  images: string[];
  videos: string[];
  catStatusTags: string[];
  needHelpTypes: string[];
  description: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  user: User | null;
  cat: CatProfile | null;
  language: Language;
  analyses: MediaAnalysis[];
  album: AlbumItem[];
  healthRecords: HealthRecord[];
  forumPosts: ForumPost[];
  comments: Comment[];
  strayReports: StrayCatReport[];
}

export type Page =
  | "login"
  | "cat-create"
  | "home"
  | "insight"
  | "album"
  | "album-detail"
  | "notes"
  | "notes-new"
  | "notes-result"
  | "forum"
  | "post-new"
  | "post-detail"
  | "stray"
  | "stray-new"
  | "profile"
  | "settings";

export const HEALTH_DISCLAIMER =
  "本结果仅基于用户记录和常见猫咪行为规律生成，不能替代专业兽医诊断。如症状持续、加重或出现明显异常，请及时就医。";

export type Language = "zh-CN" | "en";

export const APP_NAME = "Mewly";
export const APP_VERSION = "0.2.0-beta";
