// Centralized currency configuration + formatting.
// Every part of the app should format money through formatCurrency()
// instead of hand-building strings like `$${amount}` — that's what caused
// the sidebar/table currency symbols to drift out of sync in the first place.

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  { code: 'PKR', symbol: '₨', label: 'Pakistani Rupee', locale: 'en-PK' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar', locale: 'en-AU' },
]

export const DEFAULT_CURRENCY_CODE = 'USD'

export function getCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
}

/**
 * Older versions of this app stored a raw symbol (e.g. "$") in settings.currency.
 * Normalize any legacy value to a currency code so the rest of the app can
 * rely on settings.currency always being a code like "USD".
 */
export function normalizeCurrencyCode(value) {
  if (!value) return DEFAULT_CURRENCY_CODE
  if (CURRENCIES.some((c) => c.code === value)) return value
  const bySymbol = CURRENCIES.find((c) => c.symbol === value)
  return bySymbol ? bySymbol.code : DEFAULT_CURRENCY_CODE
}

/**
 * Format a numeric amount using the app-wide currency setting.
 * @param {number} amount
 * @param {string} currencyCode - e.g. 'USD', 'PKR' (falls back to settings.currency shape)
 * @param {object} [options]
 * @param {boolean} [options.signed] - prefix with +/- based on sign
 * @param {number} [options.maximumFractionDigits]
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY_CODE, options = {}) {
  const { signed = false, maximumFractionDigits = 0 } = options
  const value = Number(amount) || 0
  const currency = getCurrency(currencyCode)

  const formattedNumber = Math.abs(value).toLocaleString(currency.locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })

  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : ''
  return `${sign}${currency.symbol}${formattedNumber}`
}

/** Compact form for axes/labels, e.g. 12000 -> "$12k" */
export function formatCurrencyCompact(amount, currencyCode = DEFAULT_CURRENCY_CODE) {
  const currency = getCurrency(currencyCode)
  const value = Number(amount) || 0
  const abs = Math.abs(value)
  let short
  if (abs >= 1_000_000) short = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  else if (abs >= 1_000) short = `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  else short = `${value}`
  return `${currency.symbol}${short}`
}
