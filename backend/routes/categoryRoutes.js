const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();
router.use(protect);

router.get('/', getCategories);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('type').isIn(['income', 'expense']).withMessage('type must be income or expense'),
  ],
  validate,
  createCategory
);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
