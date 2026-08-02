const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const { checkBudgetAlerts } = require('../utils/budgetAlerts');
const { computeNextRunDate } = require('../utils/recurrence');

// @route GET /api/transactions
// Supports: page, limit, search, type, category (comma-separated), dateFrom, dateTo,
// amountMin, amountMax, sortBy, sortOrder
const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    type,
    category,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const filter = { user: req.user._id };

  if (search) filter.description = { $regex: search, $options: 'i' };
  if (type) filter.type = type;
  if (category) filter.category = { $in: category.split(',') };

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  if (amountMin || amountMax) {
    filter.amount = {};
    if (amountMin) filter.amount.$gte = Number(amountMin);
    if (amountMax) filter.amount.$lte = Number(amountMax);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', 'name type icon color')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// @route GET /api/transactions/:id
const getTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'category',
    'name type icon color'
  );
  if (!tx) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ success: true, data: tx });
});

// @route POST /api/transactions
const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, description, date, isRecurring, recurrence } = req.body;

  const payload = {
    user: req.user._id,
    type,
    amount,
    category,
    description,
    date: date || Date.now(),
    isRecurring: !!isRecurring,
  };

  if (isRecurring && recurrence) {
    payload.recurrence = {
      frequency: recurrence.frequency || 'monthly',
      interval: recurrence.interval || 1,
      endDate: recurrence.endDate || null,
      nextRunDate: computeNextRunDate(new Date(date || Date.now()), recurrence.frequency || 'monthly', recurrence.interval || 1),
    };
  }

  const tx = await Transaction.create(payload);

  if (tx.type === 'expense') {
    await checkBudgetAlerts({ userId: req.user._id, categoryId: tx.category, date: tx.date });
  }

  const populated = await tx.populate('category', 'name type icon color');
  res.status(201).json({ success: true, data: populated });
});

// @route PUT /api/transactions/:id
const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  const fields = ['type', 'amount', 'category', 'description', 'date', 'isRecurring'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) tx[f] = req.body[f];
  });

  if (req.body.recurrence) {
    tx.recurrence = { ...tx.recurrence.toObject(), ...req.body.recurrence };
  }

  await tx.save();

  if (tx.type === 'expense') {
    await checkBudgetAlerts({ userId: req.user._id, categoryId: tx.category, date: tx.date });
  }

  const populated = await tx.populate('category', 'name type icon color');
  res.json({ success: true, data: populated });
});

// @route DELETE /api/transactions/:id
const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ success: true, data: { id: req.params.id } });
});

// @route POST /api/transactions/bulk-delete
const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    res.status(400);
    throw new Error('ids must be a non-empty array');
  }
  const result = await Transaction.deleteMany({ _id: { $in: ids }, user: req.user._id });
  res.json({ success: true, deletedCount: result.deletedCount });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
};
