# AI 智能日程生活助理产品设计

## 1. 产品定位

本产品是一款效率风格的 AI 生活助理。用户照常创建日程，AI 会基于日程的时间、地点、类型和备注，自动生成可执行的准备方案。

普通日程 App 主要回答“什么时候提醒我”，本产品重点回答“这件事我应该怎么准备、什么时候行动、有哪些风险需要提前注意”。

目标用户是希望把生活安排得更从容的年轻用户，尤其适合用于面试作品展示：它有清晰的日程工具基础，也有明确、自然、有价值的 AI 增强点。

## 2. 核心体验

核心流程：

1. 用户创建日程：填写标题、时间、地点、类型和备注。
2. AI 识别场景：判断日程属于约会/社交、运动/健康、工作/学习、出行/办事等类型。
3. AI 生成建议：输出准备清单、时间规划、风险提醒和生活建议。
4. 用户执行建议：查看、保存、刷新、标记完成建议项。

核心原则：

- 先是一个好用的日程 App，再是一个聪明的 AI 助理。
- AI 建议必须服务于行动，避免只生成泛泛而谈的文字。
- 首页优先展示今天要做什么、提前准备什么，而不是只展示月历。
- v1 保持本地优先，减少账号、协作、复杂后端等非核心负担。

## 3. v1 场景范围

v1 保留 4 个高频场景，用来覆盖生活温度与效率价值。

| 场景 | 示例 | AI 输出重点 |
| --- | --- | --- |
| 约会/社交 | 约会、朋友聚餐、见家长 | 穿搭、地点、话题、礼仪、时间安排 |
| 运动/健康 | 晨跑、健身、瑜伽 | 饮食时间、运动建议、装备、恢复提醒 |
| 工作/学习 | 会议、面试、考试、自习 | 准备清单、重点事项、复盘提醒 |
| 出行/办事 | 看病、办证、短途出行 | 材料清单、路线时间、天气、风险提醒 |

这 4 个场景足够展示 AI 建议能力的泛化，又不会让 v1 变成难以完成的大型生活平台。

## 4. 页面结构

v1 采用 4 个主页面 + 1 个详情页。

| 页面 | 作用 |
| --- | --- |
| 今日 | AI 今日摘要、今日时间轴、待准备事项 |
| 日历 | 周/月视图，按日期查看日程 |
| 添加日程 | 快速创建日程，支持 AI 自动识别类型 |
| 我的 | 偏好设置、AI 建议风格、个人资料 |
| 日程详情 | 基础信息、AI 行动方案、建议清单 |

首页采用“AI 今日摘要 + 时间轴”的混合结构。顶部给出今天最重要的整体提醒，下方按时间展示日程和关键准备节点。

示例：

> 今天下午有一次社交安排，建议你提前 40 分钟出门；上午适合处理轻量工作，晚上运动强度不要太高。

时间轴示例：

- 08:00 晨跑
- 09:00 早餐建议
- 14:20 出门提醒
- 15:00 约会
- 22:00 简单复盘

## 5. AI 建议卡片

AI 建议应以结构化卡片呈现，而不是大段聊天文本。

建议卡片类型：

- 准备清单：需要带什么、提前确认什么。
- 时间规划：几点开始准备、几点出门、是否需要缓冲时间。
- 风险提醒：天气、迟到、材料遗漏、运动不适等。
- 个性建议：穿搭、饮食、话题、运动强度、学习节奏等。
- 复盘提醒：事件结束后是否需要记录、总结或跟进。

每条建议应支持完成状态，便于用户把 AI 建议当作可执行任务处理。

## 6. v1 暂不做

为保证面试作品可以完成并展示完整闭环，v1 暂不加入以下能力：

- 多人协作日历。
- 复杂账号体系。
- 社交分享社区。
- 完整地图导航。
- 复杂后端同步。
- 全自动代替用户创建日程。

这些能力可以放入后续版本路线图，但不进入第一版核心范围。

## 7. 页面级方案

### 7.1 今日页

今日页是默认首页，目标是让用户打开 App 后快速知道今天的安排、需要提前准备的事项，以及 AI 认为最需要注意的重点。

页面结构：

