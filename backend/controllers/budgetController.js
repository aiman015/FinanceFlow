const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @route GET /api/budgets?year=2026&month=7
const getBudgets = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const filter = { user: req.user._id };
  if (year) filter.year = Number(year);
  if (month !== undefined) filter.month = Number(month);

  const budgets = await Budget.find(filter).populate('category', 'name type icon color');

  // Attach live "spent" totals for convenience
  const withSpend = await Promise.all(
    budgets.map(async (b) => {
      const rangeStart = b.period === 'monthly' ? new Date(b.year, b.month, 1) : new Date(b.year, 0, 1);
      const rangeEnd =
        b.period === 'monthly' ? new Date(b.year, b.month + 1, 1) : new Date(b.year + 1, 0, 1);

      const agg = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            category: b.category._id,
            type: 'expense',
            date: { $gte: rangeStart, $lt: rangeEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      return { ...b.toObject(), spent: agg[0]?.total || 0 };
    })
  );

  res.json({ success: true, data: withSpend });
});

// @route POST /api/budgets
const createBudget = asyncHandler(async (req, res) => {
  const { category, limit, period, month, year } = req.body;
  const budget = await Budget.create({
    user: req.user._id,
    category,
    limit,
    period: period || 'monthly',
    month: period === 'yearly' ? undefined : month,
    year,
  });
  const populated = await budget.populate('category', 'name type icon color');
  res.status(201).json({ success: true, data: populated });
});

// @route PUT /api/budgets/:id
const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  const fields = ['limit', 'period', 'month', 'year'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) budget[f] = req.body[f];
  });
  // Limit changed → reset alert history so thresholds can re-fire against the new limit
  if (req.body.limit !== undefined) budget.alertsSent = [];
  await budget.save();
  const populated = await budget.populate('category', 'name type icon color');
  res.json({ success: true, data: populated });
});

// @route DELETE /api/budgets/:id
const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
