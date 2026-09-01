'use client';

import { useEffect, useState } from 'react';
import { GAME_CONFIG, QUALITY_LABELS } from './game/config';
import { averageSatisfaction, bestAndWorstProducts, cartDescription, customersForDay, findAlternative, getMarketPrice, getQuote, netProfit } from './game/core/game';
import { PRODUCT_CATALOG } from './game/data/products';
import { useDokanGame } from './game/hooks/useDokanGame';
import type { CustomerState, PriceChoice, Product, SupplierChoice } from './game/types';

type ModalName = 'inventory' | 'settings' | 'guide' | 'memo' | 'supplier' | null;

const stateLabel: Record<CustomerState, string> = {
  ENTERING: 'داخل المحل', WAITING: 'ينتظر', BROWSING: 'يتفقد الرفوف', REQUESTING: 'يطلب', NEGOTIATING: 'يفاصل',
  BUYING: 'تجهيز الطلب', PAYING: 'يدفع', SATISFIED: 'راضٍ', IMPATIENT: 'نفد صبره', ANGRY: 'غاضب', LEAVING: 'يغادر',
};
const format = (value: number) => new Intl.NumberFormat('ar-EG').format(Math.round(value));
const dayName = (day: number) => day === 1 ? 'اليوم الأول' : 'اليوم الثاني';

