import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen name="today" options={{ title: "今日", tabBarIcon: ({ color, size }) => <Ionicons color={color} name="sparkles-outline" size={size} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "日历", tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} /> }} />
      <Tabs.Screen name="create" options={{ title: "创建", tabBarIcon: ({ color, size }) => <Ionicons color={color} name="add-circle-outline" size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "我的", tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} /> }} />
    </Tabs>
  );
}
