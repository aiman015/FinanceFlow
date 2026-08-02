import {
  CircleDollarSign, Briefcase, Utensils, Car, ShoppingBag, Receipt,
  Home, Heart, Gift, Plane, GraduationCap, Coffee, Smartphone,
  Film, Wallet, PiggyBank, TrendingUp, Dumbbell, Stethoscope,
  BookOpen, Music, Gamepad2, Baby, Shirt, Fuel, Wifi, PawPrint,
  Tag, MoreHorizontal,
} from 'lucide-react'

export const CATEGORY_ICON_MAP = {
  CircleDollarSign, Briefcase, Utensils, Car, ShoppingBag, Receipt,
  Home, Heart, Gift, Plane, GraduationCap, Coffee, Smartphone,
  Film, Wallet, PiggyBank, TrendingUp, Dumbbell, Stethoscope,
  BookOpen, Music, Gamepad2, Baby, Shirt, Fuel, Wifi, PawPrint,
  Tag, MoreHorizontal,
}

export function getCategoryIcon(name) {
  return CATEGORY_ICON_MAP[name] || Tag
}
