import type { StoreInfo } from '../types';

/**
 * Decodes HTML entities (e.g. &#x20be; -> ₾, &euro; -> €, &pound; -> £)
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // Quick common entity replacement
  const commonMap: Record<string, string> = {
    '&#x20be;': '₾',
    '&#8382;': '₾',
    '&euro;': '€',
    '&#8364;': '€',
    '&#x20ac;': '€',
    '&pound;': '£',
    '&#163;': '£',
    '&#xa3;': '£',
    '&dollar;': '$',
    '&#36;': '$',
    '&#x24;': '$',
    '&yen;': '¥',
    '&#165;': '¥',
  };

  const lower = text.trim().toLowerCase();
  if (commonMap[lower]) {
    return commonMap[lower];
  }

  // General DOM parser decode
  if (typeof document !== 'undefined') {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.documentElement.textContent || text;
  }

  return text;
}

export function getCleanCurrencySymbol(storeInfo?: StoreInfo | null): string {
  if (storeInfo?.currency_symbol) {
    const decoded = decodeHtmlEntities(storeInfo.currency_symbol);
    if (decoded && !decoded.includes('&')) {
      return decoded;
    }
  }

  // Fallback by WooCommerce currency code
  const code = storeInfo?.currency?.toUpperCase();
  switch (code) {
    case 'GEL':
      return '₾';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'TRY':
      return '₺';
    case 'RUB':
      return '₽';
    case 'UAH':
      return '₴';
    case 'AZN':
      return '₼';
    case 'AMD':
      return '֏';
    default:
      return storeInfo?.currency || '₾';
  }
}

export function formatPrice(amount: number, storeInfo?: StoreInfo | null): string {
  const decimals = storeInfo?.decimals ?? 2;
  const decSep = storeInfo?.decimal_sep ?? ',';
  const thouSep = storeInfo?.thousand_sep ?? ' ';
  const symbol = getCleanCurrencySymbol(storeInfo);
  const pos = storeInfo?.currency_pos || 'right_space';

  const fixed = (amount || 0).toFixed(decimals);
  const parts = fixed.split('.');
  
  // Format thousands
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thouSep);
  const formattedNumber = parts.join(decSep);

  switch (pos) {
    case 'left':
      return `${symbol}${formattedNumber}`;
    case 'right':
      return `${formattedNumber}${symbol}`;
    case 'left_space':
      return `${symbol} ${formattedNumber}`;
    case 'right_space':
    default:
      return `${formattedNumber} ${symbol}`;
  }
}

export function formatDate(timestampOrStr: number | string): string {
  if (!timestampOrStr) return '';
  const date = typeof timestampOrStr === 'number' ? new Date(timestampOrStr * 1000) : new Date(timestampOrStr);
  return date.toLocaleString('ka-GE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
