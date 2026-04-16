/**
 * VEIL — Smart Routing Configuration
 * ════════════════════════════════════
 * DIRECT = идёт напрямую (российские сервисы, банки, госуслуги)
 * PROXY  = идёт через зашифрованный туннель (заблокированные)
 * 
 * Домены группируются по wildcard: *.domain.tld
 * На клиенте (Hiddify/v2rayN) используются как geosite/domain rules
 */

// ═══════════════════════════════════════════
// DIRECT — обходят прокси (банки блокируют VPN!)
// ═══════════════════════════════════════════
export const DIRECT_DOMAINS = [
  // ── 🏦 Банки (обязательно!) ──
  'sberbank.ru', 'online.sberbank.ru', 'sber.ru', 'sberbank.com',
  'tinkoff.ru', 'tbank.ru', 'tinkoff.com',
  'alfabank.ru', 'alfa-bank.ru', 'alfabank.com',
  'vtb.ru', 'online.vtb.ru', 'vtb24.ru',
  'raiffeisen.ru', 'raiffeisenbank.ru',
  'gazprombank.ru', 'gpb.ru',
  'psb.ru', 'psbank.ru',
  'open.ru', 'openbank.ru',
  'sovcombank.ru', 'halvacard.ru',
  'mkb.ru', 'rosbank.ru', 'unicreditbank.ru',
  'uralsib.ru', 'rshb.ru', 'privetmir.ru',
  'mir-payment.ru', 'nspk.ru',
  'cbr.ru', 'centralbank.ru',
  
  // ── 🏛️ Госуслуги / Госорганы ──
  'gosuslugi.ru', 'esia.gosuslugi.ru', 'lk.gosuslugi.ru',
  'mos.ru', 'uslugi.mosreg.ru',
  'nalog.gov.ru', 'nalog.ru', 'lkfl2.nalog.ru',
  'pfr.gov.ru', 'sfr.gov.ru', 'es.pfrf.ru',
  'rosreestr.gov.ru', 'rosreestr.ru',
  'fns.gov.ru', 'fssprus.ru',
  'mvd.gov.ru', 'gibdd.ru',
  'zakupki.gov.ru', 'torgi.gov.ru',
  'rpn.gov.ru', 'fas.gov.ru',
  'sudrf.ru', ' kad.arbitr.ru',
  'fms.gov.ru', 'ufms.gov.ru',
  
  // ── 📱 Российские соцсети ──
  'vk.com', 'vk.ru', 'vkontakte.ru', 'vk.me', 'vk.cc',
  'vkusvill.ru', 'vkcdn.me',
  'ok.ru', 'odnoklassniki.ru', 'odkl.ru',
  'mail.ru', 'e.mail.ru', 'go.mail.ru', 'my.mail.ru',
  'yandex.ru', 'ya.ru', 'yandex.com', 'yandex.net',
  'dzen.ru', 'zen.yandex.ru',
  'kinopoisk.ru', 'hd.kinopoisk.ru',
  'music.yandex.ru', 'disk.yandex.ru',
  'cloud.yandex.ru', 'tracker.yandex.ru',
  'rutube.ru',
  
  // ── 🛒 Маркетплейсы ──
  'wildberries.ru', 'wb.ru', 'wbx-content.ru',
  'ozon.ru', 'ozon.st', 'cdn.ozon.ru',
  'avito.ru', 'avito.st',
  'lamoda.ru', 'megamarket.ru',
  'sbermegamarket.ru', 'market.yandex.ru',
  'dns-shop.ru', 'mvideo.ru', 'eldorado.ru',
  'citilink.ru', 'regard.ru',
  
  // ── 📡 Телеком / Операторы ──
  'mts.ru', 'megafon.ru', 'beeline.ru',
  'tele2.ru', 't2.ru',
  'rt.ru', 'rostelecom.ru', 'lk.rt.ru',
  'yota.ru', 'motiv.ru', 'tele2.com',
  
  // ── 🚕 Доставка / Такси / Еда ──
  'taxi.yandex.ru', 'go.yandex.ru',
  'eda.yandex.ru', 'eats.yandex.ru',
  'delivery-club.ru',
  'cdek.ru', 'pochta.ru', 'boxberry.ru',
  'dpd.ru', 'pecom.ru', 'dellin.ru',
  
  // ── 🎬 Российский контент ──
  'ivi.ru', 'okko.tv', 'premier.one',
  'more.tv', 'wink.ru', 'start.ru',
  'kion.ru', 'smotrim.ru',
  
  // ── 📲 Telegram DC Infrastructure (ПОЛНЫЙ bypass) ──
  // Критично: если у юзера включён Telegram Proxy + VPN = конфликт
  // Решение: весь Telegram-трафик идёт напрямую
  'telegram.org', 'web.telegram.org', 't.me',
  'core.telegram.org', 'telegram.me',
  'api.telegram.org',                    // Bot API
  'updates.telegram.org',                // Обновления клиента
  'desktop.telegram.org',                // Desktop клиент  
  'macos.telegram.org',                  // macOS клиент
  'td.telegram.org',                     // TDLib
  'cdn1.telegram.org', 'cdn2.telegram.org', 'cdn3.telegram.org',
  'cdn4.telegram.org', 'cdn5.telegram.org',
  'contest.com',                         // Telegram contest
  'fragment.com',                        // Fragment (TON/usernames)
  'tonapi.io',                           // TON API  
  'toncenter.com',                       // TON Center
  
  // ── 📞 WhatsApp / Viber ──
  'web.whatsapp.com', 'whatsapp.com', 'whatsapp.net',
  'viber.com',
  
  // ── 🏫 Образование / Работа ──
  'hh.ru', 'headhunter.ru',
  'superjob.ru', 'rabota.ru',
  'stepik.org', 'skillbox.ru',
  'geekbrains.ru', 'practicum.yandex.ru',
  
  // ── 💊 Здоровье ──
  'emias.info', 'gosuslugi.doctor',
  'apteka.ru', 'zdravcity.ru',
];

