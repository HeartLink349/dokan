import { GAME_CONFIG } from '../config';
import { DAY_ONE_CUSTOMERS, DAY_TWO_CUSTOMERS } from '../data/customers';
import { dialogue } from '../data/dialogue';
import { eventForDay } from '../data/events';
import { PRODUCT_CATALOG } from '../data/products';
import type { ActiveCustomer, CustomerProfile, DayMetrics, GameState, MarketTrend, PriceChoice, Product, Quote, SupplierChoice, SupplierOffer } from '../types';

const profileById = new Map([...DAY_ONE_CUSTOMERS, ...DAY_TWO_CUSTOMERS].map((profile) => [profile.id, profile]));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value);
const productsForDay = (day: number) => PRODUCT_CATALOG.filter((product) => (product.availableFromDay ?? 1) <= day);
export const customersForDay = (day: number) => day >= 2 ? DAY_TWO_CUSTOMERS : DAY_ONE_CUSTOMERS;

export function freshMetrics(day = 1): DayMetrics {
  return {
    totalCustomers: customersForDay(day).length, served: 0, left: 0, satisfied: 0, angry: 0,
    satisfactionTotal: 0, sales: 0, costs: 0, discounts: 0, productSales: {}, likelyReturns: 0,
    log: [day === 1 ? '🌅 اليوم الأول بدأ: افتح المحل وخد بالك من رضا زباين الحارة.' : '🚀 اليوم الثاني بدأ: تابع السوق، فاوض المورد، واختر صفقاتك بحكمة.'],
  };
}

function freshProducts(day: number) { return productsForDay(day).map((product) => ({ ...product, stock: 0, unitCost: product.cost })); }

function makeSupplierOffer(products: Product[], day: number, reputation: number): SupplierOffer | null {
  const event = eventForDay(day);
  const product = products.find((item) => item.id === event?.productId) ?? products.find((item) => item.availableFromDay === 2);
  if (!product || day < 2) return null;
  const marketCost = getMarketPrice({ market: { activeEvent: event }, products } as Pick<GameState, 'market' | 'products'>, product).cost;
  const amount = Math.min(10, product.maxStock);
  return {
    productId: product.id, amount, normalUnitCost: marketCost, discountUnitCost: round(marketCost * (reputation >= 50 ? .9 : .94)), bulkUnitCost: round(marketCost * .88),
    status: 'available', message: `المورد عرض ${amount} من ${product.name}. الفصال قد يحسن السعر، لكن العرض ينتهي بعد صفقة واحدة.`,
  };
}

export function createNewGame(): GameState {
  return {
    version: 3, day: 1, phase: 'intro', money: GAME_CONFIG.initialCapital, reputation: 62,
    products: freshProducts(1), queue: DAY_ONE_CUSTOMERS.map((customer) => customer.id), queueIndex: 0, currentCustomer: null,
    metrics: freshMetrics(1), audio: { master: 70, music: 45, sfx: 70, muted: false }, settings: { quality: 'high' },
    completedDays: [], market: { activeEvent: null }, supplierOffer: null, hasSeenDay2Update: false,
  };
}

/** Migrates only this game's old save shape and keeps inventory/progress intact. */
export function restoreGame(saved: GameState): GameState {
  const day = Math.max(1, Math.min(2, saved.day || 1));
  const oldProducts = new Map((saved.products ?? []).map((product) => [product.id, product]));
  const products = productsForDay(day).map((template) => {
    const old = oldProducts.get(template.id);
    return { ...template, ...old, availableFromDay: template.availableFromDay, unitCost: old?.unitCost ?? template.cost };
  });
  const market = saved.market ?? { activeEvent: eventForDay(day) };
  const baseline = freshMetrics(day);
  return {
    ...saved, version: 3, day, products, market,
    queue: saved.queue ?? customersForDay(day).map((customer) => customer.id), queueIndex: saved.queueIndex ?? 0,
    metrics: { ...baseline, ...saved.metrics, satisfactionTotal: saved.metrics?.satisfactionTotal ?? 0, log: saved.metrics?.log ?? baseline.log },
    completedDays: saved.completedDays ?? [], supplierOffer: saved.supplierOffer ?? (day >= 2 ? makeSupplierOffer(products, day, saved.reputation ?? 62) : null),
    hasSeenDay2Update: saved.hasSeenDay2Update ?? false,
  };
}

function addLog(state: GameState, line: string): GameState { return { ...state, metrics: { ...state.metrics, log: [...state.metrics.log.slice(-19), line] } }; }

