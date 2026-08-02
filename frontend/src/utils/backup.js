// Full-state backup/restore. Bundles everything the app persists to
// localStorage into a single portable JSON file.
export const BACKUP_VERSION = 1

export function buildBackup({ transactions, budgets, categories, settings, goals }) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { transactions, budgets, categories, settings, goals },
  }
}

/**
 * Validate a parsed backup object. Returns { valid, errors }.
 */
export function validateBackup(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['File is not a valid backup.'] }
  if (!obj.data || typeof obj.data !== 'object') { errors.push('Missing "data" section.'); return { valid: false, errors } }
  const { transactions, budgets, categories, settings } = obj.data
  if (transactions !== undefined && !Array.isArray(transactions)) errors.push('"transactions" must be a list.')
  if (categories !== undefined && !Array.isArray(categories)) errors.push('"categories" must be a list.')
  if (budgets !== undefined && typeof budgets !== 'object') errors.push('"budgets" must be an object.')
  if (settings !== undefined && typeof settings !== 'object') errors.push('"settings" must be an object.')
  return { valid: errors.length === 0, errors }
}
