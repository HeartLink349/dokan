'use client';

import { useEffect, useMemo, useState } from 'react';
import { GAME_CONFIG, QUALITY_LABELS } from './game/config';
import { DAY_ONE_CUSTOMERS } from './game/data/customers';
import { PRODUCT_CATALOG } from './game/data/products';
import { averageSatisfaction, bestAndWorstProducts, cartDescription, getQuote, netProfit } from './game/core/game';
import { useDokanGame } from './game/hooks/useDokanGame';
import type { CustomerState, PriceChoice, Product } from './game/types';

type ModalName = 'inventory' | 'settings' | 'guide' | 'memo' | null;

const stateLabel: Record<CustomerState, string> = {
  ENTERING: 'داخل المحل', WAITING: 'ينتظر', BROWSING: 'يتفقد الرفوف', REQUESTING: 'يطلب', NEGOTIATING: 'يفاصل', BUYING: 'تجهيز الطلب', PAYING: 'يدفع', SATISFIED: 'راضٍ', IMPATIENT: 'نفد صبره', ANGRY: 'غاضب', LEAVING: 'يغادر',
};
const format = (value: number) => new Intl.NumberFormat('ar-EG').format(value);
const formatClock = (handled: number) => {
  const minutes = Math.min(150, handled * 7);
  return `08:${String(minutes).padStart(2, '0')}`;
};

