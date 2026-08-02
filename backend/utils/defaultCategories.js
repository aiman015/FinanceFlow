// Mirrors the frontend's src/data/categories.js DEFAULT_CATEGORIES so the
// migration from localStorage to the backend feels seamless for existing users.
module.exports = [
  { name: 'Salary', type: 'income', color: '#10B981', icon: 'CircleDollarSign' },
  { name: 'Freelance', type: 'income', color: '#0EA5E9', icon: 'Briefcase' },
  { name: 'Food', type: 'expense', color: '#10B981', icon: 'Utensils' },
  { name: 'Transport', type: 'expense', color: '#3B82F6', icon: 'Car' },
  { name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: 'ShoppingBag' },
  { name: 'Bills', type: 'expense', color: '#F59E0B', icon: 'Receipt' },
  { name: 'Other', type: 'expense', color: '#94A3B8', icon: 'MoreHorizontal' },
];