function cartProducts(state: GameState, profile: CustomerProfile | ActiveCustomer) {
  return profile.basket.map((line) => ({ line, product: state.products.find((product) => product.id === line.productId) })).filter((item): item is { line: CustomerProfile['basket'][number]; product: Product } => Boolean(item.product));
}

export function getMarketPrice(state: Pick<GameState, 'market' | 'products'>, product: Product) {
  const event = state.market.activeEvent;
  const affected = event?.productId === product.id;
  const trend: MarketTrend = affected ? event.trend : 'normal';
  const buyMultiplier = affected ? event.buyMultiplier : 1;
  const sellMultiplier = affected ? event.sellMultiplier : 1;
  return { cost: round(product.cost * buyMultiplier), sale: round(product.price * sellMultiplier), trend, label: trend === 'high' ? '📈 السوق مرتفع' : trend === 'low' ? '📉 السوق منخفض' : '➡️ السوق طبيعي' };
}

export function getQuote(state: GameState, profile = state.currentCustomer): Quote {
  if (!profile) return { full: 0, smallDiscount: 0, customerOffer: 0, cost: 0 };
  const cart = cartProducts(state, profile);
  const full = cart.reduce((sum, item) => sum + getMarketPrice(state, item.product).sale * item.line.quantity, 0);
  const cost = cart.reduce((sum, item) => sum + (item.product.unitCost ?? item.product.cost) * item.line.quantity, 0);
  const discountableTotal = cart.filter((item) => item.product.discountable).reduce((sum, item) => sum + getMarketPrice(state, item.product).sale * item.line.quantity, 0);
  const smallDiscount = round(full - discountableTotal * .08);
  const customerOffer = Math.max(cost + 2, round(full * (1 - (.08 + profile.haggleChance * .14))));
  return { full, smallDiscount, customerOffer, cost };
}

export function cartIsInStock(state: GameState, profile: CustomerProfile | ActiveCustomer | null = state.currentCustomer) { return profile ? cartProducts(state, profile).every(({ line, product }) => product.stock >= line.quantity) : false; }
export function cartDescription(state: GameState, profile: CustomerProfile | ActiveCustomer | null = state.currentCustomer) { return profile ? cartProducts(state, profile).map(({ line, product }) => product.icon + ' ' + product.name + (line.quantity > 1 ? ' ×' + line.quantity : '')).join(' + ') : ''; }
function makeActive(profile: CustomerProfile): ActiveCustomer { return { ...profile, basket: profile.basket.map((line) => ({ ...line })), state: 'ENTERING', patienceNow: profile.patience, satisfactionNow: profile.satisfaction, negotiationRound: 0, message: '🚪 الزبون داخل المحل…' }; }
export function openShop(state: GameState): GameState { return nextCustomer({ ...state, phase: 'opening' }); }

export function nextCustomer(state: GameState): GameState {
  if (state.queueIndex >= state.queue.length) return finishDay({ ...state, currentCustomer: null });
  const profile = profileById.get(state.queue[state.queueIndex]);
  if (!profile) return nextCustomer({ ...state, queueIndex: state.queueIndex + 1 });
  return addLog({ ...state, phase: 'playing', queueIndex: state.queueIndex + 1, currentCustomer: makeActive(profile) }, `👋 وصل ${profile.name} (${profile.kind}) — ${state.queueIndex + 1}/${state.queue.length}`);
}

export function customerReady(state: GameState): GameState {
  const customer = state.currentCustomer;
  return !customer || customer.state !== 'ENTERING' ? state : { ...state, currentCustomer: { ...customer, state: 'WAITING', message: '🧺 وصل للكاشير وينتظر أن تجهّز الطلب.' } };
}
export function customerWaits(state: GameState): GameState {
  const customer = state.currentCustomer;
  return !customer || customer.state !== 'WAITING' ? state : { ...state, currentCustomer: { ...customer, state: 'BROWSING', message: '🔎 يتفقد الرفوف ويجهز طلبه…' } };
}
export function customerRequests(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || customer.state !== 'BROWSING') return state;
  const available = cartIsInStock(state, customer);
  const eventLine = state.market.activeEvent && customer.basket.some((line) => line.productId === state.market.activeEvent?.productId) ? ` ${state.market.activeEvent.demandMessage}` : '';
  const message = available ? `${dialogue(customer.kind, 'greeting', state.queueIndex)} طلبه: ${cartDescription(state, customer)}.${eventLine}` : `${dialogue(customer.kind, 'greeting', state.queueIndex)} بعض طلبه غير متوفر — اعرض عليه بديلًا أو اعتذر.${eventLine}`;
  return { ...state, currentCustomer: { ...customer, state: 'REQUESTING', message } };
}