// ═══════════════════════════════════════════
// PROXY — всегда через зашифрованный туннель
// ═══════════════════════════════════════════
export const PROXY_DOMAINS = [
  // ── 📸 Заблокированные соцсети ──
  'instagram.com', 'www.instagram.com', 'i.instagram.com', 'cdninstagram.com',
  'facebook.com', 'www.facebook.com', 'fb.com', 'fbcdn.net', 'fbsbx.com',
  'twitter.com', 'x.com', 'mobile.twitter.com', 'twimg.com', 'abs.twimg.com',
  'linkedin.com', 'www.linkedin.com',
  'threads.net', 'www.threads.net',
  'pinterest.com', 'pinterest.ru',
  
  // ── 💬 Мессенджеры (проблемные) ──
  'discord.com', 'discord.gg', 'discordapp.com', 'cdn.discordapp.com', 'discord.media',
  'signal.org', 'signal.group', 'signal.art',
  
  // ── 📰 Контент / Медиа ──
  'medium.com', 'bbc.com', 'bbc.co.uk',
  'cnn.com', 'nytimes.com', 'reuters.com',
  'theguardian.com', 'washingtonpost.com',
  'meduza.io', 'novayagazeta.eu',
  'soundcloud.com',
  
  // ── 🎬 Стриминг ──
  'netflix.com', 'nflxvideo.net', 'nflximg.net',
  'spotify.com', 'scdn.co', 'spotifycdn.com',
  'disneyplus.com', 'hulu.com',
  'twitch.tv', 'ttvnw.net',
  'crunchyroll.com',
  
  // ── 🤖 AI / ML сервисы ──
  'openai.com', 'chat.openai.com', 'chatgpt.com', 'api.openai.com',
  'anthropic.com', 'claude.ai', 'api.anthropic.com',
  'bard.google.com', 'gemini.google.com', 'aistudio.google.com',
  'perplexity.ai', 'midjourney.com',
  'stability.ai', 'replicate.com',
  'huggingface.co', 'hf.co',
  'notebooklm.google.com',
  'suno.com', 'suno.ai',
  'cursor.sh', 'cursor.com',
  
  // ── 💻 Dev / Tech ──
  'github.com', 'githubusercontent.com', 'github.io', 'ghcr.io',
  'github.dev', 'copilot.github.com',
  'stackoverflow.com', 'stackexchange.com',
  'npmjs.com', 'registry.npmjs.org',
  'docker.com', 'hub.docker.com', 'docker.io',
  'pypi.org', 'pypi.python.org',
  'vercel.com', 'vercel.app',
  'netlify.com', 'netlify.app',
  'render.com', 'railway.app',
  'supabase.com', 'supabase.co',
  'gitlab.com',
  'bitbucket.org',
  'figma.com',
  'notion.so', 'notion.site',
  
  // ── 🔍 Google (замедление/блокировка) ──
  'google.com', 'www.google.com', 'google.ru',
  'youtube.com', 'www.youtube.com', 'youtu.be',
  'ytimg.com', 'ggpht.com', 'googlevideo.com',
  'gmail.com', 'mail.google.com',
  'drive.google.com', 'docs.google.com',
  'sheets.google.com', 'slides.google.com',
  'meet.google.com', 'calendar.google.com',
  'translate.google.com', 'play.google.com',
  'maps.google.com', 'photos.google.com',
  'accounts.google.com', 'myaccount.google.com',
  
  // ── 🍎 Apple (iCloud, App Store) ──
  'apple.com', 'icloud.com', 'appleid.apple.com',
  'apps.apple.com', 'itunes.apple.com',
  'mzstatic.com',
  
  // ── 🎮 Gaming ──
  'store.steampowered.com', 'steamcommunity.com', 'steamcdn-a.akamaihd.net',
  'epicgames.com', 'unrealengine.com',
  'riotgames.com', 'leagueoflegends.com',
  
  // ── 💰 Crypto ──
  'binance.com', 'bybit.com',
  'coinbase.com', 'kraken.com',
  'metamask.io', 'phantom.app',
  'coingecko.com', 'coinmarketcap.com',
  
  // ── 📧 Почта (зарубежная) ──
  'proton.me', 'protonmail.com',
  'tutanota.com', 'tuta.com',
  'outlook.com', 'live.com',
];

