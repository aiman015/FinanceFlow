const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    date: { type: Date, required: true, default: Date.now },

    // Recurring transaction support
    isRecurring: { type: Boolean, default: false },
    recurrence: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
      interval: { type: Number, default: 1, min: 1 }, // every N units
      nextRunDate: { type: Date },
      endDate: { type: Date, default: null },
      lastGeneratedAt: { type: Date, default: null },
    },
    // If this transaction was auto-generated from a recurring rule, link back to it
    generatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ isRecurring: 1, 'recurrence.nextRunDate': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