function leave(state: GameState, customer: ActiveCustomer, reason: string, angry = false): GameState {
  const satisfaction = clamp(customer.satisfactionNow - (angry ? 25 : 14), 0, 100);
  return addLog({ ...state, reputation: clamp(state.reputation - (angry ? 4 : 2), 0, 100), currentCustomer: { ...customer, state: angry ? 'ANGRY' : 'LEAVING', message: reason, satisfactionNow: satisfaction }, metrics: { ...state.metrics, left: state.metrics.left + 1, angry: state.metrics.angry + (angry ? 1 : 0), satisfactionTotal: state.metrics.satisfactionTotal + satisfaction } }, `🚪 ${customer.name} غادر بدون شراء${angry ? ' وهو غاضب' : ''}.`);
}

export function tickPatience(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['NEGOTIATING', 'IMPATIENT'].includes(customer.state)) return state;
  const drain = customer.kind === 'مستعجل' ? 9 : customer.kind === 'عصبي' ? 7 : 4;
  const patienceNow = clamp(customer.patienceNow - drain, 0, 100);
  if (patienceNow <= 0) return leave(state, { ...customer, patienceNow, state: 'IMPATIENT' }, '⏳ اتأخرت عليه جدًا… الزبون مشي.', true);
  return { ...state, currentCustomer: { ...customer, patienceNow, state: patienceNow < 25 ? 'IMPATIENT' : customer.state, message: patienceNow < 25 ? '⏳ أنا مستعجل جدًا، خلّصني!' : customer.message } };
}

export function beginNegotiation(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['REQUESTING', 'IMPATIENT', 'NEGOTIATING'].includes(customer.state)) return state;
  if (!cartIsInStock(state, customer)) return { ...state, currentCustomer: { ...customer, message: '⚠️ الطلب ناقص؛ اعرض بديلًا أولًا أو اعتذر.' } };
  const quote = getQuote(state, customer);
  return addLog({ ...state, currentCustomer: { ...customer, state: 'NEGOTIATING', negotiationRound: customer.negotiationRound + 1, patienceNow: clamp(customer.patienceNow - 3, 0, 100), message: `${dialogue(customer.kind, 'counter', customer.negotiationRound)} عرضي ${quote.customerOffer}ج.` } }, `🤝 ${customer.name} بدأ فصالًا عند ${quote.customerOffer}ج.`);
}

export function findAlternative(state: GameState, customer = state.currentCustomer) {
  if (!customer) return null;
  const missing = customer.basket.find((line) => (state.products.find((product) => product.id === line.productId)?.stock ?? 0) < line.quantity);
  const requested = missing && state.products.find((product) => product.id === missing.productId);
  return missing && requested ? state.products.find((product) => product.id !== requested.id && product.category === requested.category && product.stock >= missing.quantity) ?? null : null;
}

export function offerAlternative(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(customer.state)) return state;
  const alternative = findAlternative(state, customer);
  if (!alternative) return { ...state, currentCustomer: { ...customer, message: '⚠️ لا يوجد بديل مناسب في المخزون الآن. يمكنك الاعتذار أو إعادة التوريد.' } };
  const missing = customer.basket.find((line) => (state.products.find((product) => product.id === line.productId)?.stock ?? 0) < line.quantity);
  const requested = missing && state.products.find((product) => product.id === missing.productId);
  if (!missing || !requested) return state;
  const demandsDiscount = customer.kind === 'سعر' || customer.kind === 'اقتصادي' || customer.kind === 'صياد عروض' || alternative.quality < requested.quality - 7;
  const basket = customer.basket.map((line) => line.productId === missing.productId ? { ...line, productId: alternative.id } : line);
  const message = demandsDiscount ? `🤝 ${alternative.name} مناسب، لكن الزبون يطلب سعرًا أقل مقابل البديل.` : `✅ وافق على ${alternative.name} بدل ${requested.name}. راجع السعر وأكمل البيع.`;
  return addLog({ ...state, currentCustomer: { ...customer, basket, substitutionTried: true, satisfactionNow: clamp(customer.satisfactionNow + (demandsDiscount ? -5 : 3), 0, 100), state: demandsDiscount ? 'NEGOTIATING' : 'REQUESTING', message } }, `🔁 عرضت ${alternative.name} بدل ${requested.name} على ${customer.name}.`);
}

