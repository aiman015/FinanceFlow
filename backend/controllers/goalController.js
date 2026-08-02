const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');

const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: goals });
});

const createGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate, icon, color } = req.body;
  const goal = await Goal.create({
    user: req.user._id,
    name,
    targetAmount,
    currentAmount: currentAmount || 0,
    targetDate,
    icon,
    color,
  });
  res.status(201).json({ success: true, data: goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  const wasCompleted = goal.isCompleted;
  const fields = ['name', 'targetAmount', 'currentAmount', 'targetDate', 'icon', 'color'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) goal[f] = req.body[f];
  });

  goal.isCompleted = goal.currentAmount >= goal.targetAmount;
  await goal.save();

  if (goal.isCompleted && !wasCompleted) {
    await Notification.create({
      user: req.user._id,
      type: 'goal_milestone',
      title: 'Goal reached!',
      message: `You've hit your target for "${goal.name}". Nice work.`,
      meta: { goalId: goal._id },
    });
  }

  res.json({ success: true, data: goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
