import { GAME_CONFIG } from '../config';
import { DAY_ONE_CUSTOMERS } from '../data/customers';
import { dialogue } from '../data/dialogue';
import { PRODUCT_CATALOG } from '../data/products';
import type { ActiveCustomer, CustomerProfile, DayMetrics, GameState, PriceChoice, Product, Quote } from '../types';

const profileById = new Map(DAY_ONE_CUSTOMERS.map((profile) => [profile.id, profile]));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value);

export function freshMetrics(): DayMetrics {
  return { totalCustomers: DAY_ONE_CUSTOMERS.length, served: 0, left: 0, satisfied: 0, angry: 0, satisfactionTotal: 0, sales: 0, costs: 0, discounts: 0, productSales: {}, likelyReturns: 0, log: ['🌅 اليوم الأول بدأ: افتح المحل وخد بالك من رضا زباين الحارة.'] };
}

export function createNewGame(): GameState {
  return {
    version: 2, day: 1, phase: 'intro', money: GAME_CONFIG.initialCapital, reputation: 62,
    products: PRODUCT_CATALOG.map((product) => ({ ...product, stock: 0 })),
    queue: DAY_ONE_CUSTOMERS.map((customer) => customer.id), queueIndex: 0, currentCustomer: null,
    metrics: freshMetrics(),
    audio: { master: 70, music: 45, sfx: 70, muted: false },
    settings: { quality: 'high' }, completedDays: [],
  };
}

function addLog(state: GameState, line: string): GameState {
  return { ...state, metrics: { ...state.metrics, log: [...state.metrics.log.slice(-19), line] } };
}

function cartProducts(state: GameState, profile: CustomerProfile | ActiveCustomer) {
  return profile.basket.map((line) => ({ line, product: state.products.find((product) => product.id === line.productId) })).filter((item): item is { line: CustomerProfile['basket'][number]; product: Product } => Boolean(item.product));
}

export function getQuote(state: GameState, profile = state.currentCustomer): Quote {
  if (!profile) return { full: 0, smallDiscount: 0, customerOffer: 0, cost: 0 };
  const cart = cartProducts(state, profile);
  const full = cart.reduce((sum, item) => sum + item.product.price * item.line.quantity, 0);
  const cost = cart.reduce((sum, item) => sum + item.product.cost * item.line.quantity, 0);
  const discountableTotal = cart.filter((item) => item.product.discountable).reduce((sum, item) => sum + item.product.price * item.line.quantity, 0);
  const smallDiscount = round(full - discountableTotal * .08);
  const desiredDiscount = .08 + profile.haggleChance * .14;
  const customerOffer = Math.max(cost + 2, round(full * (1 - desiredDiscount)));
  return { full, smallDiscount, customerOffer, cost };
}

export function cartIsInStock(state: GameState, profile = state.currentCustomer) {
  if (!profile) return false;
  return cartProducts(state, profile).every(({ line, product }) => product.stock >= line.quantity);
}

export function cartDescription(state: GameState, profile = state.currentCustomer) {
  if (!profile) return '';
  return cartProducts(state, profile).map(({ line, product }) => `${product.icon} ${product.name}${line.quantity > 1 ? ` ×${line.quantity}` : ''}`).join(' + ');
}

function makeActive(profile: CustomerProfile): ActiveCustomer {
  return { ...profile, basket: profile.basket.map((line) => ({ ...line })), state: 'ENTERING', patienceNow: profile.patience, satisfactionNow: profile.satisfaction, negotiationRound: 0, message: '🚪 الزبون داخل المحل…' };
}

export function openShop(state: GameState): GameState {
  return nextCustomer({ ...state, phase: 'opening' });
}

/** Advances a state-machine terminal customer to the next one, or finishes Day 1. */
export function nextCustomer(state: GameState): GameState {
  if (state.queueIndex >= state.queue.length) return finishDay({ ...state, currentCustomer: null });
  const id = state.queue[state.queueIndex];
  const profile = profileById.get(id);
  if (!profile) return nextCustomer({ ...state, queueIndex: state.queueIndex + 1 });
  const active = makeActive(profile);
  return addLog({ ...state, phase: 'playing', queueIndex: state.queueIndex + 1, currentCustomer: active }, `👋 وصل ${profile.name} (${profile.kind}) — ${state.queueIndex + 1}/${state.queue.length}`);
}

