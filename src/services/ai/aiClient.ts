import type { ParsedScheduleDraft, GeneratePlanRequest, GeneratePlanResponse, AIPlan } from "@/types/ai";
import type { UserPreference } from "@/types/preference";
import type { Schedule } from "@/types/schedule";

/**
 * AI 客户端统一接口。
 * 所有 AI 能力（mock 或真实）都通过此接口暴露，
 * 页面只需依赖此接口，不感知具体实现。
 */
export interface AIClient {
  /**
   * 自然语言解析：把用户的自由文本解析为结构化的日程草稿。
   */
  parseScheduleDraft(prompt: string, preference: UserPreference): Promise<ParsedScheduleDraft>;

  /**
   * AI 行动方案生成：基于日程的 时间/地点/类型/备注，
   * 结合用户偏好，生成可执行的准备方案（时间线、清单、风险、建议）。
   */
  generatePlan(request: GeneratePlanRequest): Promise<GeneratePlanResponse>;
}

/**
 * 工厂函数类型：真实客户端可能需要 API key 等配置。
 */
export type AIClientFactory = (config?: AIClientConfig) => AIClient;

export type AIClientConfig = {
  baseURL?: string;
  apiKey?: string;
  model?: string;
};