export function priceChoice(state: GameState, choice: PriceChoice): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(customer.state)) return state;
  if (!cartIsInStock(state, customer)) return { ...state, currentCustomer: { ...customer, message: '⚠️ الطلب ناقص؛ استخدم «عرض بديل» قبل إتمام البيع.' } };
  const quote = getQuote(state, customer);
  const price = quote[choice];
  const maxFairPrice = Math.min(customer.budget, round(quote.full * customer.priceTolerance));
  const needsHaggle = choice === 'full' && customer.haggleChance >= .58 && customer.state !== 'NEGOTIATING';
  if (price < quote.cost) return { ...state, currentCustomer: { ...customer, state: 'NEGOTIATING', message: `التكلفة نفسها ${quote.cost}ج؛ العرض ده يسبب خسارة.` } };
  if (price > maxFairPrice || needsHaggle) {
    if (customer.negotiationRound < 1 && customer.patienceNow > 12) return beginNegotiation({ ...state, currentCustomer: { ...customer, satisfactionNow: clamp(customer.satisfactionNow - 5, 0, 100) } });
    return leave(state, customer, `${dialogue(customer.kind, 'reject', customer.negotiationRound)} الزبون رفض سعر ${price}ج.`, true);
  }
  const discount = quote.full - price;
  const satisfaction = clamp(customer.satisfactionNow + (customer.patienceNow > customer.patience * .7 ? 5 : 0) + (discount > 0 ? Math.min(17, round(discount / Math.max(1, quote.full) * 100)) : 0) - (choice === 'full' ? 2 : 0), 0, 100);
  const products = state.products.map((product) => {
    const line = customer.basket.find((item) => item.productId === product.id);
    return line ? { ...product, stock: product.stock - line.quantity } : product;
  });
  const productSales = { ...state.metrics.productSales };
  customer.basket.forEach((line) => { productSales[line.productId] = (productSales[line.productId] ?? 0) + line.quantity; });
  const likelyReturn = satisfaction >= 72 && customer.returnChance >= .5 ? 1 : 0;
  return addLog({ ...state, products, money: state.money + price, reputation: clamp(state.reputation + (satisfaction >= 82 ? 3 : satisfaction >= 64 ? 1 : -1), 0, 100), currentCustomer: { ...customer, state: 'BUYING', satisfactionNow: satisfaction, message: '🛍️ تم الاتفاق… يتم تجهيز الطلب.' }, metrics: { ...state.metrics, served: state.metrics.served + 1, satisfied: state.metrics.satisfied + (satisfaction >= 70 ? 1 : 0), satisfactionTotal: state.metrics.satisfactionTotal + satisfaction, sales: state.metrics.sales + quote.full, costs: state.metrics.costs + quote.cost, discounts: state.metrics.discounts + discount, productSales, likelyReturns: state.metrics.likelyReturns + likelyReturn } }, `✅ ${customer.name}: ${cartDescription(state, customer)} — دخل ${price}ج، رضا ${satisfaction}%.`);
}

export function advanceService(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer) return state;
  if (customer.state === 'BUYING') return { ...state, currentCustomer: { ...customer, state: 'PAYING', message: '💳 الزبون يدفع الحساب…' } };
  if (customer.state === 'PAYING') return { ...state, currentCustomer: { ...customer, state: 'SATISFIED', message: `${dialogue(customer.kind, 'accept', customer.negotiationRound)} 💰 تمت العملية بنجاح.` } };
  return state;
}
export function continueCustomer(state: GameState): GameState { const customer = state.currentCustomer; return !customer || !['SATISFIED', 'LEAVING', 'ANGRY'].includes(customer.state) ? state : { ...state, currentCustomer: null }; }
export function stockout(state: GameState): GameState { const customer = state.currentCustomer; return customer ? leave(state, customer, `${dialogue(customer.kind, 'stockout', state.queueIndex)} لم نتمكن من تجهيز الطلب.`, customer.kind === 'عصبي' || customer.kind === 'مستعجل') : state; }
export function rejectCustomer(state: GameState): GameState { return state.currentCustomer ? leave(state, state.currentCustomer, 'صاحب المحل اعتذر عن إتمام البيع. الزبون غادر.', false) : state; }

