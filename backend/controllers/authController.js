const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Category = require('../models/Category');
const DEFAULT_CATEGORIES = require('../utils/defaultCategories');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });

  // Seed default categories for the new user so the app isn't empty on first login
  const seeded = DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id }));
  await Category.insertMany(seeded);

  res.status(201).json({
    success: true,
    token: signToken(user._id),
    user: user.toSafeObject(),
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    token: signToken(user._id),
    user: user.toSafeObject(),
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @route PUT /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, currency } = req.body;
  if (name !== undefined) req.user.name = name;
  if (currency !== undefined) req.user.currency = currency;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe, updateMe };