export default function Home() {
  const dokan = useDokanGame();
  const { game } = dokan;
  const [started, setStarted] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setModal(null); setConfirmReset(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const beginGame = () => {
    setStarted(true);
    void requestLandscapeOnTouchDevice();
  };

  if (!dokan.hydrated) return <main className="dokan-app loading-screen"><span>🏪</span><p>يتم تجهيز دكان زمان…</p></main>;
  if (!started) return <main className="dokan-app"><StartScreen saved={dokan.hasSavedGame} onStart={beginGame} onReset={() => setConfirmReset(true)} />{confirmReset && <ResetConfirm onCancel={() => setConfirmReset(false)} onConfirm={() => { dokan.restart(); setConfirmReset(false); beginGame(); }} />}</main>;

  const current = game.currentCustomer;
  const progress = game.metrics.served + game.metrics.left;
  const remaining = Math.max(0, game.metrics.totalCustomers - progress);
  const currentNet = netProfit(game.metrics);
  const quote = getQuote(game, current);
  const lowStockProducts = game.products.filter((product) => dokan.lowStockIds.includes(product.id));
  const nextCustomer = game.queue.slice(game.queueIndex, game.queueIndex + 1).map((id) => customersForDay(game.day).find((customer) => customer.id === id))[0];
  const event = game.market.activeEvent;
  const eventTitle = event?.title ?? (lowStockProducts.length ? 'تنبيه مخزون' : 'أجواء الحارة');
  const eventText = event?.description ?? (lowStockProducts.length ? '⚠️ ' + lowStockProducts[0].name + ' قرب يخلص من الرف.' : 'جهّز البضاعة وافتح الدكان عندما تكون مستعدًا.');

  return <main className="dokan-app">
    <div className="game-shell">
      <header className="topbar">
        <section className="top-day panel"><b>{dayName(game.day)}</b><span>{game.day === 2 ? '🚀' : '📅'}</span><small>{game.day === 2 ? 'DAY 2 · سوق الحارة' : 'DAY 1 · محل الحارة'}</small></section>
        <TopMetric icon="🕗" label="الوقت" value={game.phase === 'results' ? 'إغلاق' : format(8 + Math.min(14, Math.floor(progress / 3))) + ':00'} />
        <TopMetric icon="💵" label={game.phase === 'intro' ? 'رأس المال' : 'السيولة'} value={format(game.money) + ' ج'} />
        <TopMetric icon="📈" label="الربح" value={format(currentNet) + ' ج'} tone={currentNet >= 0 ? 'positive' : 'negative'} />
        <TopMetric icon="⭐" label="السمعة" value={String(game.reputation)} sub={'/100 · ' + averageSatisfaction(game) + '% رضا'} />
        <nav className="top-actions" aria-label="قائمة التحكم">
          <button onClick={() => setModal('memo')}><span>📋</span>المذكرة</button>
          <button onClick={() => setModal('settings')}><span>⚙️</span>الإعدادات</button>
          <button onClick={() => setModal('inventory')}><span>☰</span>القائمة</button>
        </nav>
      </header>

      <div className="game-board">
        <aside className="left-column">
          <section className="panel objective-panel">
            <PanelTitle icon="🎯" title="أهداف اليوم" badge={game.day === 2 ? 'تحدي جديد' : undefined} />
            <Objective done={currentNet >= (game.day === 2 ? 360 : 250)} text={'حقق ربحًا لا يقل عن ' + (game.day === 2 ? '360' : '250') + ' ج'} />
            <Objective done={game.reputation >= 40} text="لا تنخفض السمعة عن 40" />
            <Objective done={game.products.filter((item) => item.stock > 0).length >= (game.day === 2 ? 11 : 8)} text={game.day === 2 ? 'جهّز 11 منتجًا على الأقل' : 'جهّز 8 منتجات على الأقل'} />
          </section>
          <StorePanel game={game} onRestock={dokan.restock} onManage={() => setModal('inventory')} lowIds={dokan.lowStockIds} />
        </aside>

        <section className="main-scene">
          <div className="scene-frame" aria-label="مشهد دكان الحارة">
            <img src="/store-scene.jpg" alt="داخل دكان حارة مصري" draggable={false} />
            <div className="scene-shade" />
            {current && <div className={'customer-actor ' + current.state.toLowerCase()}><span>{current.avatar}</span><b>{current.name}</b></div>}
            <div className="scene-status"><span className={game.phase === 'playing' ? 'open-dot' : 'closed-dot'} />{game.phase === 'playing' ? 'المحل مفتوح' : game.phase === 'results' ? 'أُغلق المحل' : 'جهّز البضاعة أولًا'}</div>
            {current && <div className="dialogue-bubble"><small>{current.name} • {current.kind} • {stateLabel[current.state]}</small><div className="dialogue-body"><p>{current.message}</p>{['SATISFIED', 'LEAVING', 'ANGRY'].includes(current.state) && <button className="dialogue-next" onClick={dokan.next}>التالي ←</button>}</div></div>}
            {!current && game.phase === 'playing' && <div className="scene-message">باب الدكان مفتوح… الزبون التالي في الطريق.</div>}
            {game.phase === 'intro' && <Opening day={game.day} hasStock={game.products.some((product) => product.stock > 0)} hasSupplier={Boolean(game.supplierOffer && game.supplierOffer.status !== 'closed')} onInventory={() => setModal('inventory')} onSupplier={() => setModal('supplier')} onOpen={dokan.open} />}
          </div>
        </section>

        <aside className="right-column">
          <section className="panel event-panel"><PanelTitle icon={event?.icon ?? '⚡'} title={game.day === 2 ? 'حدث السوق' : 'حدث اليوم'} /><div className="event-copy"><span>{event?.icon ?? (lowStockProducts.length ? '⚠️' : '✨')}</span><div><strong>{eventTitle}</strong><p>{eventText}</p>{event && <small className="market-indicator">{event.trend === 'high' ? '📈 السعر مرتفع' : event.trend === 'low' ? '📉 السعر منخفض' : '➡️ السعر طبيعي'}</small>}{game.day === 2 && game.supplierOffer?.status !== 'closed' && <button className="supplier-launch" onClick={() => setModal('supplier')}>🤝 تفاوض مع المورد</button>}</div></div></section>
          <section className="panel customer-panel"><PanelTitle icon="🧍" title="الزبون الحالي" badge={current ? stateLabel[current.state] : 'لا يوجد'} />{current ? <CustomerCheckout current={current} products={game.products} quote={quote} selected={dokan.selectedPrice} setSelected={dokan.setSelectedPrice} onChoose={dokan.choosePrice} onNegotiate={dokan.negotiate} onAlternative={dokan.suggestAlternative} onLeave={dokan.leave} onNext={dokan.next} alternative={findAlternative(game, current)} /> : <EmptyCheckout phase={game.phase} />}</section>
        </aside>
      </div>

      <footer className="bottom-panels">
        <section className="panel memo-panel"><PanelTitle icon="📝" title="مذكرة اليوم" /><dl><dt>المبيعات</dt><dd>{format(game.metrics.sales)} ج</dd><dt>تكلفة البضاعة</dt><dd>{format(game.metrics.costs)} ج</dd><dt>الخصومات</dt><dd>{format(game.metrics.discounts)} ج</dd><dt>الزبائن</dt><dd>{progress}/{game.metrics.totalCustomers}</dd><dt>السمعة</dt><dd>{game.reputation}/100 ⭐</dd></dl></section>
        <section className="panel timeline-panel"><PanelTitle icon="📜" title="سجل الأحداث" /><div className="event-log">{game.metrics.log.slice(-3).reverse().map((line, index) => <p key={line + index}><b>{index === 0 ? format(8 + Math.min(14, Math.floor(progress / 3))) + ':00' : '—'}</b>{line}</p>)}</div></section>
        <section className="panel next-panel"><PanelTitle icon="🚶" title="القادم في الطريق" />{nextCustomer ? <div className="next-customer"><span>{nextCustomer.avatar}</span><div><strong>{nextCustomer.name}</strong><p>{nextCustomer.kind} · {nextCustomer.bio}</p></div></div> : <p className="quiet-note">انتهت قائمة زباين اليوم.</p>}<button className="outline-button" onClick={() => setModal('guide')}>اعرف طريقة التعامل ←</button></section>
        <section className="panel end-panel"><PanelTitle icon="🌙" title="نهاية اليوم" /><p>باقي {remaining} زبونًا قبل إغلاق اليوم.</p><button className="end-button" onClick={dokan.closeDay} disabled={game.phase === 'intro' || game.phase === 'results'}>إنهاء اليوم الآن</button></section>
      </footer>
    </div>

    {dokan.toast && <div className="toast" role="status">{dokan.toast}</div>}
    {game.phase === 'results' && <Results game={game} onNextDay={dokan.beginDayTwo} onMenu={() => setStarted(false)} />}
    {game.day === 2 && !game.hasSeenDay2Update && <DayTwoUpdate onContinue={dokan.seeDayTwoUpdate} />}
    {modal === 'inventory' && <Modal title="تجهيز البضائع" close={() => setModal(null)}><InventoryModal game={game} onRestock={dokan.restock} lowIds={dokan.lowStockIds} /></Modal>}
    {modal === 'settings' && <Modal title="الإعدادات" close={() => setModal(null)}><Settings game={game} updateAudio={dokan.updateAudio} updateQuality={dokan.updateQuality} /></Modal>}
    {modal === 'memo' && <Modal title="مذكرة اليوم" close={() => setModal(null)}><DayMemo game={game} /></Modal>}
    {modal === 'guide' && <Modal title="طريقة اللعب" close={() => setModal(null)}><Guide day={game.day} /></Modal>}
    {modal === 'supplier' && game.supplierOffer && <Modal title="مورد اليوم" close={() => setModal(null)}><SupplierPanel game={game} onAction={(choice) => { dokan.negotiateSupplier(choice); if (choice !== 'negotiate') setModal(null); }} /></Modal>}
  </main>;
}

async function requestLandscapeOnTouchDevice() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const orientation = window.screen.orientation as ScreenOrientation & { lock?: (mode: 'landscape') => Promise<void> };
  if (!orientation?.lock) return;

  try {
    if (document.fullscreenEnabled && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    await orientation.lock('landscape');
  } catch {
    // Some mobile browsers do not expose orientation locking. CSS keeps the board usable there.
  }
}

function StartScreen({ saved, onStart, onReset }: { saved: boolean; onStart: () => void; onReset: () => void }) {
  return <section className="start-screen"><div className="start-card"><span className="start-icon">🏪</span><p className="eyebrow">لعبة إدارة بقالة مصرية</p><h1>دكان زمان</h1><p>افتح الدكان، جهّز الرفوف، فاوض الزباين والموردين، وابنِ سمعة الحارة يومًا وراء يوم.</p><button className="primary large start-button" onClick={onStart}>{saved ? 'استكمل اللعب' : 'ابدأ اللعبة'} ←</button><button className="reset-link" onClick={onReset}>مسح البيانات والبدء من الأول</button></div></section>;
}
function ResetConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-layer"><section className="confirm-card"><span>⚠️</span><h2>هل أنت متأكد؟</h2><p>سيتم حذف كل تقدمك والبدء من اليوم الأول.</p><div><button className="secondary-start" onClick={onCancel}>إلغاء</button><button className="decline-button" onClick={onConfirm}>مسح والبدء من جديد</button></div></section></div>;
}
function Opening({ day, hasStock, hasSupplier, onInventory, onSupplier, onOpen }: { day: number; hasStock: boolean; hasSupplier: boolean; onInventory: () => void; onSupplier: () => void; onOpen: () => void }) {
  return <div className="opening-prompt"><span>{day === 2 ? '🚀' : '🏪'}</span><h2>صباح {dayName(day)}</h2><p>{day === 2 ? 'راقب أسعار السوق وتفاوض مع المورد قبل أن تفتح.' : 'جهّز بضاعة من القائمة ثم افتح الدكان.'}</p><div className="opening-actions"><button className="secondary-start" onClick={onInventory}>📦 تجهيز البضائع</button>{hasSupplier && <button className="secondary-start" onClick={onSupplier}>🤝 مورد اليوم</button>}<button className="primary large" onClick={onOpen} disabled={!hasStock}>افتح الدكان</button></div></div>;
}
function PanelTitle({ icon, title, badge }: { icon: string; title: string; badge?: string }) { return <div className="panel-title"><h2>{icon} {title}</h2>{badge && <span>{badge}</span>}</div>; }
function TopMetric({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: 'positive' | 'negative' }) { return <section className="top-metric panel"><span>{icon}</span><div><small>{label}</small><b className={tone}>{value}</b>{sub && <em>{sub}</em>}</div></section>; }
function Objective({ done, text }: { done: boolean; text: string }) { return <div className={'objective ' + (done ? 'done' : '')}><span>{done ? '✓' : '○'}</span><p>{text}</p><b>⭐</b></div>; }

