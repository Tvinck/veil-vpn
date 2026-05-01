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
  // ══════════════════════════════════════════════
  // 🏦 БАНКИ — блокируют VPN! Обязательно DIRECT
  // ══════════════════════════════════════════════
  // Сбер
  'sberbank.ru', 'online.sberbank.ru', 'sber.ru', 'sberbank.com',
  'sbermarket.ru', 'sber-zvuk.com', 'sberdevices.ru',
  'sberinsur.ru', 'sberhealth.ru', 'domclick.ru',
  'sberlogistics.ru', 'sberauto.com', 'okko.tv',
  // Тинькофф/T-Bank
  'tinkoff.ru', 'tbank.ru', 'tinkoff.com',
  'tinkoff-bank.ru', 'tinkoff.business',
  // Альфа
  'alfabank.ru', 'alfa-bank.ru', 'alfabank.com',
  'alfadirect.ru', 'alfa.me',
  // ВТБ
  'vtb.ru', 'online.vtb.ru', 'vtb24.ru', 'vtbbo.ru',
  // Другие банки
  'raiffeisen.ru', 'raiffeisenbank.ru',
  'gazprombank.ru', 'gpb.ru', 'gpbm.ru',
  'psb.ru', 'psbank.ru',
  'open.ru', 'openbank.ru',
  'sovcombank.ru', 'halvacard.ru',
  'mkb.ru', 'rosbank.ru', 'unicreditbank.ru',
  'uralsib.ru', 'rshb.ru', 'privetmir.ru',
  'homecredit.ru', 'otpbank.ru', 'pochtabank.ru',
  'citibank.ru', 'tochka.com', 'modulbank.ru',
  'rocketbank.ru', 'qiwi.com',
  // Платёжные системы
  'mir-payment.ru', 'nspk.ru', 'mirconnect.ru',
  'cbr.ru', 'centralbank.ru',
  'sbp.nspk.ru',                          // СБП (Система Быстрых Платежей)
  'pay.yandex.ru', 'money.yandex.ru',     // Яндекс Пэй
  'paymo.ru', 'cloudpayments.ru',
  'robokassa.ru', 'sberbank.online',
  
  // ══════════════════════════════════════════════
  // 🏛️ ГОСУСЛУГИ — детектят VPN! Полный обход
  // ══════════════════════════════════════════════
  // Основной портал
  'gosuslugi.ru', 'www.gosuslugi.ru',
  'esia.gosuslugi.ru',                     // Единая система идентификации (ЕСИА)
  'lk.gosuslugi.ru',                       // Личный кабинет
  'pos.gosuslugi.ru',                      // Точка оказания услуг
  'sms.gosuslugi.ru',                      // SMS-уведомления
  'api.gosuslugi.ru',                      // API
  'mp.gosuslugi.ru',                       // Мобильный
  'dom.gosuslugi.ru',                      // ГИС ЖКХ
  'statement.gosuslugi.ru',                // Выписки
  'partners.gosuslugi.ru',                 // Партнёры
  
  // Региональные порталы
  'mos.ru', 'my.mos.ru', 'ag.mos.ru',     // Москва
  'uslugi.mosreg.ru', 'mosreg.ru',        // Московская область
  'gu.spb.ru', 'spb.ru',                  // Санкт-Петербург
  'gosuslugi71.ru',                        // Тульская область
  'pgu.krasnodar.ru',                      // Краснодарский край
  
  // ФНС (Налоговая)
  'nalog.gov.ru', 'nalog.ru',
  'lkfl2.nalog.ru',                        // ЛК физ. лица
  'lkul.nalog.ru',                         // ЛК юр. лица
  'lkip.nalog.ru',                         // ЛК ИП
  'npd.nalog.ru',                          // Самозанятые (Мой налог)
  'pb.nalog.ru',                           // Проверка бизнеса
  'kkt-online.nalog.ru',                   // Онлайн-кассы
  'fns.gov.ru',
  
  // Пенсионный / Социальный фонд
  'pfr.gov.ru', 'sfr.gov.ru', 'es.pfrf.ru',
  'lk.sfr.gov.ru',                        // ЛК Соц. фонда
  
  // Росреестр
  'rosreestr.gov.ru', 'rosreestr.ru',
  'pkk.rosreestr.ru',                     // Публичная кадастровая карта
  'portal.rosreestr.ru',
  
  // Суды / Правосудие
  'sudrf.ru', 'kad.arbitr.ru',
  'arbitr.ru', 'efile.sudrf.ru',
  'vsrf.ru', 'cdlsrf.ru',
  
  // МВД / ГИБДД / Миграция
  'mvd.gov.ru', 'gibdd.ru',
  'гувм.мвд.рф',
  'fms.gov.ru', 'ufms.gov.ru',
  'fssprus.ru', 'fssp.gov.ru',            // Судебные приставы
  
  // Другие госорганы
  'zakupki.gov.ru', 'torgi.gov.ru',       // Госзакупки
  'rpn.gov.ru', 'fas.gov.ru',             // Роспотребнадзор, ФАС
  'customs.gov.ru', 'alta.ru',            // Таможня
  'minzdrav.gov.ru',                       // Минздрав
  'edu.gov.ru', 'minobrnauki.gov.ru',     // Образование
  'mintrud.gov.ru',                        // Минтруд
  'economy.gov.ru',                        // Минэкономразвития
  'government.ru', 'kremlin.ru',           // Правительство
  'duma.gov.ru',                           // Госдума
  'rkn.gov.ru',                            // Роскомнадзор
  'mchs.gov.ru',                           // МЧС
  'mil.ru',                                // Минобороны
  'genproc.gov.ru',                        // Генпрокуратура
  'cbr.ru', 'centralbank.ru',             // Центробанк
  
  // ══════════════════════════════════════════════
  // 🏥 ЗДОРОВЬЕ / МЕДИЦИНА — VPN блокируют!
  // ══════════════════════════════════════════════
  'emias.info', 'emias.mos.ru',            // ЕМИАС (Москва)
  'gosuslugi.doctor',                      // Запись к врачу
  'apteka.ru', 'zdravcity.ru',
  'eapteka.ru', 'piluli.ru',
  'gorzdrav.org',                          // Горздрав аптеки
  'invitro.ru', 'gemotest.ru',            // Лаборатории
  'helix.ru', 'kdl.ru',
  'docplus.ru', 'docdoc.ru',              // Онлайн-запись
  'sberhealth.ru', 'telemed.ru',          // Телемедицина
  
  // ══════════════════════════════════════════════
  // 🛡️ СТРАХОВАНИЕ — детектят VPN
  // ══════════════════════════════════════════════
  'ingos.ru', 'rgs.ru', 'alfastrah.ru',
  'sogaz.ru', 'sberins.ru',
  'reso.ru', 'vsk.ru',
  'e-osago.ru', 'osago.ru',               // ОСАГО онлайн
  
  // ══════════════════════════════════════════════
  // 📱 РОССИЙСКИЕ СОЦСЕТИ / СЕРВИСЫ
  // ══════════════════════════════════════════════
  'vk.com', 'vk.ru', 'vkontakte.ru', 'vk.me', 'vk.cc',
  'vkusvill.ru', 'vkcdn.me', 'userapi.com',
  'vk-cdn.net', 'vkuser.net',
  'ok.ru', 'odnoklassniki.ru', 'odkl.ru',
  'mail.ru', 'e.mail.ru', 'go.mail.ru', 'my.mail.ru',
  'list.ru', 'bk.ru', 'inbox.ru',         // Mail.ru почта домены
  'cloud.mail.ru',                         // Mail.ru облако
  'yandex.ru', 'ya.ru', 'yandex.com', 'yandex.net',
  'yastatic.net', 'yandex.st',            // Яндекс CDN
  'dzen.ru', 'zen.yandex.ru',
  'kinopoisk.ru', 'hd.kinopoisk.ru',
  'music.yandex.ru', 'disk.yandex.ru',
  'cloud.yandex.ru', 'tracker.yandex.ru',
  'metrika.yandex.ru', 'mc.yandex.ru',    // Яндекс Метрика
  'passport.yandex.ru',                    // Яндекс паспорт
  'id.yandex.ru',                          // Яндекс ID
  'wordstat.yandex.ru',                    // Вордстат
  'direct.yandex.ru',                      // Яндекс Директ
  'webmaster.yandex.ru',                   // Вебмастер
  'connect.yandex.ru',                     // Яндекс 360
  'rutube.ru',
  
  // ══════════════════════════════════════════════
  // 🛒 МАРКЕТПЛЕЙСЫ
  // ══════════════════════════════════════════════
  'wildberries.ru', 'wb.ru', 'wbx-content.ru', 'wbstatic.net',
  'ozon.ru', 'ozon.st', 'cdn.ozon.ru', 'ozon-seller.ru',
  'avito.ru', 'avito.st',
  'lamoda.ru', 'megamarket.ru',
  'sbermegamarket.ru', 'market.yandex.ru',
  'dns-shop.ru', 'mvideo.ru', 'eldorado.ru',
  'citilink.ru', 'regard.ru',
  'kassir.ru', 'afisha.ru',               // Билеты
  'obi.ru', 'leroymerlin.ru',             // Строительные
  '2gis.ru', '2gis.com',                  // 2ГИС карты
  
  // ══════════════════════════════════════════════
  // 📡 ТЕЛЕКОМ / ОПЕРАТОРЫ
  // ══════════════════════════════════════════════
  'mts.ru', 'megafon.ru', 'beeline.ru',
  'tele2.ru', 't2.ru',
  'rt.ru', 'rostelecom.ru', 'lk.rt.ru',
  'yota.ru', 'motiv.ru',
  'dom.ru',                                // Дом.ру
  'ttk.ru',                                // ТТК
  'er-telecom.ru',                         // ЭР-Телеком
  
  // ══════════════════════════════════════════════
  // 🚕 ДОСТАВКА / ТАКСИ / ЕДА
  // ══════════════════════════════════════════════
  'taxi.yandex.ru', 'go.yandex.ru',
  'eda.yandex.ru', 'eats.yandex.ru',
  'lavka.yandex.ru',                       // Яндекс Лавка
  'delivery-club.ru',
  'cdek.ru', 'pochta.ru', 'boxberry.ru',
  'dpd.ru', 'pecom.ru', 'dellin.ru',
  'samokat.ru',                            // Самокат
  'sbermarket.ru',                         // СберМаркет
  'vprok.ru',                              // Впрок (Перекрёсток)
  
  // ══════════════════════════════════════════════
  // 🎬 РОССИЙСКИЙ КОНТЕНТ / СТРИМИНГ
  // ══════════════════════════════════════════════
  'ivi.ru', 'okko.tv', 'premier.one',
  'more.tv', 'wink.ru', 'start.ru',
  'kion.ru', 'smotrim.ru',
  'amediateka.ru',                         // Амедиатека
  'megogo.ru',                             // Megogo
  
  // ══════════════════════════════════════════════
  // 📲 TELEGRAM DC (ПОЛНЫЙ bypass)
  // ══════════════════════════════════════════════
  'telegram.org', 'web.telegram.org', 't.me',
  'core.telegram.org', 'telegram.me',
  'api.telegram.org',
  'updates.telegram.org',
  'desktop.telegram.org', 'macos.telegram.org',
  'td.telegram.org',
  'cdn1.telegram.org', 'cdn2.telegram.org', 'cdn3.telegram.org',
  'cdn4.telegram.org', 'cdn5.telegram.org',
  'contest.com', 'fragment.com',
  'tonapi.io', 'toncenter.com',
  
  // ══════════════════════════════════════════════
  // 📞 МЕССЕНДЖЕРЫ (работающие в РФ)
  // ══════════════════════════════════════════════
  'web.whatsapp.com', 'whatsapp.com', 'whatsapp.net',
  'viber.com', 'viber.media',
  
  // ══════════════════════════════════════════════
  // 🏫 ОБРАЗОВАНИЕ / РАБОТА
  // ══════════════════════════════════════════════
  'hh.ru', 'headhunter.ru',
  'superjob.ru', 'rabota.ru', 'trudvsem.ru',
  'stepik.org', 'skillbox.ru',
  'geekbrains.ru', 'practicum.yandex.ru',
  'netology.ru', 'foxford.ru',
  'skyeng.ru', 'skysmart.ru',
  'uchi.ru',                               // Учи.ру
  '1c.ru', '1c-bitrix.ru',               // 1С
  'school.mosreg.ru', 'dnevnik.ru',       // Электронные дневники
  'sberclass.ru',                          // СберКласс
  
  // ══════════════════════════════════════════════
  // 💊 АПТЕКИ / ЛАБОРАТОРИИ
  // ══════════════════════════════════════════════
  'apteka.ru', 'zdravcity.ru',
  'eapteka.ru', 'gorzdrav.org',
  'invitro.ru', 'gemotest.ru',
  'helix.ru', 'kdl.ru',
  
  // ══════════════════════════════════════════════
  // 🏠 ЖКХ / НЕДВИЖИМОСТЬ
  // ══════════════════════════════════════════════
  'domclick.ru',                           // ДомКлик (Сбер)
  'cian.ru',                               // ЦИАН
  'domofond.ru', 'yandex.ru/realty',
  'reformagkh.ru',                         // Реформа ЖКХ
  'gis-zkh.ru',                            // ГИС ЖКХ
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
  
  // ── 🔍 Google / YouTube (замедление мобильными операторами) ──
  // Критично: МТС, Мегафон, Билайн замедляют через DPI по SNI/IP
  // Все Google CDN-домены ОБЯЗАТЕЛЬНО через VPN-туннель
  'google.com', 'www.google.com', 'google.ru', 'google.de',
  'googleapis.com', 'www.googleapis.com',   // Google API (загрузка данных)
  'gstatic.com', 'www.gstatic.com',         // Google Static CDN
  'googleusercontent.com',                    // Google User Content
  'googlesyndication.com',                    // Google Ads (может блокироваться)
  'googleadservices.com',                     // Google Ad Services
  'google-analytics.com',                     // Analytics

  // ── 📺 YouTube (ПОЛНЫЙ CDN bypass) ──
  'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com',
  'music.youtube.com',                        // YouTube Music
  'studio.youtube.com',                       // YouTube Studio
  'tv.youtube.com',                           // YouTube TV
  'ytimg.com', 'i.ytimg.com', 's.ytimg.com', // Превью/обложки видео
  'ggpht.com',                                // Google Photo Hosting
  'googlevideo.com',                          // YouTube CDN основной
  'youtube-nocookie.com',                     // YouTube Embed без кук
  'youtubekids.com',                          // YouTube Kids
  'youtube-ui.l.google.com',                  // YouTube UI CDN
  'wide-youtube.l.google.com',               // YouTube Wide CDN
  // YouTube video CDN серверы (sn-*.googlevideo.com через wildcard)
  // Hiddify поддерживает wildcard: *.googlevideo.com
  
  // ── 📧 Google сервисы ──
  'gmail.com', 'mail.google.com',
  'drive.google.com', 'docs.google.com',
  'sheets.google.com', 'slides.google.com',
  'meet.google.com', 'calendar.google.com',
  'translate.google.com', 'play.google.com',
  'maps.google.com', 'photos.google.com',
  'accounts.google.com', 'myaccount.google.com',
  'fonts.googleapis.com', 'fonts.gstatic.com',  // Google Fonts
  'lh3.googleusercontent.com',                  // Google Photos CDN
  'storage.googleapis.com',                      // Google Cloud Storage
  
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
    features: ['Все серверы', 'Безлимитный трафик', 'Smart Routing', 'До 3 устройств', 'Double VPN', 'Shadowsocks fallback', 'Anti-DPI фрагментация'],
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