export default function Home() {
  const dokan = useDokanGame();
  const { game } = dokan;
  const [modal, setModal] = useState<ModalName>(null);
  const quote = useMemo(() => getQuote(game), [game]);
  const current = game.currentCustomer;
  const progress = game.metrics.served + game.metrics.left;
  const remaining = Math.max(0, game.metrics.totalCustomers - progress);
  const nextCustomer = game.queue.slice(game.queueIndex, game.queueIndex + 1).map((id) => DAY_ONE_CUSTOMERS.find((customer) => customer.id === id))[0];
  const currentNet = netProfit(game.metrics);
  const lowStockProducts = game.products.filter((product) => dokan.lowStockIds.includes(product.id));
  const hasStock = game.products.some((product) => product.stock > 0);
  const customerFinished = Boolean(current && ['SATISFIED', 'LEAVING', 'ANGRY'].includes(current.state));
  const eventMessage = lowStockProducts.length ? `⚠️ ${lowStockProducts[0].name} قرب يخلص من الرف.` : current ? '✨ زباين الحارة يراقبون سرعة خدمتك.' : '⚡ راقب المخزون قبل فتح الدكان.';

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, []);

  return <main className={`dokan-app quality-${game.settings.quality}`} dir="rtl">
    <div className="game-shell">
      <header className="topbar">
        <section className="top-day panel"><b>اليوم الأول</b><span>📅</span><small>Day 1 · محل الحارة</small></section>
        <TopMetric icon="🕗" label="الوقت" value={formatClock(progress)} sub="صباحًا" />
        <TopMetric icon="💵" label={game.phase === 'intro' ? 'رأس المال' : 'السيولة'} value={`${format(game.money)} ج`} />
        <TopMetric icon="📈" label="الربح" value={`${format(currentNet)} ج`} tone={currentNet >= 0 ? 'positive' : 'negative'} />
        <TopMetric icon="⭐" label="السمعة" value={`${game.reputation}`} sub={`/100 · ${averageSatisfaction(game)}% رضا`} />
        <nav className="top-actions" aria-label="قائمة التحكم">
          <button onClick={() => setModal('memo')} title="مذكرة اليوم"><span>📋</span>المذكرة</button>
          <button onClick={() => setModal('settings')} title="الإعدادات"><span>⚙️</span>الإعدادات</button>
          <button onClick={() => setModal('inventory')} title="قائمة المخزون"><span>☰</span>القائمة</button>
        </nav>
      </header>

      <div className="game-board">
        <aside className="left-column">
          <section className="panel objective-panel">
            <PanelTitle icon="🎯" title="أهداف اليوم" />
            <Objective done={currentNet >= 250} text="حقق ربحًا لا يقل عن 250 ج" />
            <Objective done={game.reputation >= 40} text="لا تنخفض السمعة عن 40" />
            <Objective done={game.products.filter((item) => item.stock > 0).length >= 8} text="جهّز 8 منتجات على الأقل" />
          </section>
          <StorePanel products={game.products} money={game.money} lowIds={dokan.lowStockIds} onRestock={dokan.restock} onManage={() => setModal('inventory')} />
        </aside>

        <section className="main-scene">
          <div className="scene-frame" aria-label="مشهد دكان الحارة">
            <img src="/store-scene.jpg" alt="داخل دكان حارة مصري" draggable={false} />
            <div className="scene-shade" />
            {current && <div className={`customer-actor ${current.state.toLowerCase()}`}><span>{current.avatar}</span><b>{current.name}</b></div>}
            <div className="scene-status"><span className={game.phase === 'playing' ? 'open-dot' : 'closed-dot'} />{game.phase === 'playing' ? 'المحل مفتوح' : game.phase === 'results' ? 'أُغلق المحل' : 'جهّز البضاعة أولًا'}</div>
            {current && <div className="dialogue-bubble"><small>{current.name} • {current.kind} • {stateLabel[current.state]}</small><div className="dialogue-body"><p>{current.message}</p>{customerFinished && <button className="dialogue-next" onClick={dokan.next}>التالي ←</button>}</div></div>}
            {!current && game.phase === 'playing' && <div className="scene-message">باب الدكان مفتوح… الزبون التالي في الطريق.</div>}
            {game.phase === 'intro' && <div className="opening-prompt"><span>🏪</span><h2>صباح اليوم الأول</h2><p>معك {format(GAME_CONFIG.initialCapital)} ج. جهّز بضاعة من القائمة ثم افتح الدكان.</p><div className="opening-actions"><button className="secondary-start" onClick={() => setModal('inventory')}>📦 تجهيز البضائع</button><button className="primary large" onClick={dokan.open} disabled={!hasStock}>افتح الدكان</button></div></div>}
          </div>
        </section>

        <aside className="right-column">
          <section className="panel event-panel"><PanelTitle icon="⚡" title="حدث اليوم" /><div className="event-copy"><span>{lowStockProducts.length ? '⚠️' : '✨'}</span><div><strong>{lowStockProducts.length ? 'تنبيه مخزون' : 'أجواء الحارة'}</strong><p>{eventMessage}</p></div></div></section>
          <section className="panel customer-panel">
            <PanelTitle icon="🧍" title="الزبون الحالي" badge={current ? stateLabel[current.state] : 'لا يوجد'} />
            {current ? <CustomerCheckout current={current} products={game.products} quote={quote} selected={dokan.selectedPrice} setSelected={dokan.setSelectedPrice} onChoose={dokan.choosePrice} onNegotiate={dokan.negotiate} onLeave={dokan.leave} onRestock={dokan.restock} onNext={dokan.next} /> : <EmptyCheckout phase={game.phase} />}
          </section>
        </aside>
      </div>

      <footer className="bottom-panels">
        <section className="panel memo-panel"><PanelTitle icon="📝" title="مذكرة اليوم" /><dl><dt>المبيعات</dt><dd>{format(game.metrics.sales)} ج</dd><dt>تكلفة البضاعة</dt><dd>{format(game.metrics.costs)} ج</dd><dt>الخصومات</dt><dd>{format(game.metrics.discounts)} ج</dd><dt>الزبائن</dt><dd>{progress}/{game.metrics.totalCustomers}</dd><dt>السمعة</dt><dd>{game.reputation}/100 ⭐</dd></dl></section>
        <section className="panel timeline-panel"><PanelTitle icon="📜" title="سجل الأحداث" /> <div className="event-log">{game.metrics.log.slice(-3).reverse().map((line, index) => <p key={`${line}-${index}`}><b>{index === 0 ? formatClock(progress) : '—'}</b>{line}</p>)}</div></section>
        <section className="panel next-panel"><PanelTitle icon="🚶" title="القادم في الطريق" />{nextCustomer ? <div className="next-customer"><span>{nextCustomer.avatar}</span><div><strong>{nextCustomer.name}</strong><p>{nextCustomer.kind} · {nextCustomer.bio}</p></div></div> : <p className="quiet-note">انتهت قائمة زباين اليوم.</p>}<button className="outline-button" onClick={() => setModal('guide')}>اعرف طريقة التعامل ←</button></section>
        <section className="panel end-panel"><PanelTitle icon="🌙" title="نهاية اليوم" /><p>باقي {remaining} زبونًا قبل إغلاق اليوم.</p><button className="end-button" onClick={dokan.closeDay} disabled={game.phase === 'intro' || game.phase === 'results'}>إنهاء اليوم الآن</button></section>
      </footer>
    </div>

    <div className="portrait-overlay" role="dialog" aria-label="استخدم الهاتف بالعرض"><span>📱↻</span><h2>لفّ الموبايل بالعرض</h2><p>دكان الحارة مصمم للعب الأفقي.</p></div>
    {dokan.toast && <div className="toast" role="status">{dokan.toast}</div>}
    {game.phase === 'results' && <Results game={game} onRestart={dokan.restart} />}
    {modal === 'inventory' && <Modal title="تجهيز البضائع" close={() => setModal(null)}><InventoryModal products={game.products} money={game.money} onRestock={dokan.restock} lowIds={dokan.lowStockIds} /></Modal>}
    {modal === 'settings' && <Modal title="الإعدادات" close={() => setModal(null)}><Settings game={game} updateAudio={dokan.updateAudio} updateQuality={dokan.updateQuality} /></Modal>}
    {modal === 'memo' && <Modal title="مذكرة اليوم" close={() => setModal(null)}><DayMemo game={game} /></Modal>}
    {modal === 'guide' && <Modal title="طريقة اللعب" close={() => setModal(null)}><Guide /></Modal>}
  </main>;
}