- 顶部概览：展示日期、星期和一句今日状态，例如“今天节奏适中”。
- AI 今日摘要：用一张轻量卡片总结当天关键安排和准备建议。
- 状态胶囊：展示日程数、待准备事项数、风险提醒数。
- 待准备事项：列出 AI 从日程建议中提取的可执行事项，支持勾选完成。
- 今日时间轴：按时间展示日程和 AI 插入的准备节点。

核心交互：

- 点击日程卡片进入日程详情。
- 点击待准备事项可标记完成。
- 下拉刷新今日摘要。
- 无日程时显示温和空状态，并引导用户添加日程。

视觉方向：

今日页应是全 App 最有吸引力的一页。整体采用 Apple 式清爽高级风格，使用浅色背景、充足留白、轻量卡片和克制的动效，让用户感到可靠、从容、有生活温度。

### 7.2 日历页

日历页提供时间全局视角，帮助用户查看某周或某月的安排密度。v1 采用月视图和选中日期日程列表，不做复杂拖拽排期。

页面结构：

- 顶部月份栏：展示当前年月，支持切换月份和回到今天。
- 月历网格：展示日期，并用小圆点表达当天状态。
- 日期状态：蓝点表示普通日程，橙点表示风险提醒，绿点表示准备事项已完成。
- 当天日程列表：点击某天后，在下方展示该日期的日程卡片。

核心交互：

- 左右切换月份。
- 点击日期更新下方日程列表。
- 点击日程进入日程详情。
- 点击“今天”回到当前日期。
- 长按日期可快速创建该日期的日程。

v1 暂不做：

- 日程拖拽改时间。
- 多日程复杂冲突检测。
- 系统日历双向同步。
- 农历和节假日复杂配置。
- 周视图和日视图切换。

### 7.3 添加日程页

添加日程页采用双模式创建：AI 聊天创建和手动填写。AI 用来降低输入成本，表单用来保证用户可确认、可调整。

AI 聊天创建流程：

1. 用户输入自然语言，例如“明天下午三点和小雨在万象城约会，想吃日料，预算两百左右”。
2. AI 解析出标题、时间、地点、类型和备注。
3. App 展示结构化预览。
4. 用户选择确认创建或手动调整。
5. 确认后进入日程详情页，并生成 AI 行动方案。

手动填写流程：

- 用户填写标题、开始时间、结束时间、地点、类型和备注。
- 类型支持约会/社交、运动/健康、工作/学习、出行/办事和其他。
- 用户可选择是否生成 AI 建议。
- 点击保存后进入日程详情页。

设计原则：

- AI 不直接替用户创建日程，必须经过确认。
- AI 解析错误时，用户可以随时手动调整。
- 添加页不输出大段 AI 建议，只做解析、预填和补充信息提示。
- v1 不做连续多轮复杂对话、语音创建、图片识别创建、自动读取微信或短信。

### 7.4 日程详情页

日程详情页是 AI 价值展示的核心页面。它不是普通信息详情页，而是 AI 行动方案页。

页面结构：

- 基础信息：展示标题、时间、地点、类型，并提供编辑入口。
- AI 总结卡：用一段简洁文字说明本次日程的整体行动建议。
- 时间规划卡：展示准备、出门、到达、开始等关键时间节点。
- 准备清单卡：列出可勾选的准备事项，并同步到今日页。
- 风险提醒卡：提示天气、迟到、材料遗漏、运动不适等风险。
- 个性建议卡：根据场景输出穿搭、饮食、话题、运动强度、学习节奏等建议。

核心交互：

- 修改日程基础信息后，提示是否重新生成建议。
- 勾选准备清单后，同步更新今日页待准备事项。
- 支持刷新 AI 建议。
- 支持删除、收藏或标记不需要的单条建议。
- AI 生成失败时展示重试按钮和兜底建议。

生成中状态：

- 展示“正在为你整理行动方案”。
- 分步骤提示正在分析时间、地点、日程类型和用户偏好。
- 避免只显示普通加载圈，让等待过程更有产品感。

### 7.5 我的页

我的页是个人偏好中心，用来让 AI 建议更贴近用户。v1 不做复杂账号体系，重点是人格与行动风格、生活偏好和基础设置。

