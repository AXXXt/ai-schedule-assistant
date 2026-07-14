import type { AIClient } from "@/services/ai/aiClient";
import { createMockAIClient } from "@/services/ai/mockAIClient";
import { createOpenAIClient } from "@/services/ai/openaiClient";
import { AI_CONFIG } from "@/services/ai/aiConfig";

let client: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!client) {
    if (AI_CONFIG.apiKey) {
      client = createOpenAIClient({
        apiKey: AI_CONFIG.apiKey,
        baseURL: AI_CONFIG.baseURL,
        model: AI_CONFIG.model,
      });
    } else {
      client = createMockAIClient();
    }
  }
  return client;
}

export function resetAIClient() {
  client = null;
}