function StorePanel({ game, onRestock, onManage, lowIds }: { game: ReturnType<typeof useDokanGame>['game']; onRestock: (id: string) => void; onManage: () => void; lowIds: string[] }) {
  const stocked = game.products.filter((product) => product.stock > 0).length;
  return <section className="panel store-panel"><PanelTitle icon="📦" title="المتجر" /><div className="store-subtitle"><span>المنتجات ({stocked}/{game.products.length})</span><button onClick={onManage}>عرض الكل</button></div><div className="store-list">{game.products.map((product) => {
    const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock);
    const market = getMarketPrice(game, product);
    return <article className={'store-row ' + (lowIds.includes(product.id) ? 'low-stock' : '')} key={product.id}><span>{product.icon}</span><div><strong>{product.name} {product.availableFromDay === 2 && <em className="new-badge">جديد</em>}</strong><small>{market.label} · بيع {format(market.sale)} · شراء {format(market.cost)}</small></div><button disabled={!amount || game.money < amount * market.cost} onClick={() => onRestock(product.id)}>{product.stock || '+' + amount}</button></article>;
  })}</div><button className="stock-button" onClick={onManage}>📦 تجهيز البضائع</button></section>;
}

function CustomerCheckout({ current, products, quote, selected, setSelected, onChoose, onNegotiate, onAlternative, onLeave, onNext, alternative }: { current: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>; products: Product[]; quote: ReturnType<typeof getQuote>; selected: PriceChoice; setSelected: (value: PriceChoice) => void; onChoose: (value: PriceChoice) => void; onNegotiate: () => void; onAlternative: () => void; onLeave: () => void; onNext: () => void; alternative: Product | null }) {
  const ready = ['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(current.state);
  const terminal = ['SATISFIED', 'LEAVING', 'ANGRY'].includes(current.state);
  const unavailable = current.basket.flatMap((line) => { const product = products.find((item) => item.id === line.productId); return product && product.stock < line.quantity ? [product] : []; });
  const selectedPrice = quote[selected];
  return <div className="checkout-content"><div className="customer-summary"><span>{current.avatar}</span><div><h3>{current.name}</h3><p>{current.kind} · {current.bio}</p></div></div><div className="customer-meter"><span>الصبر</span><i><b style={{ width: current.patienceNow + '%' }} /></i><strong>{Math.round(current.patienceNow)}%</strong></div><div className="customer-meter"><span>الرضا</span><i><b style={{ width: current.satisfactionNow + '%' }} /></i><strong>{Math.round(current.satisfactionNow)}%</strong></div><div className="order-card"><small>الطلب</small><strong>{cartDescriptionFromCustomer(current)}</strong><div><span>الميزانية</span><b>{format(current.budget)} ج</b></div></div>
    {terminal ? <div className="outcome-action"><span>{current.state === 'SATISFIED' ? '✅' : '🚪'}</span><p>{current.message}</p><button className="primary action-button" onClick={onNext}>الزبون التالي ←</button><small>الرسالة ستبقى حتى تكمل أنت.</small></div> : ready ? <><>{unavailable.length > 0 && <div className="order-stockout"><b>⚠️ الطلب ناقص</b><p>{unavailable.map((product) => product.name).join(' • ')}</p><button disabled={!alternative} onClick={onAlternative}>{alternative ? '🔁 عرض بديل: ' + alternative.name : 'لا يوجد بديل مناسب'}</button></div>}</><div className="price-options"><PriceOption id="full" selected={selected} label="السعر الحالي" price={quote.full} setSelected={setSelected} /><PriceOption id="smallDiscount" selected={selected} label="خصم بسيط" price={quote.smallDiscount} setSelected={setSelected} /><PriceOption id="customerOffer" selected={selected} label="عرض الزبون" price={quote.customerOffer} setSelected={setSelected} /></div><div className="deal-preview"><span>ربح الصفقة <b className={selectedPrice - quote.cost >= 0 ? 'positive' : 'negative'}>{format(selectedPrice - quote.cost)} ج</b></span><span>خصم <b>{format(quote.full - selectedPrice)} ج</b></span></div><div className="cashier-actions"><button className="sell-button" onClick={() => onChoose(selected)}>💵 بيع بـ {format(selectedPrice)} ج</button><button className="negotiate-button" onClick={onNegotiate}>🤝 تفاوض على السعر</button>{unavailable.length > 0 && <button className="restock-button" disabled={!alternative} onClick={onAlternative}>🔁 اقترح بديلًا</button>}<button className="decline-button" onClick={onLeave}>🚫 رفض البيع</button></div></> : <div className="waiting-action"><span>⏳</span><p>تتحرك العملية الآن…</p></div>}
  </div>;
}
function cartDescriptionFromCustomer(customer: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>) { return customer.basket.map((line) => { const product = PRODUCT_CATALOG.find((item) => item.id === line.productId); return (line.quantity > 1 ? String(line.quantity) + '× ' : '') + (product?.name ?? line.productId); }).join('، '); }
function PriceOption({ id, selected, label, price, setSelected }: { id: PriceChoice; selected: PriceChoice; label: string; price: number; setSelected: (value: PriceChoice) => void }) { return <button className={'price-option ' + (selected === id ? 'selected' : '')} onClick={() => setSelected(id)}><span>{label}</span><strong>{format(price)} ج</strong></button>; }
function EmptyCheckout({ phase }: { phase: string }) { return <div className="empty-checkout"><span>{phase === 'results' ? '🌙' : '🧍'}</span><h3>{phase === 'results' ? 'انتهى اليوم' : 'لا يوجد زبائن حاليًا'}</h3><p>{phase === 'playing' ? 'الزبون التالي يصل خلال لحظات.' : 'جهّز المنتجات ثم افتح الدكان.'}</p></div>; }

function InventoryModal({ game, onRestock, lowIds }: { game: ReturnType<typeof useDokanGame>['game']; onRestock: (id: string) => void; lowIds: string[] }) { return <div className="inventory-modal">{game.products.map((product) => { const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock); const market = getMarketPrice(game, product); return <div className="inventory-row" key={product.id}><span>{product.icon}</span><div><strong>{product.name} {product.availableFromDay === 2 && <em className="new-badge">جديد في Day 2</em>}</strong><small>{product.category} · {product.brand} · جودة {product.quality}/100</small><p>{market.label} · بيع {format(market.sale)}ج · شراء {format(market.cost)}ج {lowIds.includes(product.id) && <b className="stock-warning">⚠️ مخزون منخفض</b>}</p></div><div className="stock-control"><b>{product.stock}/{product.maxStock}</b><button disabled={product.stock >= product.maxStock || game.money < amount * market.cost} onClick={() => onRestock(product.id)}>توريد +{amount}</button></div></div>; })}</div>; }
function SupplierPanel({ game, onAction }: { game: ReturnType<typeof useDokanGame>['game']; onAction: (choice: SupplierChoice) => void }) {
  const offer = game.supplierOffer;
  const product = offer && game.products.find((item) => item.id === offer.productId);
  if (!offer || !product) return null;
  const canStock = product.stock < product.maxStock;
  const currentUnitCost = offer.status === 'discounted' ? offer.discountUnitCost : offer.normalUnitCost;
  const normalTotal = currentUnitCost * Math.min(offer.amount, product.maxStock - product.stock);
  const bulkTotal = offer.bulkUnitCost * Math.min(offer.amount + 4, product.maxStock - product.stock);
  return <div className="supplier-panel"><div className="supplier-head"><span>🚚</span><div><strong>الحاج رضا — مورد الحارة</strong><p>{offer.message}</p></div></div><div className="supplier-product"><span>{product.icon}</span><div><b>{product.name}</b><small>{offer.amount} وحدات · سعر اليوم {currentUnitCost}ج للوحدة</small></div></div><div className="supplier-options"><button className="sell-button" disabled={!canStock || game.money < normalTotal} onClick={() => onAction('buy')}>اشترِ بالسعر الحالي ({format(normalTotal)} ج)</button><button className="negotiate-button" disabled={offer.status !== 'available'} onClick={() => onAction('negotiate')}>🤝 حاول تخفض السعر</button><button className="restock-button" disabled={!canStock || game.money < bulkTotal} onClick={() => onAction('bulk')}>📦 كمية أكبر بسعر {offer.bulkUnitCost} ج</button><button className="decline-button" onClick={() => onAction('decline')}>ارجع لاحقًا</button></div>{offer.status === 'discounted' && <p className="supplier-success">✓ صار سعر الفصال {offer.discountUnitCost} ج للوحدة؛ اشترِ الآن للاستفادة.</p>}</div>;
}
function DayMemo({ game }: { game: ReturnType<typeof useDokanGame>['game'] }) {
  const progress = game.metrics.served + game.metrics.left;
  const next = game.queue[game.queueIndex] ? customersForDay(game.day).find((customer) => customer.id === game.queue[game.queueIndex]) : undefined;
  return <div className="day-memo"><div className="memo-highlight"><span>{game.day === 2 ? '🚀' : '📅'}</span><div><strong>{dayName(game.day)} · دكان زمان</strong><p>{game.phase === 'intro' ? 'جهّز الرفوف قبل فتح الباب.' : 'تم التعامل مع ' + progress + ' من ' + game.metrics.totalCustomers + ' زبونًا.'}</p></div></div>{game.market.activeEvent && <div className="memo-event"><span>{game.market.activeEvent.icon}</span><p><b>{game.market.activeEvent.title}</b>{game.market.activeEvent.description}</p></div>}<div className="memo-stats"><div><small>السيولة</small><b>{format(game.money)} ج</b></div><div><small>صافي الربح</small><b className={netProfit(game.metrics) >= 0 ? 'positive' : 'negative'}>{format(netProfit(game.metrics))} ج</b></div><div><small>السمعة</small><b>{game.reputation}/100</b></div><div><small>الرضا</small><b>{averageSatisfaction(game)}%</b></div></div>{next && <div className="memo-next"><span>{next.avatar}</span><p>القادم: <b>{next.name}</b><small>{next.kind} · {next.bio}</small></p></div>}</div>;
}
function Settings({ game, updateAudio, updateQuality }: { game: ReturnType<typeof useDokanGame>['game']; updateAudio: (field: 'master' | 'music' | 'sfx' | 'muted', value: number | boolean) => void; updateQuality: (quality: keyof typeof QUALITY_LABELS) => void }) { return <div className="settings-panel"><button className="sound-toggle" onClick={() => updateAudio('muted', !game.audio.muted)}>{game.audio.muted ? '🔇 تفعيل الصوت' : '🔊 كتم الصوت'}</button><Slider label="الصوت العام" value={game.audio.master} onChange={(value) => updateAudio('master', value)} /><Slider label="الموسيقى" value={game.audio.music} onChange={(value) => updateAudio('music', value)} /><Slider label="المؤثرات" value={game.audio.sfx} onChange={(value) => updateAudio('sfx', value)} /><label className="quality-select">جودة الأداء<select value={game.settings.quality} onChange={(event) => updateQuality(event.target.value as keyof typeof QUALITY_LABELS)}>{Object.entries(QUALITY_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>; }
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="range-label">{label}<b>{value}%</b><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Guide({ day }: { day: number }) { return <div className="guide"><p><b>1.</b> ابدأ بشراء المخزون من «تجهيز البضائع»؛ الرف الفارغ يضيّع المبيعات.</p><p><b>2.</b> السعر الحالي يربح أكثر، والخصم أو الفصال يرفعان الرضا غالبًا.</p><p><b>3.</b> إذا نقص منتج، استخدم «عرض بديل» بدل فقدان الزبون فورًا.</p>{day >= 2 && <><p><b>4.</b> راقب مؤشر السوق: المنخفض فرصة شراء، والمرتفع فرصة بيع مخزونك.</p><p><b>5.</b> تفاوض مع المورد مرة واحدة فقط؛ صفقة الجملة تقلل تكلفة الوحدة لكنها تستهلك رأس المال.</p></>}<p><b>{day >= 2 ? '6' : '4'}.</b> بعد كل عملية ستظل رسالة الزبون حتى تضغط «التالي».</p></div>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="modal-layer" onMouseDown={close}><section className="modal" onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button onClick={close} aria-label="إغلاق">×</button></header>{children}</section></div>; }
function DayTwoUpdate({ onContinue }: { onContinue: () => void }) {
  const features = [['👥', 'زبائن جدد', '42 شخصية بطباع وطلبات مختلفة'], ['📦', 'منتجات أكثر', '8 أصناف جديدة تدخل في طلبات حقيقية'], ['🤝', 'تفاوض مع الموردين', 'اخفض سعر الشراء أو اشترِ كمية جملة'], ['📈', 'أسعار السوق', 'الأسعار تغير تكلفة التوريد والبيع'], ['💡', 'أحداث جديدة', 'حدث واحد واضح يؤثر على كل قرارك']];
  return <div className="update-layer"><section className="update-card"><p className="eyebrow">تحديث جديد!</p><h2>اليوم الثاني</h2><p>تجربة أكبر… تحديات أكثر… متعة ما بتخلص!</p><div className="update-features">{features.map((feature) => <article key={feature[1]}><span>{feature[0]}</span><div><b>{feature[1]}</b><small>{feature[2]}</small></div></article>)}</div><button className="primary large" onClick={onContinue}>ابدأ اليوم الثاني ←</button><button className="reset-link" onClick={onContinue}>لاحقًا</button></section></div>;
}
function Results({ game, onNextDay, onMenu }: { game: ReturnType<typeof useDokanGame>['game']; onNextDay: () => void; onMenu: () => void }) {
  const net = netProfit(game.metrics);
  const satisfaction = averageSatisfaction(game);
  const ranked = bestAndWorstProducts(game);
  return <div className="results-layer"><section className="results-card"><span className="celebration">🎉</span><p className="eyebrow">DAY {game.day} COMPLETE</p><h2>انتهى {dayName(game.day)}</h2><p>أغلقت المحل بعد يوم مليان زباين وقرارات.</p><div className="results-grid"><Result label="إجمالي الزبائن" value={game.metrics.totalCustomers} /><Result label="تمت خدمتهم" value={game.metrics.served} /><Result label="إجمالي المبيعات" value={format(game.metrics.sales) + ' ج'} /><Result label="تكلفة المنتجات" value={format(game.metrics.costs) + ' ج'} /><Result label="إجمالي الخصومات" value={format(game.metrics.discounts) + ' ج'} /><Result label="صافي الربح" value={format(net) + ' ج'} positive={net >= 0} /><Result label="رضا العملاء" value={satisfaction + '%'} /><Result label="سمعة المحل" value={game.reputation + '%'} /></div><div className="bestsellers"><div><span>{ranked.best.icon}</span><p>الأكثر مبيعًا<b>{ranked.best.name} · {ranked.best.sold} وحدات</b></p></div><div><span>{ranked.worst.icon}</span><p>الأقل مبيعًا<b>{ranked.worst.name} · {ranked.worst.sold} وحدات</b></p></div></div>{game.day === 1 ? <button className="primary large" onClick={onNextDay}>ابدأ اليوم الثاني ←</button> : <button className="primary large" onClick={onMenu}>العودة للقائمة الرئيسية</button>}</section></div>;
}
function Result({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) { return <div><span>{label}</span><b className={positive ? 'positive' : ''}>{value}</b></div>; }
