export interface VideoFormat {
  id: string;
  width: number;
  height: number;
  labelZh: string;
  labelEn: string;
}

export const VIDEO_FORMATS: VideoFormat[] = [
  { id: 'sq480', width: 480, height: 480, labelZh: '正方形 480p', labelEn: 'Square 480p' },
  { id: 'sq720', width: 720, height: 720, labelZh: '正方形 720p', labelEn: 'Square 720p' },
  { id: 'sq1080', width: 1080, height: 1080, labelZh: '正方形 1080p', labelEn: 'Square 1080p' },
  { id: 'portrait', width: 1080, height: 1920, labelZh: '直式 1080×1920', labelEn: 'Portrait 1080×1920' },
  { id: 'landscape', width: 1920, height: 1080, labelZh: '橫式 1920×1080', labelEn: 'Landscape 1920×1080' },
];

export function formatById(id: string): VideoFormat {
  return VIDEO_FORMATS.find((format) => format.id === id) ?? VIDEO_FORMATS[0];
}