function purchaseStock(state: GameState, productId: string, requestedAmount: number, unitCost: number, log: string): GameState {
  if (state.phase === 'results') return state;
  const product = state.products.find((candidate) => candidate.id === productId);
  if (!product || product.stock >= product.maxStock) return state;
  const amount = Math.min(requestedAmount, product.maxStock - product.stock);
  const bill = amount * unitCost;
  if (state.money < bill) return addLog(state, `⚠️ لا يكفي رأس المال لتوريد ${product.name}.`);
  const averageCost = round(((product.unitCost ?? product.cost) * product.stock + unitCost * amount) / (product.stock + amount));
  return addLog({ ...state, money: state.money - bill, products: state.products.map((candidate) => candidate.id === productId ? { ...candidate, stock: candidate.stock + amount, unitCost: averageCost } : candidate) }, `${log} (${amount} × ${unitCost}ج = ${bill}ج).`);
}
export function restockProduct(state: GameState, productId: string): GameState {
  const product = state.products.find((candidate) => candidate.id === productId);
  return product ? purchaseStock(state, productId, GAME_CONFIG.restockAmount, getMarketPrice(state, product).cost, `📦 تم توريد ${product.name} بسعر السوق`) : state;
}
export function supplierAction(state: GameState, choice: SupplierChoice): GameState {
  const offer = state.supplierOffer;
  if (state.day < 2 || !offer || offer.status === 'closed') return state;
  const product = state.products.find((item) => item.id === offer.productId);
  if (!product) return state;
  if (choice === 'decline') return addLog({ ...state, supplierOffer: { ...offer, status: 'closed', message: 'اعتذرت للمورد؛ العرض انتهى لليوم.' } }, '↩️ تم رفض عرض المورد.');
  if (choice === 'negotiate') {
    if (offer.status !== 'available') return state;
    const success = state.reputation >= 48 || product.quality >= 84;
    const supplierOffer = success ? { ...offer, status: 'discounted' as const, message: `نجح الفصال! المورد وافق على ${offer.discountUnitCost}ج للوحدة. اشترِ الآن أو اطلب كمية أكبر.` } : { ...offer, status: 'failed' as const, message: `المورد تمسك بسعر ${offer.normalUnitCost}ج، لكن عرض الكمية ما زال متاحًا.` };
    return addLog({ ...state, supplierOffer }, success ? `🤝 نجح التفاوض مع المورد على ${product.name}.` : `🤝 المورد رفض خفض سعر ${product.name}.`);
  }
  const unitCost = choice === 'bulk' ? offer.bulkUnitCost : offer.status === 'discounted' ? offer.discountUnitCost : offer.normalUnitCost;
  const bought = purchaseStock(state, product.id, choice === 'bulk' ? offer.amount + 4 : offer.amount, unitCost, choice === 'bulk' ? `📦 اشتريت كمية جملة من ${product.name}` : `📦 اشتريت عرض المورد من ${product.name}`);
  return bought === state ? state : { ...bought, supplierOffer: { ...offer, status: 'closed', message: 'تمت الصفقة مع المورد وانتهى عرضه لليوم.' } };
}

export function finishDay(state: GameState): GameState {
  if (state.phase === 'results') return state;
  const completedDays = state.completedDays.includes(state.day) ? state.completedDays : [...state.completedDays, state.day];
  return addLog({ ...state, phase: 'results', currentCustomer: null, completedDays }, `🌙 أُغلق الدكان. راجع تقرير اليوم ${state.day}.`);
}
export function startNextDay(state: GameState): GameState {
  if (state.phase !== 'results' || state.day !== 1) return state;
  const day = 2;
  const existing = new Map(state.products.map((product) => [product.id, product]));
  const products = productsForDay(day).map((template) => ({ ...template, ...(existing.get(template.id) ?? { stock: 0, unitCost: template.cost }), availableFromDay: template.availableFromDay, unitCost: existing.get(template.id)?.unitCost ?? template.cost }));
  const market = { activeEvent: eventForDay(day) };
  return addLog({ ...state, version: 3, day, phase: 'intro', products, queue: DAY_TWO_CUSTOMERS.map((customer) => customer.id), queueIndex: 0, currentCustomer: null, metrics: freshMetrics(day), market, supplierOffer: makeSupplierOffer(products, day, state.reputation) }, '🚀 وصلت إلى اليوم الثاني: انفتح سوق جديد ومورد ينتظر قرارك.');
}
export function acknowledgeDay2Update(state: GameState): GameState { return state.day === 2 ? { ...state, hasSeenDay2Update: true } : state; }
export function restartDayOne(): GameState { return createNewGame(); }
export function netProfit(metrics: DayMetrics) { return metrics.sales - metrics.costs - metrics.discounts; }
export function averageSatisfaction(state: GameState) { const handled = state.metrics.served + state.metrics.left; return handled ? Math.round(state.metrics.satisfactionTotal / handled) : 0; }
export function bestAndWorstProducts(state: GameState) {
  const ranked = state.products.map((product) => ({ ...product, sold: state.metrics.productSales[product.id] ?? 0 })).sort((a, b) => b.sold - a.sold);
  return { best: ranked[0], worst: [...ranked].reverse()[0] };
}
