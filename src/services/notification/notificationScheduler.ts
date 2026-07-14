import { Alert, Platform } from "react-native";
import type { ReminderEntry } from "./reminderService";

export interface NotificationScheduler {
  scheduleAll(reminders: ReminderEntry[]): Promise<void>;
  cancelAll(): Promise<void>;
  cancelForSchedule(scheduleId: string): Promise<void>;
  scheduleImmediate(title: string, body: string): Promise<void>;
}

/**
 * 通知调度器。
 * dev build → expo-notifications（系统通知栏推送，像微信一样）
 * Expo Go → Alert 降级
 */
export async function createNotificationScheduler(): Promise<NotificationScheduler> {
  // 尝试加载 expo-notifications（仅 dev build 可用）
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require("expo-notifications");

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("[Scheduler] 通知权限未授予，降级 Alert");
      return createAlertScheduler();
    }

    // Android 通知渠道注册
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "日程提醒",
        importance: Notifications.AndroidImportance.HIGH,
        
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0891B2",
      });
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
                shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return {
      async scheduleImmediate(title, body) {
        await Notifications.scheduleNotificationAsync({
          content: { title, body,  },
          trigger: null,
        });
      },
      async scheduleAll(reminders) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const r of reminders) {
          const d = new Date(r.triggerAt);
          if (d.getTime() <= Date.now()) continue;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: r.title,
              body: r.description ?? "",
              data: { scheduleId: r.scheduleId, planId: r.planId, type: r.type },
              
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: d,
            },
          });
        }
      },
      async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
      },
      async cancelForSchedule(sid) {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of all) {
          if (n.content.data?.scheduleId === sid) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
          }
        }
      },
    };
  } catch (e) {
    console.warn("[Scheduler] expo-notifications 不可用，降级 Alert:", String(e).slice(0, 80));
  }

  return createAlertScheduler();
}

function createAlertScheduler(): NotificationScheduler {
  return {
    async scheduleImmediate(title, body) {
      return new Promise((resolve) => {
        Alert.alert(title, body, [{ text: "知道了", onPress: () => resolve() }]);
      });
    },
    async scheduleAll() {},
    async cancelAll() {},
    async cancelForSchedule() {},
  };
}
