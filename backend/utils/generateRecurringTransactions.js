const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { checkBudgetAlerts } = require('./budgetAlerts');
const { computeNextRunDate } = require('./recurrence');

// Finds all recurring transaction rules that are due and generates the next
// real transaction for each, then advances nextRunDate. Safe to run
// repeatedly (e.g. via cron every hour) since it only acts on due rules.
async function generateDueRecurringTransactions() {
  const now = new Date();

  const dueRules = await Transaction.find({
    isRecurring: true,
    'recurrence.nextRunDate': { $lte: now },
    $or: [{ 'recurrence.endDate': null }, { 'recurrence.endDate': { $gte: now } }],
  });

  const created = [];

  for (const rule of dueRules) {
    const generated = await Transaction.create({
      user: rule.user,
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      description: rule.description,
      date: rule.recurrence.nextRunDate,
      isRecurring: false,
      generatedFrom: rule._id,
    });

    created.push(generated);

    if (generated.type === 'expense') {
      await checkBudgetAlerts({ userId: rule.user, categoryId: rule.category, date: generated.date });
    }

    await Notification.create({
      user: rule.user,
      type: 'recurring_generated',
      title: 'Recurring transaction added',
      message: `A recurring ${rule.type} of ${rule.amount.toFixed(2)} was added automatically.`,
      meta: { transactionId: generated._id, ruleId: rule._id },
    });

    rule.recurrence.lastGeneratedAt = now;
    rule.recurrence.nextRunDate = computeNextRunDate(
      rule.recurrence.nextRunDate,
      rule.recurrence.frequency,
      rule.recurrence.interval
    );
    await rule.save();
  }

  return created;
}

module.exports = { generateDueRecurringTransactions };