export function customerReady(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || customer.state !== 'ENTERING') return state;
  return {
    ...state,
    currentCustomer: { ...customer, state: 'WAITING', message: '🧺 وصل للكاشير وينتظر أن تجهّز الطلب.' },
  };
}

export function customerWaits(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || customer.state !== 'WAITING') return state;
  return { ...state, currentCustomer: { ...customer, state: 'BROWSING', message: '🔎 يتفقد الرفوف ويجهز طلبه…' } };
}

export function customerRequests(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || customer.state !== 'BROWSING') return state;
  const available = cartIsInStock(state, customer);
  return { ...state, currentCustomer: { ...customer, state: 'REQUESTING', message: available ? `${dialogue(customer.kind, 'greeting', state.queueIndex)} طلبه: ${cartDescription(state, customer)}.` : `${dialogue(customer.kind, 'greeting', state.queueIndex)} لكن بعض طلبه غير متوفر.` } };
}

function leave(state: GameState, customer: ActiveCustomer, reason: string, angry = false): GameState {
  const loss = angry ? 4 : 2;
  const nextReputation = clamp(state.reputation - loss, 0, 100);
  return addLog({
    ...state, reputation: nextReputation,
    currentCustomer: { ...customer, state: angry ? 'ANGRY' : 'LEAVING', message: reason, satisfactionNow: clamp(customer.satisfactionNow - (angry ? 25 : 14), 0, 100) },
    metrics: { ...state.metrics, left: state.metrics.left + 1, angry: state.metrics.angry + (angry ? 1 : 0), satisfactionTotal: state.metrics.satisfactionTotal + clamp(customer.satisfactionNow - (angry ? 25 : 14), 0, 100) },
  }, `🚪 ${customer.name} غادر بدون شراء${angry ? ' وهو غاضب' : ''}.`);
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
  if (!cartIsInStock(state, customer)) return stockout(state);
  const quote = getQuote(state, customer);
  return addLog({ ...state, currentCustomer: { ...customer, state: 'NEGOTIATING', negotiationRound: customer.negotiationRound + 1, patienceNow: clamp(customer.patienceNow - 3, 0, 100), message: `${dialogue(customer.kind, 'counter', customer.negotiationRound)} عرضي ${quote.customerOffer}ج.` } }, `🤝 ${customer.name} بدأ فصالًا عند ${quote.customerOffer}ج.`);
}

export function priceChoice(state: GameState, choice: PriceChoice): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(customer.state)) return state;
  if (!cartIsInStock(state, customer)) return stockout(state);
  const quote = getQuote(state, customer);
  const price = quote[choice];
  const maxFairPrice = Math.min(customer.budget, round(quote.full * customer.priceTolerance));
  const needsHaggle = choice === 'full' && customer.haggleChance >= .58 && customer.state !== 'NEGOTIATING';
  const tooHigh = price > maxFairPrice || needsHaggle;
  if (price < quote.cost) return { ...state, currentCustomer: { ...customer, state: 'NEGOTIATING', message: `التكلفة نفسها ${quote.cost}ج؛ العرض ده يسبب خسارة.` } };
  if (tooHigh) {
    if (customer.negotiationRound < 1 && customer.patienceNow > 12) return beginNegotiation({ ...state, currentCustomer: { ...customer, satisfactionNow: clamp(customer.satisfactionNow - 5, 0, 100) } });
    return leave(state, customer, `${dialogue(customer.kind, 'reject', customer.negotiationRound)} الزبون رفض سعر ${price}ج.`, true);
  }
  const discount = quote.full - price;
  const quickBonus = customer.patienceNow > customer.patience * .7 ? 5 : 0;
  const satisfaction = clamp(customer.satisfactionNow + quickBonus + (discount > 0 ? Math.min(17, round(discount / Math.max(1, quote.full) * 100)) : 0) - (choice === 'full' ? 2 : 0), 0, 100);
  const reputationDelta = satisfaction >= 82 ? 3 : satisfaction >= 64 ? 1 : -1;
  const products = state.products.map((product) => {
    const line = customer.basket.find((item) => item.productId === product.id);
    return line ? { ...product, stock: product.stock - line.quantity } : product;
  });
  const productSales = { ...state.metrics.productSales };
  customer.basket.forEach((line) => { productSales[line.productId] = (productSales[line.productId] ?? 0) + line.quantity; });
  const likelyReturn = satisfaction >= 72 && customer.returnChance >= .5 ? 1 : 0;
  const completed: ActiveCustomer = { ...customer, state: 'BUYING', satisfactionNow: satisfaction, message: '🛍️ تم الاتفاق… يتم تجهيز الطلب.' };
  return addLog({
    ...state, products, money: state.money + price, reputation: clamp(state.reputation + reputationDelta, 0, 100), currentCustomer: completed,
    metrics: { ...state.metrics, served: state.metrics.served + 1, satisfied: state.metrics.satisfied + (satisfaction >= 70 ? 1 : 0), satisfactionTotal: state.metrics.satisfactionTotal + satisfaction, sales: state.metrics.sales + quote.full, costs: state.metrics.costs + quote.cost, discounts: state.metrics.discounts + discount, productSales, likelyReturns: state.metrics.likelyReturns + likelyReturn },
  }, `✅ ${customer.name}: ${cartDescription(state, customer)} — دخل ${price}ج، رضا ${satisfaction}%.`);
}

