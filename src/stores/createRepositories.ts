import {
  createAIPlanRepository,
  createPreferenceRepository,
  createScheduleRepository,
  initializeDatabase,
  seedMockDataIfEmpty,
  createMemorySqliteAdapter
} from "@/services/storage";
import { getAIClient } from "@/services/ai/getAIClient";

// 同步创建仓库和 AI 客户端，数据库初始化在后台进行
export function createRepositories() {
  const db = createMemorySqliteAdapter();
  const repositories = {
    schedules: createScheduleRepository(db),
    aiPlans: createAIPlanRepository(db),
    preferences: createPreferenceRepository(db)
  };

  const aiClient = getAIClient();

  // 后台异步初始化数据库表和种子数据
  initializeDatabase(db)
    .then(() => seedMockDataIfEmpty(repositories))
    .catch(() => {});

  return { ...repositories, aiClient };
}
