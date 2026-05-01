/**
 * VEIL — VLESS Config Generator
 * ══════════════════════════════
 * Генерирует VLESS:// ссылки для подключения клиентов
 * Поддерживает Reality, XTLS-Vision, anti-DPI фрагментацию
 * Поддерживает Double VPN (chained tunnels)
 */

import { STEALTH_CONFIG } from './routing';

/**
 * Генерирует VLESS:// ссылку для клиента
 * @param {Object} params
 * @param {string} params.uuid - UUID пользователя
 * @param {string} params.host - IP или домен сервера
 * @param {number} params.port - Порт (443)
 * @param {string} params.publicKey - Reality publicKey
 * @param {string} params.shortId - Reality shortId
 * @param {string} params.serverName - SNI для маскировки
 * @param {string} params.name - Отображаемое имя
 * @returns {string} VLESS URL
 */
export function generateVlessUrl({
  uuid,
  host,
  port = 443,
  publicKey,
  shortId = '',
  serverName = 'www.microsoft.com',
  name = '🇩🇪 VEIL • Frankfurt',
  fingerprint = 'chrome',
}) {
  const params = new URLSearchParams({
    security: 'reality',
    encryption: 'none',
    pbk: publicKey,
    headerType: 'none',
    fp: fingerprint,
    type: 'tcp',
    flow: 'xtls-rprx-vision',
    sni: serverName,
    sid: shortId,
  });

  return `vless://${uuid}@${host}:${port}?${params.toString()}#${encodeURIComponent(name)}`;
}

/**
 * Генерирует Shadowsocks:// ссылку (fallback)
 */
export function generateShadowsocksUrl({
  password,
  host,
  port = 23456,
  method = '2022-blake3-aes-128-gcm',
  name = '🇩🇪 VEIL • Frankfurt SS',
}) {
  const userInfo = btoa(`${method}:${password}`);
  return `ss://${userInfo}@${host}:${port}#${encodeURIComponent(name)}`;
}

/**
 * Генерирует JSON конфиг для Hiddify/v2rayN с anti-DPI фрагментацией
 */
export function generateClientConfig({
  uuid,
  host,
  port = 443,
  publicKey,
  shortId = '',
  serverName = 'www.microsoft.com',
  enableFragment = false,
}) {
  const config = {
    remarks: '🇩🇪 VEIL • Frankfurt',
    outbounds: [
      {
        tag: 'proxy',
        protocol: 'vless',
        settings: {
          vnext: [{
            address: host,
            port: port,
            users: [{
              id: uuid,
              encryption: 'none',
              flow: 'xtls-rprx-vision',
            }],
          }],
        },
        streamSettings: {
          network: 'tcp',
          security: 'reality',
          realitySettings: {
            serverName: serverName,
            fingerprint: 'chrome',
            publicKey: publicKey,
            shortId: shortId,
            spiderX: '',
          },
        },
      },
      { tag: 'direct', protocol: 'freedom' },
      { tag: 'block', protocol: 'blackhole' },
    ],
    routing: {
      domainStrategy: 'AsIs',
      rules: [
        // Блокировка рекламы
        { type: 'field', domain: ['geosite:category-ads-all'], outboundTag: 'block' },
        // Российские сервисы — напрямую
        { type: 'field', domain: ['geosite:category-ru'], outboundTag: 'direct' },
        // Всё остальное — через прокси
        { type: 'field', port: '0-65535', outboundTag: 'proxy' },
      ],
    },
  };

  // Anti-DPI фрагментация (для XRay 1.8.4+)
  if (enableFragment) {
    config.outbounds[0].streamSettings.sockopt = {
      dialerProxy: 'fragment',
      tcpKeepAliveIdle: 100,
      mark: 255,
      tcpNoDelay: true,
    };
    config.outbounds.push({
      tag: 'fragment',
      protocol: 'freedom',
      settings: {
        fragment: {
          packets: 'tlshello',
          length: STEALTH_CONFIG.antiDPI.fragmentLength,
          interval: STEALTH_CONFIG.antiDPI.fragmentInterval,
        },
      },
    });
  }

  return config;
}

