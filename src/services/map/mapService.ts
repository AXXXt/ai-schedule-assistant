import { MAP_CONFIG } from "./mapConfig";
import type { LocationResult } from "./locationService";

// ============================================================
// 高德地图 Web API 封装
// 文档: https://lbs.amap.com/api/webservice/summary/
// ============================================================

export type POIItem = {
  id: string;
  name: string;
  address: string;
  location: string; // "lng,lat"
  distance: number; // 米
  type: string;
  rating?: string;
  tel?: string;
};

export type WeatherInfo = {
  city: string;
  weather: string;     // 天气现象
  temperature: string;  // 温度
  wind: string;         // 风向
  humidity: string;     // 湿度
  reportTime: string;
};

export type TransitStation = {
  name: string;
  location: string;
  distance: number;
  lines: string[]; // 公交/地铁线路
};

// ============================================================
// HTTP 请求封装
// ============================================================
export async function amapGet<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!MAP_CONFIG.apiKey) {
    throw new Error("请先配置高德地图 API Key (MAP_CONFIG.apiKey)");
  }
  const url = new URL(`${MAP_CONFIG.baseURL}${path}`);
  url.searchParams.set("key", MAP_CONFIG.apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`地图服务请求失败: ${res.status}`);
  const data = await res.json() as { status: string; info: string };
  if (data.status !== "1") throw new Error(`地图API错误: ${data.info}`);
  return data as T;
}

// ============================================================
// 地理编码: 地址 → 坐标
// ============================================================
export async function geocode(address: string, city?: string): Promise<{ lng: number; lat: number; formattedAddress: string } | null> {
  try {
    const data = await amapGet<{
      geocodes: Array<{ location: string; formatted_address: string }>;
    }>("/geocode/geo", { address: city ? city + address : address, city: city || "" });

    if (!data.geocodes?.length) return null;
    const [lng, lat] = data.geocodes[0]!.location.split(",").map(Number);
    return { lng: lng!, lat: lat!, formattedAddress: data.geocodes[0]!.formatted_address };
  } catch {
    return null;
  }
}

// ============================================================
// 逆地理编码: 坐标 → 地址
// ============================================================
export async function reverseGeocode(lng: number, lat: number): Promise<string | null> {
  try {
    const data = await amapGet<{
      regeocode: { formatted_address: string };
    }>("/geocode/regeo", {
      location: `${lng},${lat}`,
      extensions: "base",
    });
    return data.regeocode?.formatted_address ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// 周边 POI 搜索（餐厅、交通站点等）
// types 参考: https://lbs.amap.com/api/webservice/download
// 050000=餐饮, 150000=交通设施, 150500=地铁站, 150700=公交站
// ============================================================
export async function searchNearbyPOI(
  location: LocationResult | { lng: number; lat: number },
  types: string,
  radius: number = 2000,
  limit: number = 10
): Promise<POIItem[]> {
  try {
    const lng = "longitude" in location ? location.longitude : location.lng;
    const lat = "latitude" in location ? location.latitude : location.lat;

    const data = await amapGet<{
      pois: Array<{
        id: string;
        name: string;
        address: string;
        location: string;
        distance: string;
        type: string;
        biz_ext?: { rating?: string };
        tel?: string;
      }>;
    }>("/place/around", {
      location: `${lng},${lat}`,
      types,
      radius: String(radius),
      offset: String(limit),
      sortrule: "distance",
    });

    return (data.pois ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      location: p.location,
      distance: parseInt(p.distance, 10),
      type: p.type,
      rating: p.biz_ext?.rating,
      tel: p.tel,
    }));
  } catch {
    return [];
  }
}

// ============================================================
// 搜索附近餐厅
// ============================================================
export async function searchNearbyRestaurants(
  location: LocationResult | { lng: number; lat: number },
  radius: number = 2000,
  limit: number = 8
): Promise<POIItem[]> {
  return searchNearbyPOI(location, "050000", radius, limit);
}

// ============================================================
// 搜索附近交通站点（地铁站 + 公交站）
// ============================================================

// ============================================================
// 关键词搜索POI（用户提到具体店名时调用）
// ============================================================
export async function searchPOIByKeyword(keyword: string, city?: string, location?: { lng: number; lat: number }, limit: number = 5): Promise<POIItem[]> {
  try {
    const params: Record<string, string> = { keywords: keyword, offset: String(limit) };
    if (city) params.city = city;
    if (location) params.location = location.lng + "," + location.lat;
    const data = await amapGet<{
      pois: Array<{ id: string; name: string; address: string; location: string; distance: string; type: string; biz_ext?: { rating?: string }; tel?: string }>;
    }>("/place/text", params);
    return (data.pois ?? []).map((p) => ({ id: p.id, name: p.name, address: p.address, location: p.location, distance: parseInt(p.distance, 10), type: p.type, rating: p.biz_ext?.rating, tel: p.tel }));
  } catch { return []; }
}
export async function searchNearbyTransitStations(
  location: LocationResult | { lng: number; lat: number },
  radius: number = 1000
): Promise<TransitStation[]> {
  try {
    // 搜索地铁站 (150500) + 公交站 (150700)
    const stations = await searchNearbyPOI(location, "150500|150700", radius, 6);
    return stations.map((s) => ({
      name: s.name,
      location: s.location,
      distance: s.distance,
      lines: [], // 高德周边搜索不直接返回线路，需要额外查询
    }));
  } catch {
    return [];
  }
}