页面结构：

- 人格与行动风格：MBTI 人格、AI 建议方式、提醒方式、计划颗粒度。
- 生活偏好：饮食、运动、穿搭、出行偏好。
- 基础设置：通知设置、天气提醒、隐私说明、关于应用。

人格与行动风格：

- MBTI 人格：支持选择 INFP、ENFP、INTJ、ENTJ 等 16 型，也支持“不确定”。
- AI 建议方式：给我一个最佳方案、给我 2-3 个选择、给我完整分析。
- 提醒方式：少量提醒、标准提醒、多次提醒。
- 计划颗粒度：只看重点、普通计划、详细步骤。

设计原则：

- MBTI 只作为建议风格参考，不做刻板判断。
- 行动偏好决定具体提醒频率、建议数量和计划详细程度。
- 对容易纠结的用户，AI 应减少选项并给出更明确推荐。
- 对喜欢掌控细节的用户，AI 可提供更完整分析和备选方案。
- 对需要多次提醒的用户，App 应拆出准备节点并在关键时间多次提醒。

生活偏好：

- 饮食偏好影响餐厅、早餐、运动前饮食建议。
- 运动偏好影响运动类型、强度和恢复建议。
- 穿搭偏好影响约会、会议、出行等场景的穿搭建议。
- 出行偏好影响路线时间、出门提醒和缓冲时间。

## 8. 数据结构和 AI 输出格式

v1 的数据设计目标是简单、稳定、方便页面渲染。日程是主对象，AI 行动方案和用户偏好围绕日程工作。

### 8.1 日程数据

```ts
type Schedule = {
  id: string
  title: string
  startAt: string
  endAt?: string
  location?: string
  category: ScheduleCategory
  note?: string
  source: "manual" | "ai_chat"
  status: "upcoming" | "completed" | "cancelled"
  aiPlanId?: string
  createdAt: string
  updatedAt: string
}

type ScheduleCategory =
  | "dating_social"
  | "health_fitness"
  | "work_study"
  | "travel_errand"
  | "other"
```

说明：

- `source` 用来区分手动创建和 AI 聊天创建。
- `category` 使用英文枚举存储，页面展示时再转换成中文。
- `aiPlanId` 用来关联该日程对应的 AI 行动方案。

### 8.2 AI 行动方案数据

```ts
type AIPlan = {
  id: string
  scheduleId: string
  summary: string
  confidence: "low" | "medium" | "high"
  timeline: TimelineItem[]
  checklist: ChecklistItem[]
  risks: RiskItem[]
  suggestions: SuggestionItem[]
  followUp?: FollowUpItem[]
  generatedAt: string
  modelVersion?: string
}
```

AI 行动方案主要服务日程详情页，同时为今日页提供待准备事项、时间轴节点和风险提醒。

```ts
type TimelineItem = {
  id: string
  time: string
  title: string
  description?: string
  type: "preparation" | "departure" | "event" | "follow_up"
}

type ChecklistItem = {
  id: string
  title: string
  reason?: string
  done: boolean
  priority: "low" | "medium" | "high"
}

type RiskItem = {
  id: string
  title: string
  detail: string
  level: "low" | "medium" | "high"
  action?: string
}

type SuggestionItem = {
  id: string
  type:
    | "outfit"
    | "food"
    | "topic"
    | "route"
    | "study"
    | "meeting"
    | "exercise"
    | "general"
  title: string
  content: string
  options?: string[]
}

type FollowUpItem = {
  id: string
  title: string
  description?: string
}
```

### 8.3 用户偏好数据

```ts
type UserPreference = {
  mbti?: MBTIType | "unknown"
  adviceStyle: "best_one" | "two_or_three_options" | "full_analysis"
  reminderStyle: "light" | "standard" | "repeated"
  planDetailLevel: "brief" | "normal" | "detailed"

  diet?: {
    taste?: "light" | "medium_spicy" | "heavy_spicy"
    avoid?: string[]
    budget?: "economy" | "moderate" | "flexible"
  }

  exercise?: {
    preferredTypes?: string[]
    intensity?: "light" | "moderate" | "high"
  }

  outfit?: {
    style?: "minimal" | "casual" | "commute" | "colorful"
    colorPreference?: "light" | "dark" | "neutral" | "colorful"
  }

  commute?: {
    preferredMethod?: "walk" | "bike" | "subway" | "taxi" | "drive"
    defaultBufferMinutes?: number
  }
}

type MBTIType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP"
```

