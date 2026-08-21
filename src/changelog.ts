import type { Locale } from './i18n';

export interface ChangelogVersion {
  version: string;
  date: string;
  items: Record<Locale, string[]>;
}

/** Newest first. Each locale keeps its own wording; older releases stay listed. */
export const CHANGELOG: ChangelogVersion[] = [
  {
    version: '1.6.0',
    date: '2026-08-21',
    items: {
      zh: [
        '精華 30 秒、片頭定格、倒轉路線、日光／暖冷／夜景色調',
        '章節提示音燒錄、有聲＋無聲雙檔產出、雙路線分屏對照',
        '衛星／地形／夜景底圖、停留點、日曆熱點選日、裁切強度',
        '設定即時預覽、失敗一鍵改 720p／480p、新手四步引導',
        '健康檢查、高對比／字級／減少動態、人生章節標籤、年度回顧頁',
        '旅程報告圖、腳本＋SRT 打包 ZIP、故事板 ZIP、分享卡 QR',
        '快捷鍵 ←→ 微調進度、S 套用精華；向量地圖以 OSM 本地語系圖磚近似 name:zh／ja',
      ],
      en: [
        'Highlight 30s, intro hold, reverse route, daylight/warm/cool/night grading',
        'Chapter chime burn-in, dual silent+audio export, split-screen compare',
        'Satellite/terrain/night basemaps, stay points, calendar day chips, trim intensity',
        'Live preview on settings, one-click retry 720p/480p, 4-step onboarding',
        'Health check, contrast/font/reduce-motion, life tags, year-wrapped page',
        'Journey report image, script+SRT zip, storyboard zip, share-card QR',
        'Arrow keys scrub preview, S applies highlight; locale tiles approximate vector name:zh/ja',
      ],
      ja: [
        'ハイライト30秒、イントロ、逆再生、日光／暖色／寒色／夜の色調',
        '章チャイム焼き込み、音声あり／なし二本出力、左右比較',
        '衛星／地形／夜景、滞在点、カレンダー日選択、トリム強度',
        '設定の即時プレビュー、720p／480p 一発リトライ、4ステップ案内',
        'ヘルスチェック、コントラスト／文字サイズ／動き軽減、人生タグ、年間振り返り',
        '旅程レポート、原稿+SRT ZIP、ストーリーボード ZIP、共有 QR',
        '←→ でスクラブ、S でハイライト。OSM タイルで name:zh/ja を近似',
      ],
      ko: [
        '하이라이트 30초, 인트로, 역재생, 낮/暖/冷/야간 색감',
        '챕터 차임 번인, 유성+무성 이중 내보내기, 분할 대조',
        '위성/지형/야경, 체류점, 달력 일자, 트림 강도',
        '설정 즉시 미리보기, 720p/480p 원클릭 재시도, 4단계 온보딩',
        '헬스 체크, 대비/글자/모션 감소, 인생 태그, 연간 리캡 페이지',
        '여정 리포트, 원고+SRT ZIP, 스토리보드 ZIP, 공유 QR',
        '←→ 스크럽, S 하이라이트. OSM 타일로 name:zh/ja 근사',
      ],
    },
  },
  {
    version: '1.5.1',
    date: '2026-08-21',
    items: {
      zh: [
        '地圖圖磚依介面語系切換：繁中／韓文用 OSM 本地地名、日文用 OSM Japan、英文維持 CARTO',
        '深色地圖改無標籤底圖，避免英文路名蓋過介面字幕',
        '修正「短影音／環島／出差預設」與「今年／最近／海外／裁切」按鈕未真正套用的問題',
        '預設與智慧選取會寫入標題、章節、地標等，並在選取摘要顯示已套用結果',
      ],
      en: [
        'Map tiles follow UI language: zh/ko use OSM local names, ja uses OSM Japan, en keeps CARTO',
        'Dark map uses unlabeled basemap so English street names do not override UI captions',
        'Fixed Reels / Island / Business presets and This-year / Recent / Abroad / Trim buttons not applying',
        'Presets and smart select now update title/chapters/labels and show a clear “applied” summary',
      ],
      ja: [
        '地図タイルが UI 言語に追従：zh/ko は OSM 現地表記、ja は OSM Japan、en は CARTO',
        'ダーク地図はラベルなし基図にし、英語地名が字幕を邪魔しないように',
        'リール／島めぐり／出張プリセットと今年／最近／海外／トリムが効いていなかった不具合を修正',
        'プリセットとスマート選択がタイトル・章・地名も更新し、適用結果を要約表示',
      ],
      ko: [
        '지도 타일이 UI 언어를 따름: zh/ko는 OSM 현지 지명, ja는 OSM Japan, en은 CARTO',
        '다크 지도는 라벨 없는 베이스맵으로 영어 지명이 자막을 가리지 않음',
        '숏폼/섬일주/출장 프리셋과 올해/최근/해외/트림 버튼이 적용되지 않던 문제 수정',
        '프리셋·스마트 선택이 제목/챕터/지명까지 반영하고 적용 요약을 표시',
      ],
    },
  },
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