// ============================================================
// 获取天气信息
// ============================================================
export async function getWeather(cityCode?: string): Promise<WeatherInfo | null> {
  try {
    const params: Record<string, string> = { extensions: "base" };
    if (cityCode) {
      params.city = cityCode;
    } else {
      // 没有城市编码时，用 IP 定位获取天气（高德会自动处理）
      params.city = "auto";
    }

    const data = await amapGet<{
      lives: Array<{
        city: string;
        weather: string;
        temperature: string;
        winddirection: string;
        humidity: string;
        reporttime: string;
      }>;
    }>("/weather/weatherInfo", params);

    if (!data.lives?.length) return null;
    const w = data.lives[0]!;
    return {
      city: w.city,
      weather: w.weather,
      temperature: w.temperature,
      wind: w.winddirection,
      humidity: w.humidity,
      reportTime: w.reporttime,
    };
  } catch {
    return null;
  }
}

// ============================================================
// 综合上下文构建: 给 AI 提供位置相关的全部信息
// ============================================================
export type LocationContext = {
  userLocation?: { lat: number; lng: number; address: string };
  eventLocation?: { lat: number; lng: number; address: string };
  nearbyRestaurants: POIItem[];
  nearbyTransit: TransitStation[];
  weather?: WeatherInfo;
};

/**
 * 基于日程地点构建完整的 AI 上下文
 */
export async function buildLocationContext(
  userLocation?: LocationResult,
  eventAddress?: string
): Promise<LocationContext> {
  const context: LocationContext = {
    nearbyRestaurants: [],
    nearbyTransit: [],
  };

  // 逆地理编码用户位置
  if (userLocation) {
    const addr = await reverseGeocode(userLocation.longitude, userLocation.latitude);
    context.userLocation = {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      address: addr ?? "未知位置",
    };
  }

  // 地理编码事件地点 → 坐标
  let eventCoord: { lng: number; lat: number } | null = null;
  if (eventAddress) {
    const geoResult = await geocode(eventAddress);
    if (geoResult) {
      eventCoord = { lng: geoResult.lng, lat: geoResult.lat };
      context.eventLocation = {
        lat: geoResult.lat,
        lng: geoResult.lng,
        address: geoResult.formattedAddress,
      };
    }
  }

  // 以事件地点为中心搜索周边
  const searchCenter = eventCoord ?? (userLocation ? { lng: userLocation.longitude, lat: userLocation.latitude } : null);
  if (searchCenter) {
    const [restaurants, transit, weather] = await Promise.all([
      searchNearbyRestaurants(searchCenter).catch(() => []),
      searchNearbyTransitStations(searchCenter).catch(() => []),
      getWeather().catch(() => null),
    ]);
    context.nearbyRestaurants = restaurants;
    context.nearbyTransit = transit;
    context.weather = weather ?? undefined;
  }

  return context;
}

/**
 * 将位置上下文格式化为 AI 友好的文本
 */
export function formatLocationContextForAI(context: LocationContext): string {
  const parts: string[] = [];

  if (context.eventLocation) {
    parts.push(`【日程地点】${context.eventLocation.address}`);
  }
  if (context.userLocation) {
    parts.push(`【用户位置】${context.userLocation.address}`);
  }
  if (context.weather) {
    parts.push(`【天气】${context.weather.weather}，${context.weather.temperature}℃，${context.weather.wind}`);
  }
  if (context.nearbyRestaurants.length > 0) {
    const list = context.nearbyRestaurants
      .slice(0, 5)
      .map((r) => `- ${r.name}（${r.address}，约${Math.round(r.distance / 100) * 100}m${r.rating ? `，评分${r.rating}` : ""}）`)
      .join("\n");
    parts.push(`【附近餐厅】\n${list}`);
  }
  if (context.nearbyTransit.length > 0) {
    const list = context.nearbyTransit
      .slice(0, 5)
      .map((s) => `- ${s.name}（约${Math.round(s.distance / 100) * 100}m）`)
      .join("\n");
    parts.push(`【附近交通】\n${list}`);
  }

  return parts.join("\n\n");
}