用户偏好影响 AI 建议方式：

- `mbti` 影响表达风格和建议呈现方式，但不做刻板判断。
- `adviceStyle` 决定是给最佳方案、少量选项还是完整分析。
- `reminderStyle` 决定提醒频率和准备节点拆分程度。
- `planDetailLevel` 决定 AI 行动方案的详细程度。
- 生活偏好影响饮食、运动、穿搭、出行等具体建议。

### 8.4 AI 聊天创建日程输出

AI 聊天创建只负责解析自然语言并生成草稿，不直接创建最终日程。用户必须确认或调整后才保存。

```ts
type ParsedScheduleDraft = {
  title: string
  startAt?: string
  endAt?: string
  location?: string
  category: ScheduleCategory
  note?: string
  missingFields: string[]
  confidence: "low" | "medium" | "high"
}
```

示例：

```json
{
  "title": "和小雨约会",
  "startAt": "2026-07-15T15:00:00+08:00",
  "endAt": "2026-07-15T17:00:00+08:00",
  "location": "万象城",
  "category": "dating_social",
  "note": "想吃日料，预算 200 左右",
  "missingFields": [],
  "confidence": "high"
}
```

如果信息不足，AI 应明确返回缺失字段：

```json
{
  "title": "和朋友吃饭",
  "category": "dating_social",
  "missingFields": ["startAt", "location"],
  "confidence": "medium"
}
```

### 8.5 AI 生成行动方案输入

```ts
type GeneratePlanRequest = {
  schedule: Schedule
  userPreference: UserPreference
  context?: {
    currentTime: string
    weather?: {
      condition: string
      temperature: number
      precipitationChance?: number
    }
  }
}
```

说明：

- `schedule` 提供日程基础信息。
- `userPreference` 提供人格、行动风格和生活偏好。
- `context` 提供当前时间和可选天气信息。
- 如果没有天气、路线或商家数据，AI 不应编造具体信息。

### 8.6 AI 生成行动方案输出

```ts
type GeneratePlanResponse = {
  summary: string
  timeline: Omit<TimelineItem, "id">[]
  checklist: Omit<ChecklistItem, "id" | "done">[]
  risks: Omit<RiskItem, "id">[]
  suggestions: Omit<SuggestionItem, "id">[]
  followUp?: Omit<FollowUpItem, "id">[]
}
```

输出要求：

- 必须返回 JSON，不返回 Markdown。
- `summary` 控制在 80 字以内。
- `checklist` 建议 3-6 条。
- `risks` 建议 0-3 条。
- `suggestions` 建议 2-5 条。
- 数组数量和表达方式应受用户偏好影响。
- 信息不足时给出保守建议，不编造具体商家、天气或路线。

示例：

```json
{
  "summary": "这次约会适合选择安静、方便聊天的环境。建议提前 40 分钟出门，并准备一个轻松话题。",
  "timeline": [
    {
      "time": "14:00",
      "title": "开始准备",
      "description": "检查穿搭、手机电量和路线。",
      "type": "preparation"
    },
    {
      "time": "14:20",
      "title": "出门",
      "description": "预留 15 分钟缓冲时间。",
      "type": "departure"
    }
  ],
  "checklist": [
    {
      "title": "提前确认餐厅位置",
      "reason": "避免临时找路影响节奏。",
      "priority": "medium"
    },
    {
      "title": "手机充满电",
      "reason": "方便联系和导航。",
      "priority": "high"
    }
  ],
  "risks": [
    {
      "title": "可能需要等待",
      "detail": "热门餐厅在晚餐时段可能排队。",
      "level": "medium",
      "action": "建议提前预约，或准备一个备选地点。"
    }
  ],
  "suggestions": [
    {
      "type": "outfit",
      "title": "穿搭建议",
      "content": "选择干净、清爽、不过度正式的搭配。"
    },
    {
      "type": "topic",
      "title": "话题建议",
      "content": "可以从最近看的电影、周末计划或共同兴趣开始。"
    }
  ]
}
```

