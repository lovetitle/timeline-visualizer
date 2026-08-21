import { t, type Locale } from './i18n';
import { renderChangelog } from './changelog';

function parseLocale(value: string | null): Locale {
  if (value === 'en' || value === 'ja' || value === 'ko') return value;
  return 'zh';
}

const locale = parseLocale(localStorage.getItem('tv-locale'));
document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : locale;

const pages = {
  updates: {
    zh: {
      title: '更新公告 · 時間軸視覺化',
      back: '← 回到工具',
      heading: '更新公告',
      lede: '本站在瀏覽器本機處理你的時間軸，不會上傳 Timeline 檔案。以下依版本由新到舊列出；繁中／英／日／韓各有獨立文案，且每次更新都會保留舊版內容。',
      latest: '版本紀錄',
      data: '資料說明',
      dataItems: [
        '定位檔只在你的裝置處理',
        '地圖圖磚會向 CARTO 請求（可能透露選取範圍）',
        '造訪次數、設定、品質紀錄僅存本機',
      ],
      faq: '常見問題',
      start: '開始使用',
    },
    en: {
      title: 'Updates · Timeline Visualizer',
      back: '← Back to tool',
      heading: 'Updates',
      lede: 'Your Timeline is processed on-device and never uploaded. Versions are listed newest-first; each language has its own copy, and every release keeps prior history.',
      latest: 'Version history',
      data: 'Data notes',
      dataItems: [
        'Location files stay on your device',
        'Map tiles are requested from CARTO (may reveal selected area)',
        'Visits, settings, and quality logs stay local',
      ],
      faq: 'FAQ',
      start: 'Get started',
    },
    ja: {
      title: '更新情報 · タイムライン可視化',
      back: '← ツールに戻る',
      heading: '更新情報',
      lede: 'タイムラインは端末内で処理され、アップロードされません。新しい版から順に掲載。言語ごとに文言を分け、過去の更新も残します。',
      latest: 'バージョン履歴',
      data: 'データの扱い',
      dataItems: [
        '位置ファイルは端末内のみ',
        '地図タイルは CARTO へ（選択範囲が分かる可能性）',
        '訪問・設定・品質記録は端末内のみ',
      ],
      faq: 'よくある質問',
      start: 'はじめる',
    },
    ko: {
      title: '업데이트 · 타임라인 시각화',
      back: '← 도구로 돌아가기',
      heading: '업데이트',
      lede: '타임라인은 기기에서만 처리되며 업로드되지 않습니다. 최신 버전부터 나열하며, 언어별 문구를 따로 두고 이전 기록을 모두 유지합니다.',
      latest: '버전 기록',
      data: '데이터 안내',
      dataItems: [
        '위치 파일은 기기에만 보관',
        '지도 타일은 CARTO 요청 (선택 범위가 드러날 수 있음)',
        '방문·설정·품질 기록은 로컬에만 저장',
      ],
      faq: 'FAQ',
      start: '시작하기',
    },
  },
  faq: {
    zh: {
      title: '常見問題 · 時間軸視覺化',
      back: '← 回到工具',
      heading: '常見問題',
      sections: [
        ['怎麼匯出檔案？', 'Google 地圖 → 頭像 → 設定 → 位置和隱私 → 匯出檔案。不要用電腦版地圖，也不要用舊 Takeout。'],
        ['時間軸是空的？', '到「你的時間軸」用雲端備份匯入後，再重新匯出。若從未開備份，舊資料通常無法救回。'],
        ['為什麼不能 Google 登入抓資料？', '時間軸改為裝置端儲存，官方沒有給第三方讀取的 API。'],
        ['無法產出 MP4／1080p 失敗？', '請用最新 Chrome、Edge 或 Safari 16.4 以上。1080p 需要 H.264 Level 4；若仍失敗可先改 720p。'],
      ],
      updates: '更新公告',
      backTool: '回到工具',
    },
    en: {
      title: 'FAQ · Timeline Visualizer',
      back: '← Back to tool',
      heading: 'FAQ',
      sections: [
        ['How do I export a file?', 'Google Maps → profile → Settings → Location and privacy → Export Timeline data. Not desktop Maps, not legacy Takeout.'],
        ['Timeline is empty?', 'Open Your Timeline, restore from cloud backup, then export again. Without prior backup, old trips usually cannot be recovered.'],
        ['Why no Google sign-in?', 'Timeline is device-side now; there is no third-party API.'],
        ['MP4 / 1080p fails?', 'Use latest Chrome, Edge, or Safari 16.4+. 1080p needs H.264 Level 4; try 720p if it still fails.'],
      ],
      updates: 'Updates',
      backTool: 'Back to tool',
    },
    ja: {
      title: 'よくある質問 · タイムライン可視化',
      back: '← ツールに戻る',
      heading: 'よくある質問',
      sections: [
        ['ファイルの書き出し方は？', 'Google マップ → アイコン → 設定 → 位置情報とプライバシー → タイムラインデータをエクスポート。PC 版や旧 Takeout は不可。'],
        ['タイムラインが空？', '「タイムライン」でクラウドバックアップからインポートして再エクスポート。バックアップ未設定だと古い旅は復元できないことが多いです。'],
        ['なぜ Google ログインできない？', '端末内保存になり、第三者向け API がありません。'],
        ['MP4 / 1080p が失敗？', '最新の Chrome / Edge / Safari 16.4+ を。1080p は H.264 Level 4 が必要。だめなら 720p を試してください。'],
      ],
      updates: '更新情報',
      backTool: 'ツールに戻る',
    },
    ko: {
      title: 'FAQ · 타임라인 시각화',
      back: '← 도구로 돌아가기',
      heading: 'FAQ',
      sections: [
        ['파일은 어떻게 내보내나요?', 'Google 지도 → 프로필 → 설정 → 위치 및 개인정보 → 타임라인 내보내기. PC판·구 Takeout은 안 됩니다.'],
        ['타임라인이 비었나요?', '내 타임라인에서 클라우드 백업을 가져온 뒤 다시 내보내세요. 백업이 없으면 옛 여정은 보통 복구할 수 없습니다.'],
        ['Google 로그인은 왜 안 되나요?', '기기 저장으로 바뀌어 서드파티 API가 없습니다.'],
        ['MP4 / 1080p 실패?', '최신 Chrome·Edge 또는 Safari 16.4+를 쓰세요. 1080p는 H.264 Level 4가 필요하며, 안 되면 720p를 시도하세요.'],
      ],
      updates: '업데이트',
      backTool: '도구로 돌아가기',
    },
  },
  privacy: {
    zh: {
      title: '隱私報告 · 時間軸視覺化',
      back: '← 回到工具',
      heading: '隱私報告',
      lede: '時間軸 JSON 不會上傳。此頁只顯示本機記錄的地圖圖磚請求摘要，可隨時清除。',
      tiles: '本機圖磚請求',
      clear: '清除本機記錄',
      start: '開始使用',
      principles: '原則',
      items: [
        'Timeline / GPX / KML 只在瀏覽器記憶體與本機處理。',
        'CARTO 會收到選取旅程範圍的圖磚座標與一般網路資訊（如 IP）。',
        '造訪次數、設定、效能統計僅存 localStorage。',
        '可關閉「載入地圖」同意，就不會請求圖磚。',
      ],
    },
    en: {
      title: 'Privacy report · Timeline Visualizer',
      back: '← Back to tool',
      heading: 'Privacy report',
      lede: 'Timeline JSON is never uploaded. This page only shows local map-tile request summaries you can clear anytime.',
      tiles: 'Local tile requests',
      clear: 'Clear local log',
      start: 'Get started',
      principles: 'Principles',
      items: [
        'Timeline / GPX / KML stay in browser memory on your device.',
        'CARTO receives tile coordinates for the selected range plus normal network info (e.g. IP).',
        'Visits, settings, and perf stats live only in localStorage.',
        'If you skip map consent, no tiles are requested.',
      ],
    },
    ja: {
      title: 'プライバシー報告 · タイムライン可視化',
      back: '← ツールに戻る',
      heading: 'プライバシー報告',
      lede: 'タイムライン JSON はアップロードされません。このページは端末内の地図タイル記録のみ表示し、いつでも消去できます。',
      tiles: '端末内タイル要求',
      clear: '記録を消去',
      start: 'はじめる',
      principles: '原則',
      items: [
        'Timeline / GPX / KML はブラウザ内でのみ処理。',
        'CARTO は選択範囲のタイル座標と IP など通常の通信情報を受け取ります。',
        '訪問回数・設定・性能統計は localStorage のみ。',
        '地図同意をオフにすればタイルは要求されません。',
      ],
    },
    ko: {
      title: '개인정보 보고 · 타임라인 시각화',
      back: '← 도구로 돌아가기',
      heading: '개인정보 보고',
      lede: '타임라인 JSON은 업로드되지 않습니다. 이 페이지는 기기 내 지도 타일 요청 요약만 보여 주며 언제든 지울 수 있습니다.',
      tiles: '기기 내 타일 요청',
      clear: '로컬 기록 지우기',
      start: '시작하기',
      principles: '원칙',
      items: [
        'Timeline / GPX / KML은 브라우저 메모리에서만 처리됩니다.',
        'CARTO는 선택한 범위의 타일 좌표와 IP 등 일반 네트워크 정보를 받습니다.',
        '방문·설정·성능 통계는 localStorage에만 저장됩니다.',
        '지도 동의를 끄면 타일을 요청하지 않습니다.',
      ],
    },
  },
} as const;

