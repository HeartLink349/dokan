export type ProductCategory = 'مشروبات' | 'سناكس' | 'أساسيات' | 'منزل' | 'حلويات' | 'ألبان' | 'معلبات' | 'مخبوزات' | 'تنظيف' | 'تجميل' | 'فريزر';
export type CustomerKind = 'الحاج' | 'فصال' | 'ربة بيت' | 'طفل' | 'مستعجل' | 'عصبي' | 'سعر' | 'جودة' | 'موظف' | 'عميل دائم' | 'اقتصادي' | 'تاجر جملة' | 'باحث عن جودة' | 'صياد عروض';
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
  availableFromDay?: number;
  /** Weighted procurement cost of the units currently on the shelf. */
  unitCost?: number;
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
  substitutionTried?: boolean;
  message: string;
};

export type MarketTrend = 'low' | 'normal' | 'high';

export type DayEvent = {
  id: string;
  icon: string;
  title: string;
  description: string;
  productId: string;
  trend: MarketTrend;
  buyMultiplier: number;
  sellMultiplier: number;
  demandMessage: string;
};

export type MarketState = { activeEvent: DayEvent | null };

export type SupplierOfferStatus = 'available' | 'discounted' | 'failed' | 'closed';

export type SupplierOffer = {
  productId: string;
  amount: number;
  normalUnitCost: number;
  discountUnitCost: number;
  bulkUnitCost: number;
  status: SupplierOfferStatus;
  message: string;
};

export type SupplierChoice = 'buy' | 'negotiate' | 'bulk' | 'decline';

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
  market: MarketState;
  supplierOffer: SupplierOffer | null;
  hasSeenDay2Update: boolean;
};

export type Quote = { full: number; smallDiscount: number; customerOffer: number; cost: number };
export type PriceChoice = 'full' | 'smallDiscount' | 'customerOffer';
