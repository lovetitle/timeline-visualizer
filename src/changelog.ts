import type { Locale } from './i18n';

export interface ChangelogVersion {
  version: string;
  date: string;
  items: Record<Locale, string[]>;
}

/** Newest first. Each locale keeps its own wording; older releases stay listed. */
export const CHANGELOG: ChangelogVersion[] = [
  {
    version: '1.5.0',
    date: '2026-08-21',
    items: {
      zh: [
        '智慧剪輯建議（15／30／60 秒熱區）與多段故事板佇列',
        '章節敘事腳本、一鍵複製與語音朗讀（本機 TTS）',
        '本機分享預覽頁（IndexedDB，不上傳時間軸）',
        '記住上次成功的解析度／主題，失敗降級後下次沿用成功設定',
        '章節目錄可拖曳排序、預覽顯示里程／時速',
        '選區圖磚預先快取、產出檢查清單、本機品質儀表板',
        '片尾地圖版權可開關、無障礙朗讀進度、背景分頁持續編碼',
        '更新公告改為各語言獨立文案，並保留歷代版本紀錄',
      ],
      en: [
        'Smart clip suggestions (15 / 30 / 60s hotspots) and multi-clip storyboard queue',
        'Chapter narrative script with copy + on-device TTS',
        'Local share preview page (IndexedDB; Timeline never uploaded)',
        'Remember last successful resolution/theme after fallback',
        'Draggable chapter TOC; preview HUD with distance / speed',
        'Prefetch tiles for selection, export checklist, local quality dashboard',
        'Optional map attribution, a11y progress announcements, keep encoding in background tabs',
        'Updates page: per-language copy with full version history retained',
      ],
      ja: [
        'スマート切り抜き提案（15／30／60秒）とストーリーボードキュー',
        '章ごとのナレーション原稿・コピー・端末内 TTS',
        '端末内シェアプレビュー（IndexedDB・タイムライン非アップロード）',
        '成功した解像度／テーマを記憶（失敗時の降格後も次回に反映）',
        '章 TOC のドラッグ並び替え、距離／速度 HUD',
        '選択範囲タイル先読み、書き出しチェックリスト、品質ダッシュボード',
        '地図クレジット表示の切替、a11y 進捗読み上げ、背面タブでもエンコード継続',
        '更新情報を言語別に分離し、過去バージョンを保持',
      ],
      ko: [
        '스마트 클립 제안(15/30/60초)과 스토리보드 큐',
        '챕터 나레이션 원고·복사·기기 내 TTS',
        '로컬 공유 미리보기(IndexedDB, 타임라인 미업로드)',
        '성공한 해상도/테마 기억(실패 후 다운스케일 반영)',
        '챕터 TOC 드래그 정렬, 거리/속도 HUD',
        '선택 구간 타일 미리 캐시, 내보내기 체크리스트, 품질 대시보드',
        '지도 저작권 표시 on/off, a11y 진행 안내, 백그라운드 탭 인코딩 유지',
        '업데이트 페이지를 언어별로 분리하고 이전 버전 기록을 유지',
      ],
    },
  },
  {
    version: '1.4.0',
    date: '2026-08-21',
    items: {
      zh: [
        '失敗自動降解析度、系統主題、手機底部操作列、快速預設檔',
        '旅程統計頁、預覽進度／章節目錄、對照透明度、9:16 故事海報、字幕燒錄',
        '離線圖磚匯出匯入、教學手機畫面動畫、正式條款／隱私政策、匿名本機用量',
        '無障礙 focus 強化、大型 JSON Worker 解析門檻調低、E2E 涵蓋產出流程',
      ],
      en: [
        'Auto resolution fallback, system theme, mobile action bar, presets',
        'Stats page, scrubber / chapter TOC, compare opacity, story poster, burn-in captions',
        'Offline tile pack, tutorial phone animation, terms / privacy, local anon counters',
        'Focus a11y, lower JSON worker threshold, E2E covers create flow',
      ],
      ja: [
        '失敗時の解像度自動降格、システムテーマ、モバイル下部バー、プリセット',
        '旅程統計、スクラバー／章 TOC、比較透明度、9:16 ポスター、字幕焼き込み',
        'オフラインタイル、チュートリアル、利用規約／プライバシー、端末内利用統計',
        'フォーカス a11y、JSON Worker 閾値引き下げ、E2E で書き出し確認',
      ],
      ko: [
        '실패 시 해상도 자동 하향, 시스템 테마, 모바일 하단 바, 프리셋',
        '여행 통계, 스크러버/챕터 TOC, 대조 투명도, 9:16 포스터, 자막 번인',
        '오프라인 타일, 튜토리얼, 약관/개인정보, 로컬 사용 통계',
        '포커스 a11y, JSON Worker 임계값 하향, E2E 내보내기 검증',
      ],
    },
  },
  {
    version: '1.3.0',
    date: '2026-08-20',
    items: {
      zh: [
        '匯出教學四語完整、產出暫停／繼續、範例影片快取播放',
        '手機設定手風琴、品牌本機設定、1080p H.264 Level 4.0+ 修復',
      ],
      en: [
        'Full multilingual export guide, encode pause/resume, cached sample video',
        'Mobile settings accordion, local brand settings, 1080p Level 4.0+ fix',
      ],
      ja: [
        '書き出しガイド多言語化、エンコード一時停止／再開、サンプル動画キャッシュ',
        'モバイル設定アコーディオン、ブランド設定、1080p Level 4.0+ 修正',
      ],
      ko: [
        '내보내기 가이드 다국어, 인코딩 일시정지/재개, 샘플 영상 캐시',
        '모바일 설정 아코디언, 브랜드 설정, 1080p Level 4.0+ 수정',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-08-19',
    items: {
      zh: [
        '深色模式、設定匯入匯出、快捷鍵、PWA 更新提示',
        '隱私報告頁、版本紅點、本機效能統計、日／韓介面',
      ],
      en: [
        'Dark mode, settings import/export, shortcuts, PWA update banner',
        'Privacy report, version badge, local perf stats, Japanese / Korean UI',
      ],
      ja: [
        'ダークモード、設定の入出力、ショートカット、PWA 更新バナー',
        'プライバシー報告、バージョン表示、性能統計、日／韓 UI',
      ],
      ko: [
        '다크 모드, 설정 입출력, 단축키, PWA 업데이트 배너',
        '개인정보 보고, 버전 배지, 성능 통계, 일본어/한국어 UI',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-08-18',
    items: {
      zh: [
        '多解析度與主題、GPX／KML、長途壓縮、離群點過濾',
        '地名字幕、章節、隱私模糊、片尾、本機 BGM、批次與對照',
      ],
      en: [
        'More formats/themes, GPX/KML, compression, outlier filter',
        'Place labels, chapters, privacy blur, outro, local BGM, batch & compare',
      ],
      ja: [
        '解像度／テーマ拡充、GPX／KML、圧縮、外れ値フィルタ',
        '地名、章、ぼかし、エンディング、BGM、バッチと比較',
      ],
      ko: [
        '해상도/테마 확장, GPX/KML, 압축, 이상치 필터',
        '지명, 챕터, 흐림, 엔딩, BGM, 배치와 비교',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-08-17',
    items: {
      zh: [
        '首次公開：Timeline.json 本機解析、期間選取、路徑預覽',
        '瀏覽器內產出 H.264 MP4，地圖圖磚經 CARTO，時間軸不上傳',
      ],
      en: [
        'First release: on-device Timeline.json parse, period select, route preview',
        'In-browser H.264 MP4; map tiles via CARTO; Timeline never uploaded',
      ],
      ja: [
        '初回公開：端末内 Timeline.json 解析、期間選択、ルートプレビュー',
        'ブラウザ内 H.264 MP4。地図タイルは CARTO。タイムライン非アップロード',
      ],
      ko: [
        '첫 공개: 기기 내 Timeline.json 파싱, 기간 선택, 경로 미리보기',
        '브라우저 H.264 MP4, 지도 타일은 CARTO, 타임라인 미업로드',
      ],
    },
  },
];

export function renderChangelog(locale: Locale, container: HTMLElement): void {
  container.replaceChildren(...CHANGELOG.map((entry) => {
    const section = document.createElement('section');
    section.className = 'changelog-version';
    section.setAttribute('aria-labelledby', `ver-${entry.version}`);
    const heading = document.createElement('h3');
    heading.id = `ver-${entry.version}`;
    heading.textContent = `v${entry.version} · ${entry.date}`;
    const list = document.createElement('ul');
    list.className = 'faq-list';
    list.replaceChildren(...entry.items[locale].map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    section.append(heading, list);
    return section;
  }));
}
