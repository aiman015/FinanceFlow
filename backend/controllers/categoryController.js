const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort({ type: 1, name: 1 });
  res.json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const category = await Category.create({ user: req.user._id, name, type, icon, color });
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const fields = ['name', 'type', 'icon', 'color'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  await category.save();
  res.json({ success: true, data: category });
});

// Deleting a category re-points its transactions to null rather than orphaning silently;
// the frontend already has an "Uncategorized" fallback pattern (see UNKNOWN_CATEGORY).
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const inUseCount = await Transaction.countDocuments({ user: req.user._id, category: category._id });

  res.json({ success: true, data: { id: req.params.id, affectedTransactions: inUseCount } });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
