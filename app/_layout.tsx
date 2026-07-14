import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";

import { StoreProvider } from "@/stores/StoreProvider";
import { requestLocation } from "@/services/map";
import { createRepositories } from "@/stores/createRepositories";

export default function RootLayout() {
  const depsRef = useRef<ReturnType<typeof createRepositories> | null>(null);
  if (!depsRef.current) {
    depsRef.current = createRepositories();
  }
  const deps = depsRef.current;

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 启动时立即获取定位
    requestLocation().then((loc) => {
      console.log("APP START - GPS:", loc.latitude, loc.longitude, "city:", loc.city);
    }).catch(() => {});
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const { aiClient, ...repositories } = deps;

  return (
    <StoreProvider repositories={repositories} aiClient={aiClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      {!isReady && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", zIndex: 999 }}>
          <ActivityIndicator size="large" color="#0891B2" />
          <Text style={{ marginTop: 12, fontSize: 16, color: "#475569" }}>正在初始化...</Text>
        </View>
      )}
    </StoreProvider>
  );
}
