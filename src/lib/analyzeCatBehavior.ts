import { catBehaviorKnowledge, type BehaviorKnowledgeItem } from "../data/catBehaviorKnowledge";

export type CatBehaviorAnalysisInput = {
  mediaType: "image" | "video" | "audio" | "manual";
  sceneTags: string[];
  behaviorTags: string[];
  soundTags: string[];
  interactionTags: string[];
  catProfile?: {
    name?: string;
    age?: string;
    breed?: string;
    gender?: string;
    personalityTags?: string[];
  };
};

export type CatBehaviorAnalysisResult = {
  primaryMood: string;
  possibleIntent: string;
  confidence: number;
  matchedRules: string[];
  reasons: string[];
  suggestions: string[];
  observationTips: string[];
  riskNotice: string;
  resultText: string;
};

type ScoredRule = {
  rule: BehaviorKnowledgeItem;
  score: number;
  matched: string[];
};

const riskNotice = "本结果基于你选择的行为特征和常见猫咪行为规律生成，仅供日常观察参考，不能替代专业兽医诊断。如症状持续、加重或出现明显异常，请及时咨询兽医。";

function uniq(list: string[]) {
  return [...new Set(list.filter(Boolean))];
}

function scoreRule(rule: BehaviorKnowledgeItem, tags: Set<string>): ScoredRule | null {
  const matchedTriggers = rule.triggerTags.filter((tag) => tags.has(tag));
  const requiredTriggerCount = Math.max(1, Math.ceil(rule.triggerTags.length * 0.55));
  if (matchedTriggers.length < requiredTriggerCount) return null;

  const matchedContexts = (rule.contextTags || []).filter((tag) => tags.has(tag));
  const matchedPositive = (rule.positiveTags || []).filter((tag) => tags.has(tag));
  const matchedNegative = (rule.negativeTags || []).filter((tag) => tags.has(tag));
  const riskBonus = rule.riskLevel === "attention" ? 10 : rule.riskLevel === "observe" ? 4 : 0;
  const categoryBonus = rule.category === "stress" ? 5 : rule.category === "food" ? 4 : rule.category === "health_hint" ? 3 : 0;

  const score =
    rule.confidenceBase +
    matchedTriggers.length * 14 +
    matchedContexts.length * 8 +
    matchedPositive.length * 6 -
    matchedNegative.length * 10 +
    riskBonus +
    categoryBonus;

  return { rule, score, matched: [...matchedTriggers, ...matchedContexts, ...matchedPositive] };
}

function has(tags: Set<string>, ...needles: string[]) {
  return needles.every((tag) => tags.has(tag));
}

function applySafetyPriority(scored: ScoredRule[], tags: Set<string>) {
  if (has(tags, "哈气") || has(tags, "低吼") || has(tags, "炸毛", "弓背") || has(tags, "尾巴快速甩动", "耳朵后压")) {
    return [...scored].sort((a, b) => {
      const aPriority = a.rule.category === "stress" ? 1000 : 0;
      const bPriority = b.rule.category === "stress" ? 1000 : 0;
      return b.score + bPriority - (a.score + aPriority);
    });
  }
  if (has(tags, "靠近食盆", "连续喵叫") || has(tags, "靠近食盆", "看着主人叫")) {
    return [...scored].sort((a, b) => {
      const aPriority = a.rule.category === "food" ? 800 : 0;
      const bPriority = b.rule.category === "food" ? 800 : 0;
      return b.score + bPriority - (a.score + aPriority);
    });
  }
  if (has(tags, "蹭人", "眨眼缓慢") || has(tags, "主动靠近", "尾巴竖起")) {
    return [...scored].sort((a, b) => {
      const aPriority = ["social", "emotion"].includes(a.rule.category) ? 700 : 0;
      const bPriority = ["social", "emotion"].includes(b.rule.category) ? 700 : 0;
      return b.score + bPriority - (a.score + aPriority);
    });
  }
  return scored;
}