### 8.7 页面数据映射

- 今日页读取当天 `Schedule`，并从 `AIPlan.timeline`、`AIPlan.checklist`、`AIPlan.risks` 生成今日摘要、待准备事项和时间轴。
- 日历页读取 `Schedule.startAt` 和 `AIPlan.risks`，生成日期状态点和日程列表。
- 添加日程页使用 `ParsedScheduleDraft` 展示 AI 解析结果，用户确认后保存为 `Schedule`。
- 日程详情页读取 `Schedule` 和 `AIPlan`，展示基础信息、行动方案、准备清单、风险提醒和个性建议。
- 我的页编辑 `UserPreference`，后续生成或刷新 AI 行动方案时使用最新偏好。

## 9. 技术栈与项目结构

### 9.1 技术栈定稿

本项目明确做移动端 App，不做网站。技术栈采用 Expo 生态，开发阶段可用 Expo Go 或模拟器预览，后续可通过 EAS Build 打包 Android APK/AAB。

| 层级 | 技术选择 | 说明 |
| --- | --- | --- |
| App 框架 | Expo + React Native + TypeScript | 用于构建真实移动端 App，不是 Web 网站 |
| 路由 | Expo Router | 支持底部 Tab、详情页和嵌套路由 |
| 本地数据 | expo-sqlite | 存储日程、AI 行动方案和用户偏好 |
| 状态管理 | Zustand | 管理页面状态、日程状态和偏好状态 |
| 通知提醒 | expo-notifications | 支持本地提醒和多次提醒策略 |
| AI 服务 | mockAIClient / aiClient 可切换 | 默认可离线演示，配置真实接口后可调用 AI |
| 表单校验 | react-hook-form + zod | 用于日程创建、AI 草稿确认和偏好设置 |
| 时间处理 | date-fns | 用于日历、时间轴和提醒时间计算 |
| 动效 | react-native-reanimated | 用于轻量过渡、完成反馈和生成中状态 |
| 图标 | lucide-react-native 或 @expo/ui Icon | 保持图标风格清爽统一 |

AI API Key 不应直接硬编码在 App 中。v1 默认使用 mock AI 保证演示稳定，真实 AI 调用通过独立服务层接入，后续可切换为轻量后端代理。

### 9.2 UI 技术方案

UI 目标是简约、高级、时尚、好看，整体偏 Apple 式清爽高级风格。项目不引入重型 UI 组件库，避免模板感和 Material Design 风格偏移。

推荐 UI 组合：

- 使用 `@expo/ui` 承载部分原生控件能力，例如日期选择、选择器、分段控件、开关、菜单、图标等。
- 使用 `expo-blur` 和 `expo-linear-gradient` 做克制的玻璃感、层次和 AI 摘要卡质感。
- 使用 `react-native-reanimated` 做轻量动效，例如添加成功、建议生成、勾选完成。
- 自定义 design tokens，统一颜色、字号、间距、圆角、阴影和卡片样式。
- 自研少量基础组件和业务组件，保证视觉一致性。

设计 tokens 建议：

```ts
type ThemeTokens = {
  colors: {
    background: string
    surface: string
    primary: string
    textPrimary: string
    textSecondary: string
    success: string
    warning: string
    border: string
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  radius: {
    sm: number
    md: number
    lg: number
  }
  typography: {
    title: TextStyle
    headline: TextStyle
    body: TextStyle
    caption: TextStyle
  }
}
```

核心组件建议：

- `Screen`：统一页面安全区、背景和横向间距。
- `SectionHeader`：统一分组标题。
- `Card`：用于 AI 摘要、日程卡片和建议卡片。
- `ListRow`：用于设置项和偏好项。
- `PrimaryButton`：用于保存、确认创建、生成建议等主操作。
- `SegmentedTabs`：用于 AI 创建/手动填写、建议方式选择等。
- `AIInsightCard`：用于今日摘要和日程详情总结。
- `TimelineItem`：用于今日页和详情页时间规划。
- `ChecklistRow`：用于准备清单勾选。
- `PreferenceRow`：用于我的页偏好设置。

