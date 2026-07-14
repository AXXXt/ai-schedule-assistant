export const AI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ?? "",
  baseURL: process.env.EXPO_PUBLIC_AI_BASE_URL ?? "https://api.deepseek.com/v1",
  model: process.env.EXPO_PUBLIC_AI_MODEL ?? "deepseek-chat",
};
