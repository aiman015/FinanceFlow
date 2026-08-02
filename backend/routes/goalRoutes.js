const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');

const router = express.Router();
router.use(protect);

router.get('/', getGoals);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('targetAmount').isFloat({ gt: 0 }).withMessage('targetAmount must be a positive number'),
  ],
  validate,
  createGoal
);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
