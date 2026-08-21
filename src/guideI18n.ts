import type { Locale } from './i18n';

interface GuideCopy {
  intro: string;
  platformLabel: string;
  androidOpenTitle: string;
  androidOpenBody: string;
  settingsTitle: string;
  settingsPath: string;
  settingsBody: string;
  exportTitle: string;
  exportPath: string;
  androidExportBody: string;
  transferTitle: string;
  androidTransferBody: string;
  iphoneOpenBody: string;
  iphoneExportBody: string;
  iphoneTransferBody: string;
  helpSummary: string;
  helpItems: string[];
  frame1: string;
  frame2: string;
  frame3: string;
  emptyTitle: string;
  emptyItems: string[];
}

const GUIDE: Record<Locale, GuideCopy> = {
  zh: {
    intro: 'Google 不能用登入直接抓時間軸。資料存在手機裡，必須先匯出檔案。正確路徑：地圖 → 頭像 → 設定 → 位置和隱私 → 匯出檔案。',
    platformLabel: '選擇手機系統',
    androidOpenTitle: '打開 Google 地圖',
    androidOpenBody: '請開「地圖」App，不要用手機系統設定。',
    settingsTitle: '進入設定',
    settingsPath: '頭像 → 設定',
    settingsBody: '頭像在畫面右上角。',
    exportTitle: '匯出檔案',
    exportPath: '位置和隱私 → 匯出檔案',
    androidExportBody: '把檔案存到「下載」。檔名通常是 Timeline.json。',
    transferTitle: '傳到這台電腦',
    androidTransferBody: '用 USB、雲端硬碟，或把檔案寄給自己。然後拖放到上方選擇區。',
    iphoneOpenBody: '請開「地圖」App，不要用 iPhone 系統設定。',
    iphoneExportBody: '存到「檔案」App，例如「我的 iPhone → 下載項目」。檔名通常是 Timeline.json。',
    iphoneTransferBody: '用 AirDrop、iCloud 雲碟或郵件把檔案傳到電腦，再拖放到上方選擇區。',
    helpSummary: '找不到選單、時間軸是空的？',
    helpItems: [
      '正確路徑是：地圖 → 頭像 → 設定 → 位置和隱私 → 匯出檔案。不要用電腦版 Google 地圖。',
      'Google Takeout 匯出的是舊格式，這個網頁通常無法使用。請改從手機匯出。',
      '無法用 Google 帳號登入抓資料。時間軸存在手機，官方沒有提供給第三方讀取的 API。',
      '時間軸被刪除或顯示空白時：開啟 Google 地圖 → 頭像 →「你的時間軸」→ 右上角雲端／備份圖示 → 選擇有備份的裝置 →「更多」→「匯入」。確認造訪記錄出現後，再重新匯出 JSON。',
      '若從未開啟時間軸備份，被刪除的舊行程通常無法救回；之後請在時間軸頁開啟加密備份，避免再遺失。',
    ],
    frame1: '1. 打開地圖',
    frame2: '2. 進入設定',
    frame3: '3. 匯出檔案',
    emptyTitle: '時間軸是空的？先還原再匯出',
    emptyItems: [
      '開啟 Google 地圖 → 頭像 →「你的時間軸」。',
      '點右上角雲端／備份圖示，選擇有備份的裝置。',
      '「更多」→「匯入」，確認造訪記錄出現。',
      '再依下方步驟重新匯出 JSON，並載入到這裡。',
    ],
  },
  en: {
    intro: 'Google sign-in cannot fetch Timeline. Data lives on your phone—export a file first. Path: Maps → profile → Settings → Location and privacy → Export Timeline data.',
    platformLabel: 'Choose phone OS',
    androidOpenTitle: 'Open Google Maps',
    androidOpenBody: 'Use the Maps app, not system Settings.',
    settingsTitle: 'Open Settings',
    settingsPath: 'Profile → Settings',
    settingsBody: 'Your profile photo is at the top right.',
    exportTitle: 'Export the file',
    exportPath: 'Location and privacy → Export Timeline data',
    androidExportBody: 'Save to Downloads. The file is usually named Timeline.json.',
    transferTitle: 'Transfer to this computer',
    androidTransferBody: 'Use USB, Drive, or email it to yourself, then drop it above.',
    iphoneOpenBody: 'Use the Maps app, not iPhone Settings.',
    iphoneExportBody: 'Save in the Files app (e.g. On My iPhone → Downloads). Usually Timeline.json.',
    iphoneTransferBody: 'Use AirDrop, iCloud Drive, or Mail, then drop the file above.',
    helpSummary: 'Missing menus or empty Timeline?',
    helpItems: [
      'Correct path: Maps → profile → Settings → Location and privacy → Export. Not desktop Maps.',
      'Google Takeout is a legacy format and usually will not work here. Export from your phone.',
      'There is no third-party API to pull Timeline with a Google login.',
      'If Timeline was deleted: Maps → profile → Your Timeline → cloud/backup icon → pick a device → More → Import, then export again.',
      'Without prior encrypted backup, deleted trips usually cannot be recovered.',
    ],
    frame1: '1. Open Maps',
    frame2: '2. Open Settings',
    frame3: '3. Export file',
    emptyTitle: 'Empty Timeline? Restore, then export',
    emptyItems: [
      'Open Google Maps → profile → Your Timeline.',
      'Tap the cloud/backup icon and pick a backed-up device.',
      'More → Import, confirm visits appear.',
      'Export JSON again with the steps below and load it here.',
    ],
  },
  ja: {
    intro: 'Google ログインでは取得できません。スマホで書き出してください。手順：マップ → アイコン → 設定 → 位置情報とプライバシー → タイムラインデータをエクスポート。',
    platformLabel: '端末を選択',
    androidOpenTitle: 'Google マップを開く',
    androidOpenBody: 'システム設定ではなく「マップ」アプリを開いてください。',
    settingsTitle: '設定へ',
    settingsPath: 'アイコン → 設定',
    settingsBody: 'アイコンは右上にあります。',
    exportTitle: 'ファイルを書き出し',
    exportPath: '位置情報とプライバシー → エクスポート',
    androidExportBody: '「ダウンロード」に保存。ファイル名は通常 Timeline.json。',
    transferTitle: 'このパソコンへ転送',
    androidTransferBody: 'USB・ドライブ・メールなどで転送し、上の枠にドロップ。',
    iphoneOpenBody: 'iPhone の設定ではなく「マップ」アプリを開いてください。',
    iphoneExportBody: '「ファイル」アプリ（例：この iPhone 内 → ダウンロード）へ。通常 Timeline.json。',
    iphoneTransferBody: 'AirDrop・iCloud・メールで転送し、上の枠にドロップ。',
    helpSummary: 'メニューがない／タイムラインが空？',
    helpItems: [
      '正しい経路：マップ → アイコン → 設定 → 位置情報とプライバシー → エクスポート。PC 版は不可。',
      'Google Takeout は旧形式で、このサイトではほぼ使えません。スマホから書き出してください。',
      '第三者向けの Timeline API はありません。',
      '削除・空白時：マップ → アイコン → タイムライン → クラウド／バックアップ → 端末選択 → その他 → インポート後、再エクスポート。',
      '暗号化バックアップ未設定だと、削除済みの旅は復元できないことが多いです。',
    ],
    frame1: '1. マップを開く',
    frame2: '2. 設定へ',
    frame3: '3. 書き出し',
    emptyTitle: '空のタイムライン？復元してから書き出し',
    emptyItems: [
      'Google マップ → アイコン → タイムライン。',
      '右上のクラウド／バックアップから端末を選ぶ。',
      'その他 → インポートし、訪問が表示されることを確認。',
      '下の手順で JSON を再エクスポートして読み込む。',
    ],
  },
  ko: {
    intro: 'Google 로그인으로는 가져올 수 없습니다. 휴대폰에서 먼저 내보내세요. 경로: 지도 → 프로필 → 설정 → 위치 및 개인정보 → 타임라인 내보내기.',
    platformLabel: '휴대폰 OS 선택',
    androidOpenTitle: 'Google 지도 열기',
    androidOpenBody: '시스템 설정이 아니라 지도 앱을 여세요.',
    settingsTitle: '설정 열기',
    settingsPath: '프로필 → 설정',
    settingsBody: '프로필 사진은 오른쪽 위에 있습니다.',
    exportTitle: '파일 내보내기',
    exportPath: '위치 및 개인정보 → 타임라인 내보내기',
    androidExportBody: '다운로드에 저장합니다. 파일 이름은 보통 Timeline.json입니다.',
    transferTitle: '이 컴퓨터로 전송',
    androidTransferBody: 'USB·드라이브·메일로 보낸 뒤 위 영역에 놓으세요.',
    iphoneOpenBody: 'iPhone 설정이 아니라 지도 앱을 여세요.',
    iphoneExportBody: '파일 앱(예: 내 iPhone → 다운로드)에 저장. 보통 Timeline.json.',
    iphoneTransferBody: 'AirDrop·iCloud·메일로 전송한 뒤 위 영역에 놓으세요.',
    helpSummary: '메뉴가 없거나 타임라인이 비었나요?',
    helpItems: [
      '올바른 경로: 지도 → 프로필 → 설정 → 위치 및 개인정보 → 내보내기. PC판은 안 됩니다.',
      'Google Takeout은 구형이라 여기서 거의 안 됩니다. 휴대폰에서 내보내세요.',
      '서드파티가 로그인으로 타임라인을 가져오는 API는 없습니다.',
      '삭제·빈 화면: 지도 → 프로필 → 내 타임라인 → 클라우드/백업 → 기기 선택 → 더보기 → 가져오기 후 다시 내보내기.',
      '암호화 백업을 켠 적이 없으면 삭제된 여정은 보통 복구할 수 없습니다.',
    ],
    frame1: '1. 지도 열기',
    frame2: '2. 설정 열기',
    frame3: '3. 내보내기',
    emptyTitle: '빈 타임라인? 복원 후 내보내기',
    emptyItems: [
      'Google 지도 → 프로필 → 내 타임라인.',
      '오른쪽 위 클라우드/백업에서 기기를 고릅니다.',
      '더보기 → 가져오기 후 방문 기록이 보이는지 확인.',
      '아래 단계로 JSON을 다시 내보낸 뒤 여기에 불러오세요.',
    ],
  },
};

