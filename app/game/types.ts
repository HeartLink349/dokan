export type ProductCategory = 'مشروبات' | 'سناكس' | 'أساسيات' | 'منزل' | 'حلويات';
export type CustomerKind = 'الحاج' | 'فصال' | 'ربة بيت' | 'طفل' | 'مستعجل' | 'عصبي' | 'سعر' | 'جودة' | 'موظف' | 'عميل دائم';
export type CustomerState = 'ENTERING' | 'WAITING' | 'BROWSING' | 'REQUESTING' | 'NEGOTIATING' | 'BUYING' | 'PAYING' | 'SATISFIED' | 'IMPATIENT' | 'ANGRY' | 'LEAVING';
export type GamePhase = 'intro' | 'opening' | 'playing' | 'results';
export type Quality = 'low' | 'medium' | 'high';

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  icon: string;
  price: number;
  cost: number;
  stock: number;
  maxStock: number;
  popularity: number;
  quality: number;
  discountable: boolean;
};

export type CartLine = { productId: string; quantity: number };

export type CustomerProfile = {
  id: string;
  name: string;
  kind: CustomerKind;
  avatar: string;
  bio: string;
  dialogueKey: string;
  basket: CartLine[];
  budget: number;
  patience: number;
  satisfaction: number;
  haggleChance: number;
  preferredProductIds: string[];
  returnChance: number;
  priceTolerance: number;
  serviceExpectation: number;
};

export type ActiveCustomer = CustomerProfile & {
  state: CustomerState;
  patienceNow: number;
  satisfactionNow: number;
  negotiationRound: number;
  message: string;
};

export type DayMetrics = {
  totalCustomers: number;
  served: number;
  left: number;
  satisfied: number;
  angry: number;
  satisfactionTotal: number;
  sales: number;
  costs: number;
  discounts: number;
  productSales: Record<string, number>;
  likelyReturns: number;
  log: string[];
};

export type GameState = {
  version: number;
  day: number;
  phase: GamePhase;
  money: number;
  reputation: number;
  products: Product[];
  queue: string[];
  queueIndex: number;
  currentCustomer: ActiveCustomer | null;
  metrics: DayMetrics;
  audio: { master: number; music: number; sfx: number; muted: boolean };
  settings: { quality: Quality };
  completedDays: number[];
};

export type Quote = { full: number; smallDiscount: number; customerOffer: number; cost: number };
export type PriceChoice = 'full' | 'smallDiscount' | 'customerOffer';
