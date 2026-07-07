const DISCLAIMER =
  "本结果基于上传画面、用户补充标签和常见猫咪行为规律生成，仅供日常观察参考，不能替代专业兽医诊断。如症状持续、加重或出现明显异常，请及时咨询兽医。";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String).slice(0, 8) : [];
}

function normalizeResult(value) {
  return {
    primaryMood: String(value.primaryMood || "待观察"),
    possibleIntent: String(value.possibleIntent || "需要结合更多画面线索判断"),
    confidence: Math.max(30, Math.min(95, Number(value.confidence) || 62)),
    matchedRules: normalizeArray(value.matchedRules),
    reasons: normalizeArray(value.reasons),
    suggestions: normalizeArray(value.suggestions),
    observationTips: normalizeArray(value.observationTips),
    riskNotice: DISCLAIMER,
    resultText: String(value.resultText || "Mewly 已基于上传画面做了轻量视觉分析，请继续结合宝宝平时习惯观察。"),
    source: "vision_ai",
    visualObservations: normalizeArray(value.visualObservations),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { message: "Only POST is supported." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    send(res, 503, {
      message: "还没有配置视觉 AI。请在 Vercel 环境变量里添加 OPENAI_API_KEY，重新部署后才能基于照片/视频画面分析。",
    });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      send(res, 400, { message: "请求内容格式不正确。" });
      return;
    }
  }
  const imageDataUrls = Array.isArray(body.imageDataUrls) ? body.imageDataUrls.filter((item) => typeof item === "string") : [];
  if (!imageDataUrls.length) {
    send(res, 400, { message: "没有收到可分析的图片或视频关键帧。" });
    return;
  }
  if (imageDataUrls.join("").length > 8000000) {
    send(res, 413, { message: "上传内容太大，请换一张图片或一段更短的视频。" });
    return;
  }

  const context = {
    mediaType: body.mediaType,
    sceneTags: body.sceneTags || [],
    behaviorTags: body.behaviorTags || [],
    soundTags: body.soundTags || [],
    interactionTags: body.interactionTags || [],
    catProfile: body.catProfile || {},
  };

  const prompt = `
你是 Mewly 的猫咪行为观察助手。请优先根据用户上传的猫咪照片或视频关键帧做视觉观察，用户选择的标签只作为辅助参考，不能替代画面判断。

请分析猫咪当前可能的情绪、意图和互动建议。注意边界：
- 不要诊断疾病。
- 健康相关内容只能写“可能需要观察”“建议咨询兽医”，不能给确定结论。
- 如果画面看不清，请诚实说明可见线索有限。
- 输出必须是简体中文，温柔、可解释。

辅助上下文：
${JSON.stringify(context, null, 2)}
`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      primaryMood: { type: "string" },
      possibleIntent: { type: "string" },
      confidence: { type: "number" },
      visualObservations: { type: "array", items: { type: "string" } },
      matchedRules: { type: "array", items: { type: "string" } },
      reasons: { type: "array", items: { type: "string" } },
      suggestions: { type: "array", items: { type: "string" } },
      observationTips: { type: "array", items: { type: "string" } },
      resultText: { type: "string" },
    },
    required: ["primaryMood", "possibleIntent", "confidence", "visualObservations", "matchedRules", "reasons", "suggestions", "observationTips", "resultText"],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...imageDataUrls.slice(0, 3).map((image_url) => ({ type: "input_image", image_url })),
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "mewly_cat_behavior_analysis",
            strict: true,
            schema,
          },
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      send(res, response.status, {
        message: data.error?.message || "视觉 AI 分析失败，请稍后再试。",
      });
      return;
    }

    const parsed = JSON.parse(extractText(data));
    send(res, 200, { result: normalizeResult(parsed) });
  } catch (error) {
    send(res, 502, { message: error instanceof SyntaxError ? "视觉 AI 返回格式异常，请稍后重试。" : "视觉 AI 服务暂时连接失败，请稍后再试。" });
  }
}