function PanelTitle({ icon, title, badge }: { icon: string; title: string; badge?: string }) { return <div className="panel-title"><h2>{icon} {title}</h2>{badge && <span>{badge}</span>}</div>; }
function TopMetric({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: 'positive' | 'negative' }) { return <section className="top-metric panel"><span>{icon}</span><div><small>{label}</small><b className={tone}>{value}</b>{sub && <em>{sub}</em>}</div></section>; }
function Objective({ done, text }: { done: boolean; text: string }) { return <div className={`objective ${done ? 'done' : ''}`}><span>{done ? '✓' : '○'}</span><p>{text}</p><b>⭐</b></div>; }

function StorePanel({ products, money, lowIds, onRestock, onManage }: { products: Product[]; money: number; lowIds: string[]; onRestock: (id: string) => void; onManage: () => void }) {
  const stocked = products.filter((product) => product.stock > 0);
  // Once the player starts stocking items, the rest of the catalogue must
  // remain reachable for future purchases as well.
  const display = products;
  return <section className="panel store-panel"><PanelTitle icon="📦" title="المتجر" /><div className="store-subtitle"><span>المنتجات ({stocked.length}/{products.length})</span><button onClick={onManage}>عرض الكل</button></div><div className="store-list">{display.map((product) => { const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock); const bill = amount * product.cost; return <article className={`store-row ${lowIds.includes(product.id) ? 'low-stock' : ''}`} key={product.id}><span>{product.icon}</span><div><strong>{product.name}</strong><small>سعر {format(product.price)} · تكلفة {format(product.cost)}</small></div><button disabled={!amount || money < bill} onClick={() => onRestock(product.id)} title={`توريد ${product.name}`}>{product.stock || `+${amount}`}</button></article>; })}</div><button className="stock-button" onClick={onManage}>📦 تجهيز البضائع</button></section>;
}

