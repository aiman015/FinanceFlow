const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    month: { type: Number, min: 0, max: 11 }, // 0-indexed, relevant for 'monthly'
    year: { type: Number, required: true },
    // Track whether alert thresholds have already fired this period, to avoid duplicate notifications
    alertsSent: {
      type: [Number], // e.g. [50, 90, 100]
      default: [],
    },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, period: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
