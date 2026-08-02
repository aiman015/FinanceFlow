// Shared limits so every form (and the context layer, as a defense-in-depth
// backstop) agrees on what counts as a valid amount or date.

export const MAX_AMOUNT = 999_999_999 // guards against accidental/absurd entries
export const MIN_AMOUNT = 0.01

export const isValidAmount = (value) => {
  const n = Number(value)
  return value !== '' && value !== null && !Number.isNaN(n) && n >= MIN_AMOUNT && n <= MAX_AMOUNT
}

// today's date in YYYY-MM-DD, matching <input type="date"> values
export const todayStr = () => new Date().toISOString().slice(0, 10)

export const isValidPastOrPresentDate = (value) => {
  if (!value) return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  return value <= todayStr()
}
