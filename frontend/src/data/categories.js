// Default categories seeded on first run. Users can rename, recolor,
// delete, and create new categories from the Categories page — this list
// is only the starting point, not a fixed enum.
export const DEFAULT_CATEGORIES = [
  { id: 'salary', name: 'Salary', type: 'income', color: '#10B981', icon: 'CircleDollarSign' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: '#0EA5E9', icon: 'Briefcase' },
  { id: 'food', name: 'Food', type: 'expense', color: '#10B981', icon: 'Utensils' },
  { id: 'transport', name: 'Transport', type: 'expense', color: '#3B82F6', icon: 'Car' },
  { id: 'shopping', name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: 'ShoppingBag' },
  { id: 'bills', name: 'Bills', type: 'expense', color: '#F59E0B', icon: 'Receipt' },
  { id: 'other', name: 'Other', type: 'expense', color: '#94A3B8', icon: 'MoreHorizontal' },
]

// Fallback category used when a transaction references a category that
// no longer exists (e.g. it was deleted).
export const UNKNOWN_CATEGORY = {
  id: 'uncategorized', name: 'Uncategorized', type: 'expense', color: '#94A3B8', icon: 'Tag',
}

export const getCategoryFrom = (categories, id) =>
  categories.find((c) => c.id === id) || UNKNOWN_CATEGORY

// Curated icon choices offered in the category editor. Keys must match
// named exports from lucide-react (see CATEGORY_ICON_MAP in components/icons.js).
export const ICON_CHOICES = [
  'CircleDollarSign', 'Briefcase', 'Utensils', 'Car', 'ShoppingBag', 'Receipt',
  'Home', 'Heart', 'Gift', 'Plane', 'GraduationCap', 'Coffee', 'Smartphone',
  'Film', 'Wallet', 'PiggyBank', 'TrendingUp', 'Dumbbell', 'Stethoscope',
  'BookOpen', 'Music', 'Gamepad2', 'Baby', 'Shirt', 'Fuel', 'Wifi', 'PawPrint',
  'Tag', 'MoreHorizontal',
]

export const CATEGORY_COLOR_CHOICES = [
  '#10B981', '#0EA5E9', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#94A3B8',
]
