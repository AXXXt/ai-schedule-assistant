import { amapGet } from "./mapService";
// ============================================================
// 路线规划
// ============================================================

export type RouteInfo = {
  mode: string;
  label: string;
  distance: number;
  duration: number;
  cost: number;
  detail: string;
};

export async function planRoutes(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number }
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  // 1. 驾车
  try {
    const d = await amapGet<any>("/direction/driving", {
      origin: origin.lng + "," + origin.lat,
      destination: destination.lng + "," + destination.lat,
      strategy: "0",
    });
    if (d.route && d.route.paths && d.route.paths[0]) {
      const p = d.route.paths[0];
      routes.push({
        mode: "driving", label: "自驾",
        distance: parseInt(p.distance, 10),
        duration: parseInt(p.duration, 10),
        cost: Math.round(parseInt(p.distance, 10) / 1000 * 0.8),
        detail: "",
      });
    }
  } catch {}

  // 2. 公交
  try {
    const d = await amapGet<any>("/direction/transit/integrated", {
      origin: origin.lng + "," + origin.lat,
      destination: destination.lng + "," + destination.lat,
      city: "",
      strategy: "0",
    });
    if (d.route && d.route.transits && d.route.transits[0]) {
      const t = d.route.transits[0];
      const steps: string[] = [];
      if (t.segments) {
        for (const seg of t.segments) {
          if (seg.bus && seg.bus.buslines && seg.bus.buslines[0]) {
            steps.push(seg.bus.buslines[0].name);
          }
        }
      }
      routes.push({
        mode: "transit", label: "公交",
        distance: parseInt(t.distance || "0", 10),
        duration: parseInt(t.duration || "0", 10) || 1800,
        cost: parseInt(t.cost || "2", 10) || 2,
        detail: steps.join(" -> ") || "",
      });
    }
  } catch {}

  // 3. 骑行
  try {
    const d = await amapGet<any>("/direction/bicycling", {
      origin: origin.lng + "," + origin.lat,
      destination: destination.lng + "," + destination.lat,
    });
    if (d.route && d.route.paths && d.route.paths[0]) {
      const p = d.route.paths[0];
      routes.push({
        mode: "biking", label: "骑行",
        distance: parseInt(p.distance, 10),
        duration: parseInt(p.duration, 10),
        cost: 0,
        detail: "",
      });
    }
  } catch {}

  // 4. 打车（按驾车距离估算）
  const drive = routes.find(function(r) { return r.mode === "driving"; });
  if (drive) {
    const km = drive.distance / 1000;
    const taxiCost = km <= 2 ? 8 : Math.round(8 + (km - 2) * 2.2);
    routes.push({
      mode: "taxi", label: "打车",
      distance: drive.distance,
      duration: Math.round(drive.duration * 0.85),
      cost: taxiCost,
      detail: "",
    });
  }

  return routes;
}

export function formatRouteForAI(r: RouteInfo): string {
  const min = Math.round(r.duration / 60);
  const km = (r.distance / 1000).toFixed(1);
  return r.mode + ": " + min + "分钟 " + km + "km " + (r.cost > 0 ? "约" + r.cost + "元" : "免费");
}