export function applyStaticPage(page: keyof typeof pages): void {
  const copy = pages[page][locale];
  document.title = copy.title;
  const set = (id: string, text: string) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  set('i18n-back', copy.back);
  set('i18n-heading', 'heading' in copy ? copy.heading : '');
  if ('lede' in copy) set('i18n-lede', copy.lede);

  if (page === 'updates') {
    const u = pages.updates[locale];
    set('i18n-latest', u.latest);
    set('i18n-data', u.data);
    set('i18n-faq', u.faq);
    set('i18n-start', u.start);
    const versions = document.getElementById('i18n-versions');
    if (versions) renderChangelog(locale, versions);
    const legacy = document.getElementById('i18n-items');
    if (legacy) legacy.replaceChildren();
    const dataList = document.getElementById('i18n-data-items');
    if (dataList) dataList.replaceChildren(...u.dataItems.map((text) => Object.assign(document.createElement('li'), { textContent: text })));
  }

  if (page === 'faq') {
    const f = pages.faq[locale];
    set('i18n-updates', f.updates);
    set('i18n-back-tool', f.backTool);
    const root = document.getElementById('i18n-sections');
    if (root) {
      root.replaceChildren(...f.sections.flatMap(([h, p]) => {
        const heading = document.createElement('h2');
        heading.textContent = h;
        const body = document.createElement('p');
        body.textContent = p;
        return [heading, body];
      }));
    }
  }

  if (page === 'privacy') {
    const p = pages.privacy[locale];
    set('i18n-tiles', p.tiles);
    set('i18n-clear', p.clear);
    set('i18n-start', p.start);
    set('i18n-principles', p.principles);
    const list = document.getElementById('i18n-principles-items');
    if (list) list.replaceChildren(...p.items.map((text) => Object.assign(document.createElement('li'), { textContent: text })));
  }

  // Keep nav labels consistent with main app.
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n as Parameters<typeof t>[1];
    if (key) node.textContent = t(locale, key);
  });
}
