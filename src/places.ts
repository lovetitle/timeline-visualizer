import type { GeoPoint } from './types';
import { haversineKm } from './geo';

interface City {
  nameZh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}

const CITIES: City[] = [
  { nameZh: '台北', nameEn: 'Taipei', latitude: 25.033, longitude: 121.565 },
  { nameZh: '新北', nameEn: 'New Taipei', latitude: 25.0169, longitude: 121.463 },
  { nameZh: '桃園', nameEn: 'Taoyuan', latitude: 24.993, longitude: 121.301 },
  { nameZh: '台中', nameEn: 'Taichung', latitude: 24.1477, longitude: 120.6736 },
  { nameZh: '台南', nameEn: 'Tainan', latitude: 22.9997, longitude: 120.227 },
  { nameZh: '高雄', nameEn: 'Kaohsiung', latitude: 22.6273, longitude: 120.3014 },
  { nameZh: '東京', nameEn: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { nameZh: '大阪', nameEn: 'Osaka', latitude: 34.6937, longitude: 135.5023 },
  { nameZh: '首爾', nameEn: 'Seoul', latitude: 37.5665, longitude: 126.978 },
  { nameZh: '釜山', nameEn: 'Busan', latitude: 35.1796, longitude: 129.0756 },
  { nameZh: '香港', nameEn: 'Hong Kong', latitude: 22.3193, longitude: 114.1694 },
  { nameZh: '新加坡', nameEn: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { nameZh: '曼谷', nameEn: 'Bangkok', latitude: 13.7563, longitude: 100.5018 },
  { nameZh: '上海', nameEn: 'Shanghai', latitude: 31.2304, longitude: 121.4737 },
  { nameZh: '北京', nameEn: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
  { nameZh: '倫敦', nameEn: 'London', latitude: 51.5074, longitude: -0.1278 },
  { nameZh: '巴黎', nameEn: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { nameZh: '紐約', nameEn: 'New York', latitude: 40.7128, longitude: -74.006 },
  { nameZh: '洛杉磯', nameEn: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
  { nameZh: '雪梨', nameEn: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
];

const MATCH_KM = 45;

export function nearestCityLabel(
  point: GeoPoint,
  locale: 'zh' | 'en',
): string | null {
  let best: City | null = null;
  let bestKm = MATCH_KM;
  for (const city of CITIES) {
    const distance = haversineKm(point, {
      instant: point.instant,
      latitude: city.latitude,
      longitude: city.longitude,
    });
    if (distance < bestKm) {
      bestKm = distance;
      best = city;
    }
  }
  if (!best) return null;
  return locale === 'en' ? best.nameEn : best.nameZh;
}

export function placeLabelAtProgress(
  points: GeoPoint[],
  cumulativeDistanceKm: number[],
  progress: number,
  locale: 'zh' | 'en',
): string | null {
  if (points.length === 0) return null;
  const total = cumulativeDistanceKm.at(-1) ?? 0;
  const target = total * Math.max(0, Math.min(1, progress));
  let index = 0;
  while (index < cumulativeDistanceKm.length - 1 && cumulativeDistanceKm[index] < target) {
    index += 1;
  }
  return nearestCityLabel(points[Math.min(index, points.length - 1)], locale);
}
