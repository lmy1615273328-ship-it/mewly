import type { MediaAnalysis, MediaType } from "./types";

export const behaviorTags = [
  "耳朵后压",
  "尾巴快速摆动",
  "瞳孔放大",
  "躲起来",
  "蹭人",
  "翻肚皮",
  "频繁舔毛",
  "靠近食盆",
  "长时间睡觉",
  "焦躁",
];

export const soundTags = ["短促喵", "连续喵", "低吼", "呼噜声", "尖叫"];

export interface AnalyzeMetadata {
  userId: string;
  catId: string;
  mediaType: MediaType;
  fileUrl: string;
  tags: string[];
}

function has(tags: string[], ...needles: string[]) {
  return needles.every((tag) => tags.includes(tag));
}

export async function analyzeCatMedia(_file: File | null, metadata: AnalyzeMetadata): Promise<Omit<MediaAnalysis, "id" | "createdAt">> {
  const tags = metadata.tags;
  let resultMood = "好奇";
  let resultIntent = "想确认周围环境";
  let confidence = 67;
  let reasons = ["根据你选择的行为标签，系统正在用常见猫咪行为规律做温柔推测。"];
  let suggestions = ["先观察宝宝的身体姿势和食欲变化，用轻声呼唤或玩具试探互动。"];

  if (has(tags, "耳朵后压", "尾巴快速摆动") || has(tags, "低吼")) {
    resultMood = "紧张 / 生气";
    resultIntent = "需要空间";
    confidence = has(tags, "低吼") ? 88 : 80;
    reasons = ["耳朵后压和尾巴快速摆动常见于警惕、烦躁或防御状态。", "如果伴随低吼，说明宝宝可能正在明确表达不要靠近。"];
    suggestions = ["宝宝现在可能有点紧张哦，先不要强行抱抱，给它一点安静空间。", "移开可能让它害怕的声音或物品，等它主动靠近再互动。"];
  } else if (has(tags, "蹭人", "呼噜声") || has(tags, "蹭人", "翻肚皮")) {
    resultMood = "放松 / 亲近";
    resultIntent = "想贴贴或被关注";
    confidence = 91;
    reasons = ["蹭人、呼噜声和翻肚皮通常代表比较放松，也可能是在表达信任。"];
    suggestions = ["可以轻轻摸摸宝宝喜欢的位置，陪它玩 5 到 10 分钟。", "翻肚皮不一定代表想被摸肚子，先从下巴和脸颊开始更稳妥。"];
  } else if (has(tags, "连续喵", "靠近食盆")) {
    resultMood = "期待";
    resultIntent = "可能想吃饭";
    confidence = 86;
    reasons = ["连续叫声加上靠近食盆，常见于提醒主人关注食物或饮水。"];
    suggestions = ["可以检查饭碗、水碗和喂食时间。", "如果刚吃过仍持续叫，要观察是否有焦躁、排便异常或其他不适。"];
  } else if (has(tags, "躲起来", "长时间睡觉") || has(tags, "躲起来", "精神差")) {
    resultMood = "低落 / 警惕";
    resultIntent = "需要安静，也需要继续观察";
    confidence = 78;
    reasons = ["躲藏和睡眠增加可能和环境压力、无聊或身体不舒服有关，需要结合食欲和排便观察。"];
    suggestions = ["给宝宝准备安静角落，不要频繁打扰。", "如果超过 24 小时食欲下降、精神差或症状加重，建议咨询兽医。"];
  } else if (has(tags, "频繁舔毛", "焦躁")) {
    resultMood = "焦虑 / 压力较大";
    resultIntent = "正在自我安抚";
    confidence = 82;
    reasons = ["频繁舔毛可能是清洁，也可能和压力、皮肤不适或环境变化有关。"];
    suggestions = ["观察是否出现局部掉毛、皮肤发红或舔毛停不下来。", "减少环境刺激，增加稳定互动和躲藏空间。"];
  } else if (tags.includes("呼噜声")) {
    resultMood = "放松";
    resultIntent = "享受陪伴";
    confidence = 76;
    reasons = ["呼噜声多数时候和放松、满足有关，但也需要结合姿势和精神状态。"];
    suggestions = ["继续温柔陪伴就好，宝宝可能正在享受这段小时间。"];
  } else if (tags.includes("尖叫")) {
    resultMood = "害怕 / 疼痛风险";
    resultIntent = "需要立即留意";
    confidence = 84;
    reasons = ["尖叫通常表示强烈惊吓、疼痛或冲突场景，风险比普通叫声更高。"];
    suggestions = ["先确认宝宝是否被困住、受伤或受到惊吓。", "如果伴随跛行、精神差、持续叫或攻击性变强，请及时咨询兽医。"];
  }

  return {
    userId: metadata.userId,
    catId: metadata.catId,
    mediaType: metadata.mediaType,
    fileUrl: metadata.fileUrl,
    selectedBehaviorTags: tags,
    resultMood,
    resultIntent,
    confidence,
    reasons,
    suggestions,
    riskNotice: "此结果仅供参考，不能替代兽医诊断。如症状持续、加重或出现明显异常，请及时就医。",
  };
}
