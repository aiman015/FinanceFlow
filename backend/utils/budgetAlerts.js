const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const THRESHOLDS = [50, 90, 100];

/**
 * Checks all budgets that apply to the given date/category for a user,
 * sums actual spend, and creates a Notification the first time a threshold
 * (50% / 90% / 100%) is crossed. Call this after creating/updating an
 * expense transaction.
 */
async function checkBudgetAlerts({ userId, categoryId, date }) {
  const d = new Date(date);
  const month = d.getMonth();
  const year = d.getFullYear();

  const budgets = await Budget.find({
    user: userId,
    category: categoryId,
    year,
    $or: [{ period: 'yearly' }, { period: 'monthly', month }],
  });

  if (!budgets.length) return;

  for (const budget of budgets) {
    const rangeStart =
      budget.period === 'monthly' ? new Date(year, month, 1) : new Date(year, 0, 1);
    const rangeEnd =
      budget.period === 'monthly' ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1);

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: budget.user,
          category: budget.category,
          type: 'expense',
          date: { $gte: rangeStart, $lt: rangeEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = agg[0]?.total || 0;
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    for (const threshold of THRESHOLDS) {
      if (pct >= threshold && !budget.alertsSent.includes(threshold)) {
        budget.alertsSent.push(threshold);
        await Notification.create({
          user: budget.user,
          type: 'budget_alert',
          title: threshold >= 100 ? 'Budget exceeded' : 'Budget alert',
          message:
            threshold >= 100
              ? `You've exceeded your budget for this category (${spent.toFixed(2)} / ${budget.limit.toFixed(2)}).`
              : `You've used ${threshold}% of your budget for this category (${spent.toFixed(2)} / ${budget.limit.toFixed(2)}).`,
          meta: { budgetId: budget._id, categoryId: budget.category, spent, limit: budget.limit, threshold },
        });
      }
    }

    await budget.save();
  }
}

module.exports = { checkBudgetAlerts, THRESHOLDS };