export function advanceService(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer) return state;
  if (customer.state === 'BUYING') return { ...state, currentCustomer: { ...customer, state: 'PAYING', message: '💳 الزبون يدفع الحساب…' } };
  if (customer.state === 'PAYING') return { ...state, currentCustomer: { ...customer, state: 'SATISFIED', message: `${dialogue(customer.kind, 'accept', customer.negotiationRound)} 💰 تمت العملية بنجاح.` } };
  return state;
}

/** Terminal reactions stay on screen until the player explicitly continues. */
export function continueCustomer(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer || !['SATISFIED', 'LEAVING', 'ANGRY'].includes(customer.state)) return state;
  return nextCustomer({ ...state, currentCustomer: null });
}

export function stockout(state: GameState): GameState {
  const customer = state.currentCustomer;
  if (!customer) return state;
  return leave(state, customer, `${dialogue(customer.kind, 'stockout', state.queueIndex)} لم نتمكن من تجهيز الطلب.`, customer.kind === 'عصبي' || customer.kind === 'مستعجل');
}

export function rejectCustomer(state: GameState): GameState {
  const customer = state.currentCustomer;
  return customer ? leave(state, customer, 'صاحب المحل اعتذر عن إتمام البيع. الزبون غادر.', false) : state;
}

export function restockProduct(state: GameState, productId: string): GameState {
  if (state.phase === 'results') return state;
  const product = state.products.find((candidate) => candidate.id === productId);
  if (!product || product.stock >= product.maxStock) return state;
  const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock);
  const bill = amount * product.cost;
  if (state.money < bill) return addLog(state, `⚠️ لا يكفي رأس المال لإعادة تخزين ${product.name}.`);
  return addLog({ ...state, money: state.money - bill, products: state.products.map((candidate) => candidate.id === productId ? { ...candidate, stock: candidate.stock + amount } : candidate) }, `📦 تم توريد ${amount} من ${product.name} مقابل ${bill}ج.`);
}

export function finishDay(state: GameState): GameState {
  if (state.phase === 'results') return state;
  const completedDays = state.completedDays.includes(1) ? state.completedDays : [...state.completedDays, 1];
  return addLog({ ...state, phase: 'results', currentCustomer: null, completedDays }, '🌙 أُغلق الدكان. راجع تقرير اليوم الأول.');
}

export function restartDayOne(state: GameState): GameState {
  const fresh = createNewGame();
  return { ...fresh, audio: state.audio, settings: state.settings };
}

export function netProfit(metrics: DayMetrics) { return metrics.sales - metrics.costs - metrics.discounts; }
export function averageSatisfaction(state: GameState) {
  const handled = state.metrics.served + state.metrics.left;
  return handled ? Math.round(state.metrics.satisfactionTotal / handled) : 0;
}
export function bestAndWorstProducts(state: GameState) {
  const ranked = state.products.map((product) => ({ ...product, sold: state.metrics.productSales[product.id] ?? 0 })).sort((a, b) => b.sold - a.sold);
  return { best: ranked[0], worst: [...ranked].reverse()[0] };
}