function CustomerCheckout({ current, products, quote, selected, setSelected, onChoose, onNegotiate, onLeave, onRestock, onNext }: { current: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>; products: Product[]; quote: ReturnType<typeof getQuote>; selected: PriceChoice; setSelected: (value: PriceChoice) => void; onChoose: (value: PriceChoice) => void; onNegotiate: () => void; onLeave: () => void; onRestock: (productId: string) => void; onNext: () => void }) {
  const ready = ['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(current.state);
  const terminal = ['SATISFIED', 'LEAVING', 'ANGRY'].includes(current.state);
  const unavailable = current.basket.flatMap((line) => { const product = products.find((item) => item.id === line.productId); return product && product.stock < line.quantity ? [{ product, missing: line.quantity - product.stock }] : []; });
  const selectedPrice = quote[selected];
  return <div className="checkout-content">
    <div className="customer-summary"><span>{current.avatar}</span><div><h3>{current.name}</h3><p>{current.kind} · {current.bio}</p></div></div>
    <div className="customer-meter"><span>الصبر</span><i><b style={{ width: `${current.patienceNow}%` }} /></i><strong>{Math.round(current.patienceNow)}%</strong></div>
    <div className="customer-meter"><span>الرضا</span><i><b style={{ width: `${current.satisfactionNow}%` }} /></i><strong>{Math.round(current.satisfactionNow)}%</strong></div>
    <div className="order-card"><small>الطلب</small><strong>{cartDescriptionFromCustomer(current)}</strong><div><span>الميزانية</span><b>{format(current.budget)} ج</b></div></div>
    {terminal ? <div className="outcome-action"><span>{current.state === 'SATISFIED' ? '✅' : '🚪'}</span><p>{current.message}</p><button className="primary action-button" onClick={onNext}>الزبون التالي ←</button><small>الرسالة ستبقى حتى تكمل أنت.</small></div> : ready ? <>
      {unavailable.length > 0 && <div className="order-stockout"><b>⚠️ الطلب ناقص</b><p>{unavailable.map(({ product, missing }) => `${product.icon} ${product.name}: ناقص ${missing}`).join(' • ')}</p><div>{unavailable.map(({ product }) => <button key={product.id} onClick={() => onRestock(product.id)}>توريد {product.name}</button>)}</div></div>}
      <div className="price-options"><PriceOption id="full" selected={selected} label="السعر الحالي" price={quote.full} setSelected={setSelected} /><PriceOption id="smallDiscount" selected={selected} label="خصم بسيط" price={quote.smallDiscount} setSelected={setSelected} /><PriceOption id="customerOffer" selected={selected} label="عرض الزبون" price={quote.customerOffer} setSelected={setSelected} /></div>
      <div className="deal-preview"><span>ربح الصفقة <b className={selectedPrice - quote.cost >= 0 ? 'positive' : 'negative'}>{format(selectedPrice - quote.cost)} ج</b></span><span>خصم <b>{format(quote.full - selectedPrice)} ج</b></span></div>
      <div className="cashier-actions"><button className="sell-button" onClick={() => onChoose(selected)}>💵 بيع بـ {format(selectedPrice)} ج</button><button className="negotiate-button" onClick={onNegotiate}>🤝 تفاوض على السعر</button>{unavailable.length > 0 && <button className="restock-button" onClick={() => onRestock(unavailable[0].product.id)}>📦 اقترح منتجًا آخر</button>}<button className="decline-button" onClick={onLeave}>🚫 رفض البيع</button></div>
    </> : <div className="waiting-action"><span>{current.state === 'ENTERING' ? '🚪' : current.state === 'BROWSING' ? '🔎' : current.state === 'BUYING' ? '🛍️' : current.state === 'PAYING' ? '💳' : '🌟'}</span><p>تتحرك العملية الآن…</p></div>}
  </div>;
}

function cartDescriptionFromCustomer(customer: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>) { return customer.basket.map((line) => { const product = PRODUCT_CATALOG.find((item) => item.id === line.productId); return `${line.quantity > 1 ? `${line.quantity}× ` : ''}${product?.name ?? line.productId}`; }).join('، '); }
function PriceOption({ id, selected, label, price, setSelected }: { id: PriceChoice; selected: PriceChoice; label: string; price: number; setSelected: (value: PriceChoice) => void }) { return <button className={`price-option ${selected === id ? 'selected' : ''}`} onClick={() => setSelected(id)}><span>{label}</span><strong>{format(price)} ج</strong></button>; }
function EmptyCheckout({ phase }: { phase: string }) { return <div className="empty-checkout"><span>{phase === 'results' ? '🌙' : '🧍'}</span><h3>{phase === 'results' ? 'انتهى اليوم' : 'لا يوجد زبائن حاليًا'}</h3><p>{phase === 'playing' ? 'الزبون التالي يصل خلال لحظات.' : 'جهّز المنتجات ثم افتح الدكان.'}</p></div>; }

function InventoryModal({ products, money, onRestock, lowIds }: { products: Product[]; money: number; onRestock: (id: string) => void; lowIds: string[] }) { return <div className="inventory-modal">{products.map((product) => { const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock); return <div className="inventory-row" key={product.id}><span>{product.icon}</span><div><strong>{product.name}</strong><small>{product.category} · {product.brand} · جودة {product.quality}/100</small><p>سعر البيع {format(product.price)}ج · التكلفة {format(product.cost)}ج {lowIds.includes(product.id) && <b className="stock-warning">⚠️ مخزون منخفض</b>}</p></div><div className="stock-control"><b>{product.stock}/{product.maxStock}</b><button disabled={product.stock >= product.maxStock || money < amount * product.cost} onClick={() => onRestock(product.id)}>توريد +{amount}</button></div></div>; })}</div>; }
function DayMemo({ game }: { game: ReturnType<typeof useDokanGame>['game'] }) { const progress = game.metrics.served + game.metrics.left; const next = game.queue[game.queueIndex] ? DAY_ONE_CUSTOMERS.find((customer) => customer.id === game.queue[game.queueIndex]) : undefined; return <div className="day-memo"><div className="memo-highlight"><span>📅</span><div><strong>اليوم الأول · محل الحارة</strong><p>{game.phase === 'intro' ? 'جهّز الرفوف قبل فتح الباب.' : `تم التعامل مع ${progress} من ${game.metrics.totalCustomers} زبونًا.`}</p></div></div><div className="memo-stats"><div><small>السيولة</small><b>{format(game.money)} ج</b></div><div><small>صافي الربح</small><b className={netProfit(game.metrics) >= 0 ? 'positive' : 'negative'}>{format(netProfit(game.metrics))} ج</b></div><div><small>السمعة</small><b>{game.reputation}/100</b></div><div><small>الرضا</small><b>{averageSatisfaction(game)}%</b></div></div><div className="memo-goals"><p><span>{netProfit(game.metrics) >= 250 ? '✓' : '○'}</span> حقق ربحًا لا يقل عن 250 ج</p><p><span>{game.reputation >= 40 ? '✓' : '○'}</span> لا تنخفض السمعة عن 40</p><p><span>{game.products.filter((item) => item.stock > 0).length >= 8 ? '✓' : '○'}</span> جهّز 8 منتجات على الأقل</p></div>{next && <div className="memo-next"><span>{next.avatar}</span><p>القادم: <b>{next.name}</b><small>{next.kind} · {next.bio}</small></p></div>}</div>; }
function Settings({ game, updateAudio, updateQuality }: { game: ReturnType<typeof useDokanGame>['game']; updateAudio: (field: 'master' | 'music' | 'sfx' | 'muted', value: number | boolean) => void; updateQuality: (quality: keyof typeof QUALITY_LABELS) => void }) { return <div className="settings-panel"><button className="sound-toggle" onClick={() => updateAudio('muted', !game.audio.muted)}>{game.audio.muted ? '🔇 تفعيل الصوت' : '🔊 كتم الصوت'}</button><Slider label="الصوت العام" value={game.audio.master} onChange={(value) => updateAudio('master', value)} /><Slider label="الموسيقى" value={game.audio.music} onChange={(value) => updateAudio('music', value)} /><Slider label="المؤثرات" value={game.audio.sfx} onChange={(value) => updateAudio('sfx', value)} /><label className="quality-select">جودة الأداء<select value={game.settings.quality} onChange={(event) => updateQuality(event.target.value as keyof typeof QUALITY_LABELS)}>{Object.entries(QUALITY_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>; }
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="range-label">{label}<b>{value}%</b><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Guide() { return <div className="guide"><p><b>1.</b> ابدأ بشراء المخزون من «تجهيز البضائع»؛ الرف الفارغ يضيّع المبيعات.</p><p><b>2.</b> راقب الميزانية والصبر قبل اختيار السعر.</p><p><b>3.</b> السعر الحالي يربح أكثر، والخصم أو الفصال يرفعان الرضا غالبًا.</p><p><b>4.</b> بعد كل عملية ستظل رسالة الزبون حتى تضغط «التالي».</p><p><b>5.</b> مفاتيح الكمبيوتر: Enter للبيع، Space للفصال، والأسهم لتغيير السعر.</p></div>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="modal-layer" onMouseDown={close}><section className="modal" onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button onClick={close} aria-label="إغلاق">×</button></header>{children}</section></div>; }

function Results({ game, onRestart }: { game: ReturnType<typeof useDokanGame>['game']; onRestart: () => void }) { const net = netProfit(game.metrics); const satisfaction = averageSatisfaction(game); const { best, worst } = bestAndWorstProducts(game); return <div className="results-layer"><section className="results-card"><span className="celebration">🎉</span><p className="eyebrow">DAY 1 COMPLETE</p><h2>أحسنت يا صاحب الدكان!</h2><p>أغلقت المحل بعد يوم مليان زباين وقرارات.</p><div className="results-grid"><Result label="إجمالي الزبائن" value={game.metrics.totalCustomers} /><Result label="تمت خدمتهم" value={game.metrics.served} /><Result label="إجمالي المبيعات" value={`${format(game.metrics.sales)} ج`} /><Result label="تكلفة المنتجات" value={`${format(game.metrics.costs)} ج`} /><Result label="إجمالي الخصومات" value={`${format(game.metrics.discounts)} ج`} /><Result label="صافي الربح" value={`${format(net)} ج`} positive={net >= 0} /><Result label="رضا العملاء" value={`${satisfaction}%`} /><Result label="سمعة المحل" value={`${game.reputation}%`} /></div><div className="bestsellers"><div><span>{best.icon}</span><p>الأكثر مبيعًا<b>{best.name} · {best.sold} وحدات</b></p></div><div><span>{worst.icon}</span><p>الأقل مبيعًا<b>{worst.name} · {worst.sold} وحدات</b></p></div></div><button className="primary large" onClick={onRestart}>إعادة لعب اليوم الأول</button></section></div>; }
function Result({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) { return <div><span>{label}</span><b className={positive ? 'positive' : ''}>{value}</b></div>; }
