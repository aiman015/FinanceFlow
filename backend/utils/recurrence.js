// Computes the next occurrence date for a recurring transaction rule.
function computeNextRunDate(fromDate, frequency, interval = 1) {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
    case 'monthly':
    default:
      next.setMonth(next.getMonth() + interval);
      break;
  }
  return next;
}

module.exports = { computeNextRunDate };