/**
 * Генерирует JSON конфиг Double VPN (chained tunnel)
 * Client → Server1 (entry) → Server2 (exit) → Internet
 * 
 * Entry-нода видит только зашифрованный трафик и IP клиента
 * Exit-нода видит только трафик к сайтам, но не IP клиента
 * 
 * @param {Object} params
 * @param {Object} params.entry - Конфигурация entry-сервера (первый hop)
 * @param {Object} params.exit - Конфигурация exit-сервера (второй hop)
 * @param {boolean} params.enableFragment - Включить anti-DPI фрагментацию
 * @returns {Object} XRay JSON config
 */
export function generateDoubleTunnelConfig({
  entry,
  exit,
  enableFragment = false,
}) {
  const config = {
    remarks: '🇩🇪 VEIL • Double Tunnel',
    outbounds: [
      // 1. Финальный выход через exit-сервер
      {
        tag: 'proxy-exit',
        protocol: 'vless',
        settings: {
          vnext: [{
            address: exit.host,
            port: exit.port || 443,
            users: [{
              id: exit.uuid,
              encryption: 'none',
              flow: 'xtls-rprx-vision',
            }],
          }],
        },
        streamSettings: {
          network: 'tcp',
          security: 'reality',
          realitySettings: {
            serverName: exit.serverName || 'www.microsoft.com',
            fingerprint: 'chrome',
            publicKey: exit.publicKey,
            shortId: exit.shortId || '',
            spiderX: '',
          },
          // Маршрутизировать через entry-ноду
          sockopt: {
            dialerProxy: 'proxy-entry',
          },
        },
      },
      // 2. Entry-сервер (первый hop) — выход в интернет через него
      {
        tag: 'proxy-entry',
        protocol: 'vless',
        settings: {
          vnext: [{
            address: entry.host,
            port: entry.port || 443,
            users: [{
              id: entry.uuid,
              encryption: 'none',
              flow: '',  // Без flow для chaining
            }],
          }],
        },
        streamSettings: {
          network: 'tcp',
          security: 'reality',
          realitySettings: {
            serverName: entry.serverName || 'dl.google.com',
            fingerprint: 'chrome',
            publicKey: entry.publicKey,
            shortId: entry.shortId || '',
            spiderX: '',
          },
        },
      },
      { tag: 'direct', protocol: 'freedom' },
      { tag: 'block', protocol: 'blackhole' },
    ],
    routing: {
      domainStrategy: 'AsIs',
      rules: [
        // Блокировка рекламы
        { type: 'field', domain: ['geosite:category-ads-all'], outboundTag: 'block' },
        // Российские сервисы — напрямую (банки не любят VPN)
        { type: 'field', domain: ['geosite:category-ru'], outboundTag: 'direct' },
        // Всё остальное — через двойной туннель
        { type: 'field', port: '0-65535', outboundTag: 'proxy-exit' },
      ],
    },
  };

  // Anti-DPI фрагментация на первом hop-е
  if (enableFragment) {
    config.outbounds[1].streamSettings.sockopt = {
      ...config.outbounds[1].streamSettings.sockopt,
      dialerProxy: 'fragment',
      tcpKeepAliveIdle: 100,
      tcpNoDelay: true,
    };
    config.outbounds.push({
      tag: 'fragment',
      protocol: 'freedom',
      settings: {
        fragment: {
          packets: 'tlshello',
          length: STEALTH_CONFIG.antiDPI.fragmentLength,
          interval: STEALTH_CONFIG.antiDPI.fragmentInterval,
        },
      },
    });
  }

  return config;
}

/**
 * Генерирует QR-код data URL из VLESS ссылки
 * Используется для удобного сканирования на других устройствах
 */
export async function generateQRCode(text) {
  // Используем публичный QR API (замени на локальную генерацию в продакшене)
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}&bgcolor=0a0a0f&color=6c5ce7`;
  return url;
}
