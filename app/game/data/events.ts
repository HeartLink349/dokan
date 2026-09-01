import type { DayEvent } from '../types';

/** One clear, inspectable market condition is active per day instead of noisy random popups. */
export const DAY_TWO_EVENTS: DayEvent[] = [
  {
    id: 'heat-wave', icon: '☀️', title: 'موجة حر في الحارة',
    description: 'المشروبات مطلوبة أكثر اليوم. سعر عصير المانجا ارتفع في السوق.',
    productId: 'juice', trend: 'high', buyMultiplier: 1.1, sellMultiplier: 1.18,
    demandMessage: 'الحر شديد، والناس بتسأل على المشروبات الباردة.',
  },
  {
    id: 'supplier-week', icon: '📦', title: 'عرض جملة من المورد',
    description: 'سعر النودلز منخفض اليوم؛ شراء كمية محسوبة قد يحسن هامش الربح.',
    productId: 'instant-noodles', trend: 'low', buyMultiplier: 0.84, sellMultiplier: 1,
    demandMessage: 'عرض الجملة خلّى النودلز خيارًا مربحًا اليوم.',
  },
  {
    id: 'coffee-rush', icon: '📈', title: 'طلب مرتفع على القهوة',
    description: 'قهوة بريميوم أصبحت مطلوبة، لكن المورد رفع سعرها قليلًا.',
    productId: 'premium-coffee', trend: 'high', buyMultiplier: 1.08, sellMultiplier: 1.2,
    demandMessage: 'موظفو المكاتب يدورون على قهوة جيدة قبل الشغل.',
  },
  {
    id: 'family-weekend', icon: '👨‍👩‍👧', title: 'ويك إند عائلي',
    description: 'الطحينة مطلوبة مع الغداء وسعرها في السوق مستقر ومناسب.',
    productId: 'tahini', trend: 'normal', buyMultiplier: 0.95, sellMultiplier: 1.08,
    demandMessage: 'طلبات البيت اليوم تميل للأصناف الكبيرة والطبخ.',
  },
  {
    id: 'snack-festival', icon: '🎒', title: 'خروج المدارس',
    description: 'اللب السوري يتحرك بسرعة بعد المدرسة، لكن لا تبالغ في التخزين.',
    productId: 'sunflower-seeds', trend: 'high', buyMultiplier: 1.04, sellMultiplier: 1.16,
    demandMessage: 'خروج المدارس زوّد طلب السناكس الرخيصة.',
  },
];

export function eventForDay(day: number): DayEvent | null {
  if (day < 2) return null;
  return DAY_TWO_EVENTS[(day - 2) % DAY_TWO_EVENTS.length];
}
