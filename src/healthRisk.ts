import type { HealthRecord, RiskLevel, Severity } from "./types";
import { HEALTH_DISCLAIMER } from "./types";

export interface HealthInput {
  abnormalTypes: string[];
  severity: Severity;
  duration: string;
  appetiteChanged: boolean;
  energyChanged: boolean;
  toiletChanged: boolean;
  note: string;
}

function includesAny(list: string[], needles: string[]) {
  return needles.some((item) => list.includes(item));
}

function durationOver24Hours(duration: string) {
  return /24|一天|1天|超过一天|两天|2天|48/.test(duration);
}

export function analyzeHealthRisk(input: HealthInput): Pick<HealthRecord, "riskLevel" | "riskReasons" | "suggestions"> {
  const types = input.abnormalTypes;
  let riskLevel: RiskLevel = "需观察";
  const riskReasons: string[] = [];
  const suggestions: string[] = ["记录接下来 24 小时的食欲、饮水、精神、排便和排尿变化。"];

  if (!types.length) {
    return {
      riskLevel: "正常",
      riskReasons: ["暂未选择明显异常类型。"],
      suggestions: ["继续保持日常记录，留意宝宝和平时相比是否有变化。", HEALTH_DISCLAIMER],
    };
  }

  if (input.severity === "严重") {
    riskLevel = "建议咨询兽医";
    riskReasons.push("你将严重程度标记为严重，需要更谨慎对待。");
  }

  if (includesAny(types, ["频繁进猫砂盆", "乱尿"]) && input.energyChanged) {
    riskLevel = "尽快就医";
    riskReasons.push("频繁进猫砂盆或乱尿，同时伴随精神变差，可能存在泌尿系统风险。");
    suggestions.push("尽快联系兽医，留意是否排不出尿、疼痛叫声或频繁蹲砂盆。");
  }

  if (types.includes("不爱吃饭") && durationOver24Hours(input.duration)) {
    riskLevel = "尽快就医";
    riskReasons.push("持续不吃饭超过 24 小时对猫咪风险较高。");
    suggestions.push("请尽快咨询兽医，不要长时间等待自行恢复。");
  }

  if (types.includes("呕吐") && input.energyChanged) {
    riskLevel = riskLevel === "尽快就医" ? riskLevel : "建议咨询兽医";
    riskReasons.push("反复呕吐或呕吐伴随精神变差需要重视。");
    suggestions.push("记录呕吐次数、颜色、是否有异物，并观察是否还能正常喝水。");
  }

  if (types.includes("频繁喝水") && /瘦|下降|体重/.test(input.note)) {
    riskLevel = riskLevel === "尽快就医" ? riskLevel : "建议咨询兽医";
    riskReasons.push("频繁喝水并提到体重下降，需要进一步检查确认原因。");
    suggestions.push("可以记录每日饮水量和体重变化，带给兽医参考。");
  }

  if (includesAny(types, ["走路异常", "咳嗽 / 打喷嚏", "眼睛分泌物"]) && input.severity !== "轻微") {
    riskLevel = riskLevel === "尽快就医" ? riskLevel : "建议咨询兽医";
    riskReasons.push("运动、呼吸或眼部分泌物异常达到中等以上，建议不要只在家观察。");
  }

  if (input.appetiteChanged || input.energyChanged || input.toiletChanged) {
    riskReasons.push("伴随食欲、精神或排便排尿变化，观察优先级提高。");
  }

  if (riskReasons.length === 0) {
    riskReasons.push("当前记录多为轻微单项异常，暂时更适合持续观察。");
  }

  suggestions.push("如持续、加重或伴随明显不适，请及时咨询兽医。");
  suggestions.push(HEALTH_DISCLAIMER);
  return { riskLevel, riskReasons, suggestions };
}
