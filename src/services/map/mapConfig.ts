// 高德地图 Web API 配置
// 免费注册获取 Key: https://lbs.amap.com/api/webservice/guide/create-project/get-key
// 需要开通: Web服务 API
export const MAP_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_AMAP_API_KEY ?? "",
  baseURL: "https://restapi.amap.com/v3",
};
