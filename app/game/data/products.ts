import type { Product } from '../types';

export const PRODUCT_CATALOG: Product[] = [
  { id: 'chips', name: 'شيبسي', category: 'سناكس', brand: 'تايجر', icon: '🥔', price: 20, cost: 11, stock: 12, maxStock: 20, popularity: 92, quality: 66, discountable: true },
  { id: 'juice', name: 'عصير مانجا', category: 'مشروبات', brand: 'بيتي', icon: '🧃', price: 22, cost: 13, stock: 10, maxStock: 18, popularity: 88, quality: 78, discountable: true },
  { id: 'water', name: 'مياه معدنية', category: 'مشروبات', brand: 'أكوافينا', icon: '💧', price: 12, cost: 6, stock: 18, maxStock: 26, popularity: 82, quality: 73, discountable: true },
  { id: 'chocolate', name: 'شوكولاتة', category: 'حلويات', brand: 'كورونا', icon: '🍫', price: 28, cost: 17, stock: 9, maxStock: 16, popularity: 75, quality: 82, discountable: true },
  { id: 'biscuit', name: 'بسكويت شاي', category: 'سناكس', brand: 'ريتش بيك', icon: '🍪', price: 18, cost: 9, stock: 11, maxStock: 20, popularity: 72, quality: 70, discountable: true },
  { id: 'milk', name: 'لبن', category: 'أساسيات', brand: 'جهينة', icon: '🥛', price: 30, cost: 20, stock: 8, maxStock: 16, popularity: 79, quality: 86, discountable: false },
  { id: 'pasta', name: 'مكرونة', category: 'أساسيات', brand: 'ريجينا', icon: '🍝', price: 26, cost: 16, stock: 11, maxStock: 22, popularity: 84, quality: 76, discountable: true },
  { id: 'sugar', name: 'سكر', category: 'أساسيات', brand: 'الضحى', icon: '🧂', price: 34, cost: 25, stock: 7, maxStock: 18, popularity: 89, quality: 81, discountable: false },
  { id: 'oil', name: 'زيت خليط', category: 'أساسيات', brand: 'كريستال', icon: '🫗', price: 58, cost: 44, stock: 6, maxStock: 14, popularity: 77, quality: 84, discountable: true },
  { id: 'tissues', name: 'مناديل', category: 'منزل', brand: 'فاين', icon: '🧻', price: 16, cost: 8, stock: 10, maxStock: 20, popularity: 68, quality: 71, discountable: true },
  { id: 'tea', name: 'شاي', category: 'أساسيات', brand: 'العروسة', icon: '🫖', price: 32, cost: 21, stock: 8, maxStock: 16, popularity: 73, quality: 88, discountable: true },
  { id: 'soap', name: 'صابون', category: 'منزل', brand: 'لوكس', icon: '🧼', price: 24, cost: 14, stock: 7, maxStock: 16, popularity: 64, quality: 79, discountable: true },
];