视觉原则：

- 页面优先清晰，其次精致，避免过度装饰。
- 留白充足，信息分组明确。
- 卡片轻薄，圆角克制，不做厚重阴影。
- 主色低饱和，风险使用柔和橙色，完成状态使用绿色。
- AI 相关区域可以有轻微玻璃感或柔和渐变，但不使用强烈科技风。

### 9.3 项目结构建议

```text
APP/
  app/
    (tabs)/
      today.tsx
      calendar.tsx
      create.tsx
      profile.tsx
    schedule/
      [id].tsx
    _layout.tsx

  src/
    components/
      common/
      schedule/
      ai/
      profile/

    features/
      today/
      calendar/
      create-schedule/
      schedule-detail/
      profile/

    services/
      ai/
        aiClient.ts
        mockAIClient.ts
        schemas.ts
      storage/
        database.ts
        scheduleRepository.ts
        preferenceRepository.ts
      notifications/
        reminderService.ts

    stores/
      scheduleStore.ts
      preferenceStore.ts

    theme/
      colors.ts
      spacing.ts
      radius.ts
      typography.ts

    types/
      schedule.ts
      ai.ts
      preference.ts

    utils/
      date.ts
      id.ts
```

结构原则：

- `app/` 只放路由页面和页面入口。
- `src/features/` 放具体业务页面逻辑。
- `src/components/` 放可复用 UI 和业务组件。
- `src/services/ai/` 隔离 AI 调用，页面不直接请求模型。
- `src/services/storage/` 隔离 SQLite 读写。
- `src/stores/` 管理跨页面状态。
- `src/theme/` 管理 Apple 风格设计 tokens。

## 10. v1.0 面试全功能范围

v1.0 的目标不是缩水 Demo，而是可在面试中完整展示产品闭环的移动 App。用户应能从创建日程、获得 AI 行动方案、查看今日准备、接收提醒、调整个人偏好这一整条链路完整体验产品价值。

### 10.1 v1.0 必须完成

- 今日页：AI 今日摘要、待准备事项、今日时间轴、完成状态。
- 日历页：月视图、日期状态点、选中日期日程列表。
- 添加日程页：AI 聊天创建、AI 解析草稿、手动调整、手动填写。
- 日程详情页：AI 行动方案、时间规划、准备清单、风险提醒、个性建议、刷新建议。
- 我的页：MBTI、建议方式、提醒方式、计划颗粒度、饮食偏好、运动偏好、穿搭偏好、出行偏好。
- 本地存储：日程、AI 行动方案、用户偏好保存到 `expo-sqlite`。
- 通知提醒：根据提醒方式生成本地通知，支持少量提醒、标准提醒和多次提醒。
- AI 服务层：默认使用 `mockAIClient` 保证稳定演示，同时保留 `aiClient` 接真实 AI 的能力。
- 视觉系统：完成 Apple 式清爽高级风格的 design tokens 和核心组件。
- 动效系统：关键路径具备高级、轻量、流畅的过渡和反馈。

### 10.2 v1.0 可用 mock 或预设数据完成

以下能力可以先通过 mock 或预设数据完成，以保证主产品闭环稳定：

- 天气数据。
- 餐厅或地点推荐。
- 路线和通勤时间。
- 真实 AI 返回内容。

这些能力的 UI 和数据接口应预留，但不要求 v1.0 必须接入真实第三方 API。

### 10.3 v1.0 不进入范围

- 多人协作。
- 社交分享。
- 复杂账号体系。
- 地图实时导航。
- 系统日历双向同步。
- 自动读取短信、微信或邮件。
- 未经用户确认直接创建日程。

## 11. 高级动效系统

高级动效是 v1.0 的正式体验模块，不作为最后阶段的附加装饰。动效应服务于状态变化、操作反馈和 AI 智能感，让 App 显得简约、高级、时尚、流畅。

### 11.1 技术选择

- `react-native-reanimated`：核心动效和页面内过渡。
- `expo-haptics`：选择、确认、完成等关键操作的触感反馈。
- `expo-blur`：轻量玻璃质感。
- `expo-linear-gradient`：AI 卡片、摘要区域和 loading 质感。