// ═══════════════════════════════════════════
// XRay конфигурация шаблонов маскировки
// ═══════════════════════════════════════════
export const STEALTH_CONFIG = {
  // SNI для маскировки — домены крупных компаний
  // которые точно не заблокируют (Microsoft, Apple, Amazon)
  sniTargets: [
    'www.microsoft.com',      // Основной — самый безопасный
    'www.apple.com',          // Резервный
    'www.amazon.com',         // Резервный
    'www.cloudflare.com',     // Резервный
    'dl.google.com',          // Google Downloads
  ],
  
  fingerprints: [
    'chrome',      // Основной — 65% рынка
    'firefox',     // Резерв
    'safari',      // Для iOS
    'randomized',  // Рандомный отпечаток
  ],
  
  // XTLS flow — zero-copy шифрование
  flow: 'xtls-rprx-vision',
  
  // Alpn для маскировки
  alpn: ['h2', 'http/1.1'],
  
  // Настройки anti-DPI
  antiDPI: {
    fragmentLength: '100-200',   // Фрагментация TLS ClientHello
    fragmentInterval: '10-20',   // Интервал между фрагментами (ms)
    enableMux: false,            // Mux выключен — легче детектить
    enablePadding: true,         // Padding для маскировки длины
  },
};

// ═══════════════════════════════════════════
// Тарифы
// ═══════════════════════════════════════════
export const PLANS = {
  trial: {
    name: 'Trial',
    nameRu: 'Пробный',
    days: 3,
    price: 0,
    maxDevices: 1,
    trafficLimit: '5 ГБ/день',
    features: ['1 сервер', 'До 5 ГБ/день', 'Smart Routing'],
  },
  basic: {
    name: 'Basic',
    nameRu: 'Базовый',
    days: 30,
    priceRub: 299,
    priceStars: 75,
    maxDevices: 1,
    trafficLimit: null, // безлимит
    features: ['Все серверы', 'Безлимитный трафик', 'Smart Routing', 'Приоритетная поддержка'],
  },
  pro: {
    name: 'Pro',
    nameRu: 'Про',
    days: 30,
    priceRub: 499,
    priceStars: 125,
    maxDevices: 3,
    trafficLimit: null,
    features: ['Все серверы', 'Безлимитный трафик', 'Smart Routing', 'До 3 устройств', 'Shadowsocks fallback', 'Anti-DPI фрагментация'],
  },
};

// Серверы
export const DEFAULT_SERVERS = [
  { country_code: 'NL', country_name: 'Нидерланды', flag_emoji: '🇳🇱', name: 'Amsterdam-1' },
  { country_code: 'DE', country_name: 'Германия', flag_emoji: '🇩🇪', name: 'Frankfurt-1' },
  { country_code: 'FI', country_name: 'Финляндия', flag_emoji: '🇫🇮', name: 'Helsinki-1' },
];

// Telegram DC IP ranges — для XRay server routing bypass
export const TELEGRAM_DC_IPS = [
  '149.154.160.0/20',   // DC1-DC5 основные
  '91.108.4.0/22',      // DC дополнительные
  '91.108.8.0/22',
  '91.108.12.0/22',
  '91.108.16.0/22',
  '91.108.20.0/22',
  '91.108.56.0/22',
  '91.108.52.0/23',
  '95.161.64.0/20',     // Telegram CDN
];
