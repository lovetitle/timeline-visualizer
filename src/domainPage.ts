import type { Locale } from './i18n';

function parseLocale(value: string | null): Locale {
  if (value === 'en' || value === 'ja' || value === 'ko') return value;
  return 'zh';
}

const COPY: Record<Locale, { title: string; back: string; heading: string; lede: string; sections: [string, string][] }> = {
  zh: {
    title: '自訂網域 · 時間軸視覺化',
    back: '← 回到工具',
    heading: '自訂網域',
    lede: '把 lovetitle-timeline.vercel.app 換成你的品牌網址（例如 timeline.yourdomain.com）。',
    sections: [
      ['1. 準備網域', '向網域註冊商購買網域，或使用你已有的網域。'],
      ['2. 在 Vercel 綁定', '開啟 Vercel 專案 → Settings → Domains → 新增你的網域，依提示加入 DNS 紀錄（通常是 CNAME 指到 cname.vercel-dns.com）。'],
      ['3. 等 DNS 生效', '通常數分鐘到數小時。完成後用瀏覽器開啟自訂網址確認 HTTPS 憑證就緒。'],
      ['4. 本機品牌顯示', '回到工具頁底部「品牌設定」，可改站名與主標（只存在這台裝置的 localStorage）。'],
      ['目前公開網址', 'https://lovetitle-timeline.vercel.app'],
    ],
  },
  en: {
    title: 'Custom domain · Timeline Visualizer',
    back: '← Back to tool',
    heading: 'Custom domain',
    lede: 'Replace lovetitle-timeline.vercel.app with your brand URL (e.g. timeline.yourdomain.com).',
    sections: [
      ['1. Get a domain', 'Buy one from a registrar or use a domain you already own.'],
      ['2. Bind in Vercel', 'Open the Vercel project → Settings → Domains → Add domain, then add the DNS records shown (often a CNAME to cname.vercel-dns.com).'],
      ['3. Wait for DNS', 'Usually minutes to hours. Open your custom URL and confirm HTTPS is ready.'],
      ['4. Local branding', 'In the tool footer, Brand settings lets you change the site name and headline (stored only in this device’s localStorage).'],
      ['Current public URL', 'https://lovetitle-timeline.vercel.app'],
    ],
  },
  ja: {
    title: '独自ドメイン · タイムライン可視化',
    back: '← ツールに戻る',
    heading: '独自ドメイン',
    lede: 'lovetitle-timeline.vercel.app をブランド URL（例: timeline.yourdomain.com）に置き換えます。',
    sections: [
      ['1. ドメインを用意', 'レジストラで購入するか、既存ドメインを使います。'],
      ['2. Vercel で設定', 'Vercel プロジェクト → Settings → Domains で追加し、案内どおり DNS（多くは CNAME → cname.vercel-dns.com）を設定。'],
      ['3. DNS 反映を待つ', '数分〜数時間。カスタム URL で HTTPS を確認。'],
      ['4. 端末内ブランド', 'ツール下部の「ブランド設定」でサイト名と見出しを変更（localStorage のみ）。'],
      ['現在の公開 URL', 'https://lovetitle-timeline.vercel.app'],
    ],
  },
  ko: {
    title: '커스텀 도메인 · 타임라인 시각화',
    back: '← 도구로 돌아가기',
    heading: '커스텀 도메인',
    lede: 'lovetitle-timeline.vercel.app를 브랜드 URL(예: timeline.yourdomain.com)로 바꾸세요.',
    sections: [
      ['1. 도메인 준비', '등록기관에서 구매하거나 기존 도메인을 사용합니다.'],
      ['2. Vercel에 연결', 'Vercel 프로젝트 → Settings → Domains에서 추가하고 DNS(대개 CNAME → cname.vercel-dns.com)를 설정합니다.'],
      ['3. DNS 반영 대기', '수분~수시간. 커스텀 URL에서 HTTPS를 확인하세요.'],
      ['4. 로컬 브랜드', '도구 하단 브랜드 설정에서 사이트명·제목을 바꿉니다(이 기기 localStorage만).'],
      ['현재 공개 URL', 'https://lovetitle-timeline.vercel.app'],
    ],
  },
};

export function applyDomainPage(): void {
  const locale = parseLocale(localStorage.getItem('tv-locale'));
  const copy = COPY[locale];
  document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : locale;
  document.title = copy.title;
  const back = document.getElementById('i18n-back');
  const heading = document.getElementById('i18n-heading');
  const lede = document.getElementById('i18n-lede');
  if (back) back.textContent = copy.back;
  if (heading) heading.textContent = copy.heading;
  if (lede) lede.textContent = copy.lede;
  const root = document.getElementById('i18n-sections');
  if (root) {
    root.replaceChildren(...copy.sections.flatMap(([h, p]) => {
      const title = document.createElement('h2');
      title.textContent = h;
      const body = document.createElement('p');
      body.textContent = p;
      return [title, body];
    }));
  }
}