export function analyzeCatBehavior(input: CatBehaviorAnalysisInput): CatBehaviorAnalysisResult {
  const catName = input.catProfile?.name || "宝宝";
  const allTags = uniq([...input.sceneTags, ...input.behaviorTags, ...input.soundTags, ...input.interactionTags]);
  const tagSet = new Set(allTags);

  if (allTags.length === 0) {
    return {
      primaryMood: "信息还不够",
      possibleIntent: "需要你补充一些观察到的行为特征",
      confidence: 30,
      matchedRules: [],
      reasons: ["目前还没有选择场景、行为或声音标签，系统不能做可靠推理。"],
      suggestions: ["请先选择猫咪所在场景，以及耳朵、尾巴、声音或互动反应中的几个特征。"],
      observationTips: ["可以观察耳朵方向、尾巴速度、是否主动靠近、叫声类型和是否愿意被摸。"],
      riskNotice,
      resultText: `还需要更多线索哦。上传媒体后，请选择你观察到的 ${catName} 的行为特征，Mewly 才能更准确地分析它现在可能想表达什么。`,
    };
  }

  const scored = catBehaviorKnowledge
    .map((rule) => scoreRule(rule, tagSet))
    .filter((item): item is ScoredRule => Boolean(item))
    .sort((a, b) => b.score - a.score);

  const prioritized = applySafetyPriority(scored, tagSet);
  const best = prioritized[0] || {
    rule: {
      id: "fallback",
      category: "emotion",
      title: "温柔观察",
      triggerTags: [],
      mood: "不确定 / 待观察",
      intent: "需要更多线索",
      confidenceBase: 45,
      explanation: "当前标签组合没有命中强规则，只能做轻量推测。",
      suggestion: "可以再补充声音、尾巴、耳朵和互动反应，让分析更准确。",
      riskLevel: "low",
    },
    score: 45,
    matched: allTags.slice(0, 4),
  };

  const conflictReasons: string[] = [];
  const conflictSuggestions: string[] = [];
  if (tagSet.has("呼噜声") && (tagSet.has("飞机耳") || tagSet.has("躲避主人") || tagSet.has("尾巴夹住") || tagSet.has("躲起来"))) {
    conflictReasons.push("你选择了呼噜声，同时也有飞机耳、躲避、夹尾或躲藏等压力信号，所以不能简单判断为开心。");
    conflictSuggestions.push("可以把它理解为可能在紧张中自我安抚，先给空间，再看它是否主动靠近。");
  }

  const topRules = prioritized.slice(0, 4);
  const reasons = uniq([
    ...conflictReasons,
    ...topRules.map((item) => `${item.rule.explanation}（命中：${item.matched.join("、") || "综合线索"}）`),
  ]).slice(0, 5);
  const suggestions = uniq([...conflictSuggestions, ...topRules.map((item) => item.rule.suggestion)]).slice(0, 5);

  const observationTips = [
    best.rule.riskLevel === "attention" ? "如果哈气、低吼、尖叫、炸毛或攻击行为持续出现，请停止互动并保持距离。" : "",
    topRules.some((item) => item.rule.category === "health_hint") ? "如果同时出现食欲下降、精神差、频繁进猫砂盆等异常，请到“咪记事”记录并持续观察。" : "",
    "继续观察耳朵是否恢复自然、尾巴是否放松、是否愿意主动靠近。",
    "下次可补充短视频或音频，并选择更多场景标签提高准确度。",
  ].filter(Boolean);

  const confidence = Math.max(35, Math.min(96, Math.round(best.score / 1.45)));
  const matchedRules = topRules.map((item) => item.rule.title);

  return {
    primaryMood: best.rule.mood,
    possibleIntent: best.rule.intent,
    confidence,
    matchedRules,
    reasons,
    suggestions,
    observationTips,
    riskNotice,
    resultText: `${catName}现在可能是「${best.rule.mood}」。你选择了 ${allTags.slice(0, 6).join("、")} 等线索，Mewly 推测它${best.rule.intent}。${best.rule.suggestion}`,
  };
}

export async function analyzeCatMediaWithAI(_file: File) {
  // TODO: 后续接入视觉模型 / 音频模型，自动识别图片、视频或叫声特征。
  return null;
}
