import * as ExpoLocation from "expo-location";
import { MAP_CONFIG } from "./mapConfig";

export type LocationResult = {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  city?: string;
};

let cachedLocation: LocationResult | null = null;

export function getCachedLocation(): LocationResult | null {
  return cachedLocation;
}

export type LocationError = {
  code: number;
  message: string;
};

export async function getCurrentPosition(): Promise<LocationResult> {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  if (status !== "granted") throw { code: 1, message: "denied" };

  // 方案1: 最近已知位置（秒出，不需要GPS信号）
  const last = await ExpoLocation.getLastKnownPositionAsync();
  if (last && last.coords.accuracy && last.coords.accuracy < 1000) {
    console.log("GPS last known:", last.coords.latitude, last.coords.longitude, "acc:", last.coords.accuracy);
    // 逆地理编码获取城市
    let city = "";
    try {
      const key = MAP_CONFIG.apiKey;
      const res = await fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${last.coords.longitude},${last.coords.latitude}&extensions=base`);
      const data = await res.json() as any;
      if (data.status === "1" && data.regeocode?.addressComponent?.city) {
        city = data.regeocode.addressComponent.city;
      }
    } catch {}
    return {
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
      accuracy: last.coords.accuracy ?? undefined,
      city: city || undefined,
    };
  }

  // 方案2: watchPosition 持续监听5秒，取第一个有效位置
  try {
    const pos = await new Promise<ExpoLocation.LocationObject>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 8000);
      const sub = ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.Balanced, timeInterval: 500, distanceInterval: 1 },
        (loc) => {
          if (loc.coords.accuracy && loc.coords.accuracy < 500) {
            clearTimeout(timeout);
            sub.then((s) => s.remove());
            resolve(loc);
          }
        }
      );
      // 即使精度不够，8秒也接受第一个结果
      setTimeout(() => {
        sub.then((s) => {
          s.remove();
          reject(new Error("no fix"));
        });
      }, 8000);
    });
    console.log("GPS fix:", pos.coords.latitude, pos.coords.longitude, "acc:", pos.coords.accuracy);
    let city = "";
    try {
      const key = MAP_CONFIG.apiKey;
      const res = await fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${pos.coords.longitude},${pos.coords.latitude}&extensions=base`);
      const data = await res.json() as any;
      if (data.status === "1" && data.regeocode?.addressComponent?.city) {
        city = data.regeocode.addressComponent.city;
      }
    } catch {}
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? undefined,
      city: city || undefined,
    };
  } catch (e: any) {
    console.log("GPS watch fail:", e?.message);
  }

  // IP降级
  try {
    const key = MAP_CONFIG.apiKey;
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
    const data = await res.json() as any;
    if (data.status !== "1" || !data.rectangle) throw new Error("ip fail");
    const [sw, ne] = data.rectangle.split(";");
    const [swLng, swLat] = sw.split(",").map(Number);
    const [neLng, neLat] = ne.split(",").map(Number);
    console.log("IP locate:", data.province, data.city);
    return {
      latitude: (swLat + neLat) / 2,
      longitude: (swLng + neLng) / 2,
      address: data.province + data.city,
      city: data.city || data.province,
      accuracy: 5000,
    };
  } catch {
    throw { code: 2, message: "定位失败" } as LocationError;
  }
}

export async function requestLocation(): Promise<LocationResult> {
  if (cachedLocation) return cachedLocation;
  const loc = await getCurrentPosition();
  cachedLocation = loc;
  return loc;
}
