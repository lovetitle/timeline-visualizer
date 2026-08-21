# Play 商店上架指南（Timeline Visualizer 1.7.1）

## 已產出的安裝檔

| 檔案 | 用途 |
|------|------|
| `releases/play/1.7.1/TimelineVisualizer-1.7.1.aab` | **上傳 Google Play**（必用） |
| `releases/play/1.7.1/TimelineVisualizer-1.7.1.apk` | 本機／測試機直接安裝 |
| `releases/play/1.7.1/upload_certificate.pem` | Play App Signing 上傳憑證（若需要） |

- **applicationId**：`app.lovetitle.timeline`
- **versionName**：`1.7.1`
- **versionCode**：`171`
- **minSdk**：23（Android 6.0+）
- **targetSdk**：35
- **上傳金鑰 SHA-256**：`C6:AE:50:32:54:10:2D:17:E9:A9:3B:54:47:DD:EC:8B:AD:6C:AB:A4:84:FC:5D:E6:2F:AE:08:38:10:FA:2B:45`

## 簽署金鑰（請妥善備份）

本機已產生上傳金鑰（**未提交到 git**）：

- `android/keystore/upload.jks`
- `android/keystore.properties`（含密碼）

Play Console 建議啟用 **Play App Signing**（Google 保管正式簽署金鑰，你上傳的是 upload key）。

匯出上傳憑證給 Play（若 Console 要求）：

```bash
keytool -export -rfc -keystore android/keystore/upload.jks -alias upload -file releases/play/upload_certificate.pem
```

## 你必須在 Play Console 手動完成的步驟

1. 付費註冊 [Google Play Console](https://play.google.com/console) 開發者帳號（一次性費用）。
2. **建立應用程式** → 預設語言可選「中文（台灣）」或 English。
3. **正式版** → **建立新版本** → 上傳 `TimelineVisualizer-1.7.1.aab`。
4. 填寫商店資訊（下方文案可直接貼）：
   - 短說明（≤80 字）
   - 完整說明
   - 圖示 512×512、功能圖 1024×500、至少 2 張手機截圖
5. **隱私權政策網址**（必填）：  
   `https://lovetitle-timeline.vercel.app/legal-privacy.html`
6. **應用程式內容**問卷：
   - 不上傳 Timeline 到伺服器；僅地圖圖磚請求外部網路
   - 無登入、無廣告、無應用內購買（若屬實請照實勾選）
7. 完成內容分級、目標對象、新聞應用等宣告後送審。

> 無法代替你登入 Play Console 或代付開發者費用；AAB 與金鑰已在本機就緒。

## 建議商店文案（繁中）

**應用程式名稱**  
時間軸視覺化 — Timeline Visualizer

**短說明**  
在手機把 Google 時間軸做成旅行影片。本機處理，不上傳 Timeline。

**完整說明**  
把手機匯出的 Timeline.json（也支援 GPX／KML）轉成可分享的旅行動畫 MP4。

• 本機處理：時間軸檔案不會上傳到我們的伺服器  
• 簡單三步：選檔 → 預覽 → 產出  
• 直式社群成片、章節字幕、地圖主題與隱私模糊  
• 繁中／英／日／韓介面  

匯出路徑：Google 地圖 → 頭像 → 設定 → 位置和隱私 → 匯出檔案。

僅地圖圖磚會向圖磚供應商請求（例如 CARTO／OpenStreetMap），可能透露大致地區；詳見隱私政策。

## 建議商店文案（English）

**Short**  
Turn Google Timeline into a travel video on-device. Timeline never uploaded.

**Full**  
Load Timeline.json / GPX / KML, preview the route, and create an MP4 in the app. Your Timeline stays on the device; only map tiles contact tile providers. Multilingual UI (zh/en/ja/ko), portrait social presets, captions, and privacy blur.

## 重新建置

```bash
cd D:\anbiu\456\web
npm run android:bundle   # → AAB
npm run android:apk      # → APK
```

需要 JDK 21 與本機 Android SDK（已安裝於 `%LOCALAPPDATA%\Android\Sdk`）。

## 與 ahn-lab 對標

| | ahn-lab | 本專案 |
|--|---------|--------|
| 發行 | GitHub APK | Play AAB + 側載 APK |
| 核心 | Android 原生 | Capacitor 包同一套網頁（功能更完整） |
| 隱私 | 本機 | 本機（相同原則） |