### 11.2 关键动效场景

| 场景 | 动效设计 |
| --- | --- |
| App 启动 | 页面柔和淡入，今日摘要卡轻微上浮 |
| Tab 切换 | 内容轻微滑入并伴随透明度过渡 |
| 今日摘要卡 | AI 摘要生成时使用 shimmer 或 breathing loading |
| 待准备事项 | 勾选时轻微缩放、划线、绿色完成反馈 |
| 今日时间轴 | 时间节点按顺序 stagger 出现 |
| AI 聊天创建 | 输入内容解析后，聊天卡片展开成结构化草稿 |
| 确认创建 | 草稿卡片过渡进入日程详情 |
| AI 生成方案 | 展示分步骤生成进度，不使用普通转圈作为唯一反馈 |
| 建议卡片 | 生成完成后逐张淡入上浮 |
| 日历月份切换 | 月视图左右滑动切换 |
| 日期选择 | 选中日期圆点轻微弹性缩放 |
| 我的页偏好选择 | 切换 MBTI、提醒方式、建议方式时有轻微触感反馈 |
| 通知策略预览 | 修改提醒方式后，提醒节点预览自然展开 |

### 11.3 动效原则

- 快：大部分动效控制在 180-280ms。
- 轻：避免夸张弹跳、旋转和炫技转场。
- 稳：动效不阻碍用户继续操作。
- 清晰：只在状态变化、层级变化和任务完成时动。
- 高级：优先使用透明度、轻位移、轻缩放、模糊和柔和渐变。
- 一致：相似操作使用相似动效，不让 App 显得杂乱。

### 11.4 动效验收标准

面试演示时，以下路径必须有流畅动效和触感反馈：

1. 添加日程：AI 聊天解析到结构化草稿。
2. 生成建议：AI 行动方案分步骤生成并展示建议卡片。
3. 今日页：待准备事项勾选完成。
4. 日历页：月份切换和日期选择。
5. 我的页：MBTI 和行动偏好切换。

## 12. v1.0 开发里程碑

### 12.1 阶段一：项目骨架和设计系统

- 创建 Expo + TypeScript + Expo Router 项目。
- 配置底部 Tab 和日程详情路由。
- 建立 `src/theme` design tokens。
- 实现基础组件：`Screen`、`Card`、`ListRow`、`PrimaryButton`、`SegmentedTabs`。
- 接入基础动效和触感反馈能力。

### 12.2 阶段二：数据层和状态管理

- 建立 SQLite 表结构。
- 实现 schedule、AIPlan、preference repository。
- 建立 Zustand stores。
- 完成 mock 初始数据和本地持久化。

### 12.3 阶段三：AI 服务层

- 实现 `mockAIClient`。
- 定义 `aiClient` 接口。
- 实现自然语言解析日程草稿。
- 实现 AI 行动方案生成。
- 加入 JSON schema 校验和错误兜底。

### 12.4 阶段四：核心页面

- 实现今日页。
- 实现日历页。
- 实现添加日程页双模式。
- 实现日程详情页。
- 实现我的页偏好设置。

### 12.5 阶段五：通知和个性化策略

- 根据 `reminderStyle` 生成本地提醒计划。
- 将 MBTI、建议方式、提醒方式和计划颗粒度接入 mock AI 输出逻辑。
- 在今日页和详情页展示个性化结果。

### 12.6 阶段六：视觉和动效打磨

- 完成 Apple 式清爽高级视觉统一。
- 完成关键动效验收路径。
- 完成空状态、加载状态、错误状态。
- 检查小屏设备的文字换行和布局稳定性。

### 12.7 阶段七：面试演示准备

- 准备 3-4 组高质量演示日程。
- 准备不同 MBTI 和行动偏好的演示效果。
- 准备 mock AI 与真实 AI 可切换说明。
- 打包 Android APK 或准备 Expo Go 演示流程。

## 13. 下一步

产品方向已经确认。下一步应继续细化：

1. 页面组件拆分和状态管理方案。
2. SQLite 表结构和 repository 接口。
3. mock AI 策略和演示数据。
