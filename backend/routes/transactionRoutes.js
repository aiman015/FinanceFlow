const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
} = require('../controllers/transactionController');

const router = express.Router();
router.use(protect);

const txValidation = [
  body('type').isIn(['income', 'expense']).withMessage('type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  body('category').notEmpty().withMessage('category is required'),
  body('date').optional().isISO8601().withMessage('date must be a valid date'),
];

router.get('/', getTransactions);
router.post('/bulk-delete', bulkDeleteTransactions);
router.get('/:id', getTransaction);
router.post('/', txValidation, validate, createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
