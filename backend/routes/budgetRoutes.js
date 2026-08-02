const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();
router.use(protect);

router.get('/', getBudgets);
router.post(
  '/',
  [
    body('category').notEmpty().withMessage('category is required'),
    body('limit').isFloat({ gt: 0 }).withMessage('limit must be a positive number'),
    body('year').isInt().withMessage('year is required'),
  ],
  validate,
  createBudget
);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
