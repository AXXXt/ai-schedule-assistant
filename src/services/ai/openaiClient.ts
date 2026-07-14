import type { AIClient, AIClientConfig } from "./aiClient";
import type { ParsedScheduleDraft, GeneratePlanRequest, GeneratePlanResponse } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import type { ScheduleCategory } from "@/types/schedule";

const DEFAULT_CONFIG: Required<AIClientConfig> = {
  baseURL: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini"
};

export function createOpenAIClient(config?: AIClientConfig): AIClient {
  const resolved: Required<AIClientConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    apiKey: config?.apiKey || ""
  };

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${resolved.apiKey}`
  };

  async function chatCompletion(systemPrompt: string, userPrompt: string, jsonSchema: string): Promise<unknown> {
    const body = JSON.stringify({
      model: resolved.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\n请严格按照以下 JSON 格式返回结果，只返回 JSON，不要包含其他文字：\n${jsonSchema}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2048
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${resolved.baseURL}/chat/completions`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from API");
      }

      // Clean markdown code fences if present
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } finally {
      clearTimeout(timeout);
    }
  }

  const parseScheduleDraft = async (
    prompt: string,
    preference: UserPreference
  ): Promise<ParsedScheduleDraft> => {
    // 构建当前日期信息帮助 AI 准确计算相对日期
    const now = new Date();
    const todayStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const weekdayMap = ["日", "一", "二", "三", "四", "五", "六"];
    const todayWeekday = weekdayMap[now.getDay()];

    const systemPrompt = `你是一个智能日程助手。从用户的自然语言输入中提取日程信息。当前日期是 ${todayStr}，星期${todayWeekday}。

【极其重要 - 中文数字识别规则】
中文数字必须识别为阿拉伯数字：
- 一=1, 二=2, 三=3, 四=4, 五=5, 六=6, 七=7, 八=8, 九=9, 十=10
- 十一=11, 十二=12, 十三=13, 二十=20, 二十一=21, 二十三=23, 三十=30
- "五点半"=05:30, "六点十分"=06:10, "七点一刻"=07:15
- "下午三点"=15:00, "晚上八点半"=20:30, "中午十二点"=12:00
- "上午九点"=09:00, "早上七点"=07:00, "凌晨两点"=02:00

【极其重要 - 时间段识别】
- 凌晨: 00:00-05:59
- 早上/早晨: 06:00-08:59
- 上午: 09:00-11:59
- 中午/正午: 12:00-12:59
- 下午: 13:00-17:59
- 傍晚: 18:00-18:59
- 晚上: 19:00-23:59

【极其重要 - 相对日期精确计算规则】
今天是${todayStr}（星期${todayWeekday}）。
- "今天" = ${todayStr}
- "明天" = ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate() + 1}日
- "后天" = ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate() + 2}日
- "大后天" = ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate() + 3}日
- "这周六/本周六" = 本周六的日期
- "下周三" = 下周对应周三的日期
- "下个月X号" = 下个月第X天，例如"下个月1号"=下月1日
- "下下个月" = 两个月后的对应日期
- "X月X号/X月X日" = 当年指定日期
- "下周五下午三点" = 下周五的15:00
- "下个月五号上午九点" = 下月5日09:00

如果用户没有明确指定具体日期只指定了时间，startAt 使用今天的日期。
如果用户没有明确指定时间，startAt 设为 null。

【分类规则】
- dating_social: 约会、聚餐、吃饭、见面、派对、打游戏、网吧、KTV、酒吧等社交娱乐
- health_fitness: 跑步、健身、瑜伽、游泳、打球、运动等
- work_study: 工作、会议、面试、学习、考试、上课、培训等
- travel_errand: 出行、办证、看病、医院、银行、签证、出差等
- other: 无法归类的其他活动

务必准确提取用户提到的地点关键词作为 location（如"万象城"、"万达"、"公园"等）。`;

    const jsonSchema = `{
  "title": "日程标题, 不超过20字",
  "startAt": "ISO时间, 如2026-07-15T18:30:00+08:00, 无法推断时设为null",
  "endAt": "ISO时间, 无法推断时设为null",
  "location": "地点, 无法推断时设为null",
  "category": "dating_social|health_fitness|work_study|travel_errand|other",
  "note": "备注, 无法推断时设为null",
  "missingFields": ["缺失字段: title|time|location|category"],
  "confidence": "high|medium|low"
}`;

    const result = await chatCompletion(systemPrompt, prompt, jsonSchema) as ParsedScheduleDraft;
    return result;
  };

  const generatePlan = async (
    request: GeneratePlanRequest
  ): Promise<GeneratePlanResponse> => {
    const { schedule } = request;
    const systemPrompt = `你是一个智能日程助手。基于用户日程生成可执行的行动方案。用中文回复。

输出包括：
- summary: 一句话总结核心提醒（中文，不超过40字）
- timeline: 时间线节点(type: preparation/departure/event/follow_up)，time 格式 HH:mm
- checklist: 准备清单(priority: low/medium/high)
- risks: 风险提醒(level: low/medium/high, 含 action 建议)
- suggestions: 个性化建议(type: outfit/food/topic/route/study/meeting/exercise/general)
- followUp: 事后复盘提醒(可选)

根据日程类型提供针对性的内容：
- 社交约会：穿什么、聊什么话题、吃什么、交通路线、天气
- 健康运动：运动前饮食、装备准备、强度建议、补充水分
- 工作学习：效率建议、环境推荐、休息安排
- 出行办事：证件清单、路线规划、时间预估`;

    const userPrompt = JSON.stringify({
      schedule: { title: schedule.title, startAt: schedule.startAt, endAt: schedule.endAt, location: schedule.location, category: schedule.category, note: schedule.note },
      userPreference: request.userPreference,
      context: request.context,
      destination: request.context?.destination ?? null,
      route: request.context?.route ?? null
    });

    const jsonSchema = `{
  "summary": "一句话总结",
  "timeline": [{"time": "HH:mm", "title": "节点标题", "description": "可选说明", "type": "preparation|departure|event|follow_up"}],
  "checklist": [{"title": "待办标题", "reason": "原因", "priority": "low|medium|high"}],
  "risks": [{"title": "风险", "detail": "详情", "level": "low|medium|high", "action": "建议行动"}],
  "suggestions": [{"type": "outfit|food|topic|route|study|meeting|exercise|general", "title": "建议标题", "content": "建议内容"}],
  "followUp": [{"title": "跟进标题", "description": "说明"}]
}`;

    const result = await chatCompletion(systemPrompt, userPrompt, jsonSchema) as GeneratePlanResponse;
    return result;
  };

  return { parseScheduleDraft, generatePlan };
}
