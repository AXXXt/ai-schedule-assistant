import type { UserPreference } from "@/types/preference";
import type { AIPlan, TimelineItem } from "@/types/ai";

/**
 * 提醒计划中的单条提醒项。
 * 基于 AI 方案中的时间线节点生成。
 */
export type ReminderEntry = {
  /** 唯一标识 */
  id: string;
  /** 关联的日程 ID */
  scheduleId: string;
  /** 关联的 AI 方案 ID */
  planId: string;
  /** 日程标题 */
  scheduleTitle: string;
  /** 提醒标题 */
  title: string;
  /** 提醒描述 */
  description?: string;
  /** 触发时间 (ISO 8601) */
  triggerAt: string;
  /** 提醒类型：准备/出发/事件开始/跟进 */
  type: TimelineItem["type"];
  /** 优先级 */
  priority: "low" | "medium" | "high";
};

/**
 * 提醒策略配置。
 * 根据 reminderStyle 生成不同的提醒时间点和数量。
 */
type ReminderConfig = {
  /** 事件前多少分钟的提醒节点 */
  offsetsMinutes: number[];
  /** 是否包含跟进提醒 */
  includeFollowUp: boolean;
  /** 提醒描述的详细程度 */
  descriptionDetail: "minimal" | "normal" | "verbose";
};

/**
 * 根据用户偏好中的 reminderStyle 获取提醒策略配置。
 */
function getReminderConfig(style: UserPreference["reminderStyle"]): ReminderConfig {
  switch (style) {
    case "light":
      return {
        offsetsMinutes: [15],
        includeFollowUp: false,
        descriptionDetail: "minimal",
      };
    case "repeated":
      return {
        offsetsMinutes: [60, 30, 10],
        includeFollowUp: true,
        descriptionDetail: "verbose",
      };
    case "standard":
    default:
      return {
        offsetsMinutes: [30, 10],
        includeFollowUp: false,
        descriptionDetail: "normal",
      };
  }
}

/**
 * 解析时间字符串 "HH:mm" 为分钟数。
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * ISO 日期字符串 -> 当天 "HH:mm" 部分转为分钟。
 */
function isoToDayMinutes(iso: string): number {
  const t = iso.slice(11, 16);
  return timeToMinutes(t);
}

/**
 * ISO 日期字符串 + 分钟偏移 -> 新的 ISO 字符串。
 */
function isoWithOffset(iso: string, offsetMinutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString();
}

/**
 * 从 ISO 字符串中提取当天日期 (YYYY-MM-DD)。
 */
function isoDatePart(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * 基于 AI 行动方案和用户偏好生成提醒计划。
 *
 * 逻辑：
 * 1. 根据 reminderStyle 确定提醒时间偏移和数量。
 * 2. 扫描 AI 方案中的时间线节点。
 * 3. 为每个需要提醒的节点（departure / event）生成提醒入口。
 * 4. 如果有 followUp 节点，根据策略决定是否生成跟进提醒。
 */
function timelineTimeToISO(timelineHHmm: string, isoDateStr: string): string {
  return isoDateStr.slice(0, 10) + "T" + timelineHHmm + ":00+08:00";
}

export function generateReminders(
  plan: AIPlan,
  scheduleTitle: string,
  scheduleStartAt: string,
  preference: UserPreference
): ReminderEntry[] {
  const config = getReminderConfig(preference.reminderStyle);
  const reminders: ReminderEntry[] = [];
  let autoId = 0;

  const datePart = scheduleStartAt.slice(0, 10);

  const pushReminder = (
    timeNode: TimelineItem,
    baseTime: string,
    offsetMinutes: number,
    label: string
  ) => {
    const triggerAt = isoWithOffset(baseTime, -offsetMinutes);
    const desc =
      config.descriptionDetail === "minimal"
        ? undefined
        : config.descriptionDetail === "verbose"
        ? `日程「${scheduleTitle}」将在 ${offsetMinutes} 分钟后开始，${timeNode.description ?? "请提前准备。"}`
        : timeNode.description;

    reminders.push({
      id: `rem-${plan.id}-${autoId++}`,
      scheduleId: plan.scheduleId,
      planId: plan.id,
      scheduleTitle,
      title: label,
      description: desc,
      triggerAt,
      type: timeNode.type,
      priority: offsetMinutes <= 30 ? "high" : offsetMinutes <= 60 ? "medium" : "low",
    });
  };

  for (const node of plan.timeline) {
    if (node.type === "event") {
      // 为事件节点生成提醒：在事件开始前按 offsetsMinutes 生成
      for (const offset of config.offsetsMinutes) {
        pushReminder(node, scheduleStartAt, offset, `即将开始：${scheduleTitle}`);
      }
    } else if (node.type === "departure") {
      // 出发提醒锚定在时间线的实际出发时间
      const departureBase = timelineTimeToISO(node.time, scheduleStartAt);
      const departureOffset = config.offsetsMinutes[config.offsetsMinutes.length - 1] ?? 10;
      pushReminder(node, departureBase, departureOffset, `出发提醒：${scheduleTitle}`);
    }
  }

  // 跟进提醒
  if (config.includeFollowUp && plan.followUp && plan.followUp.length > 0) {
    for (const fu of plan.followUp) {
      reminders.push({
        id: `rem-${plan.id}-${autoId++}`,
        scheduleId: plan.scheduleId,
        planId: plan.id,
        scheduleTitle,
        title: fu.title,
        description: fu.description ?? "别忘了复盘和记录。",
        triggerAt: isoWithOffset(scheduleStartAt, 30), // 事件结束后 30 分钟
        type: "follow_up",
        priority: "low",
      });
    }
  }

  return reminders;
}

/**
 * 获取当前时间之后、今天之内的提醒列表。
 */
export function getUpcomingReminders(
  reminders: ReminderEntry[],
  now: Date = new Date()
): ReminderEntry[] {
  const nowISO = now.toISOString();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const todayEndISO = todayEnd.toISOString();

  return reminders
    .filter((r) => r.triggerAt > nowISO && r.triggerAt <= todayEndISO)
    .sort((a, b) => a.triggerAt.localeCompare(b.triggerAt));
}

/**
 * 计算下一个即将到来的提醒。
 */
export function getNextReminder(
  reminders: ReminderEntry[],
  now: Date = new Date()
): ReminderEntry | null {
  const upcoming = getUpcomingReminders(reminders, now);
  return upcoming.length > 0 ? upcoming[0]! : null;
}

/**
 * 格式化提醒时间为可读字符串。
 */
export function formatReminderTime(triggerAt: string): string {
  const d = new Date(triggerAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= 0) return "现在";
  if (diffMin < 60) return `${diffMin} 分钟后`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `${hours} 小时 ${mins} 分钟后` : `${hours} 小时后`;
}