export function applyGuideLocale(locale: Locale): void {
  const copy = GUIDE[locale];
  const set = (id: string, text: string) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  set('guide-intro-text', copy.intro);
  const tabBar = document.querySelector('.tab-bar');
  if (tabBar) tabBar.setAttribute('aria-label', copy.platformLabel);

  set('android-open-title', copy.androidOpenTitle);
  set('android-open-body', copy.androidOpenBody);
  set('android-settings-title', copy.settingsTitle);
  set('android-settings-path', copy.settingsPath);
  set('android-settings-body', copy.settingsBody);
  set('android-export-title', copy.exportTitle);
  set('android-export-path', copy.exportPath);
  set('android-export-body', copy.androidExportBody);
  set('android-transfer-title', copy.transferTitle);
  set('android-transfer-body', copy.androidTransferBody);

  set('iphone-open-title', copy.androidOpenTitle);
  set('iphone-open-body', copy.iphoneOpenBody);
  set('iphone-settings-title', copy.settingsTitle);
  set('iphone-settings-path', copy.settingsPath);
  set('iphone-settings-body', copy.settingsBody);
  set('iphone-export-title', copy.exportTitle);
  set('iphone-export-path', copy.exportPath);
  set('iphone-export-body', copy.iphoneExportBody);
  set('iphone-transfer-title', copy.transferTitle);
  set('iphone-transfer-body', copy.iphoneTransferBody);

  set('guide-help-summary', copy.helpSummary);
  const helpList = document.getElementById('guide-help-list');
  if (helpList) {
    helpList.replaceChildren(...copy.helpItems.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }
  set('frame-cap-1', copy.frame1);
  set('frame-cap-2', copy.frame2);
  set('frame-cap-3', copy.frame3);
  set('empty-title', copy.emptyTitle);
  const emptyList = document.getElementById('empty-steps');
  if (emptyList) {
    emptyList.replaceChildren(...copy.emptyItems.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }
}
