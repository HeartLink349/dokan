'use client';

import { useEffect, useMemo, useState } from 'react';
import { GAME_CONFIG, QUALITY_LABELS } from './game/config';
import { DAY_ONE_CUSTOMERS } from './game/data/customers';
import { PRODUCT_CATALOG } from './game/data/products';
import { averageSatisfaction, bestAndWorstProducts, cartDescription, getQuote, netProfit } from './game/core/game';
import { useDokanGame } from './game/hooks/useDokanGame';
import type { CustomerState, PriceChoice, Product } from './game/types';

type ModalName = 'inventory' | 'settings' | 'guide' | null;
const stateLabel: Record<CustomerState, string> = {
  ENTERING: 'داخل المحل', WAITING: 'ينتظر', BROWSING: 'يتفقد الرفوف', REQUESTING: 'يطلب', NEGOTIATING: 'يفاصل', BUYING: 'تجهيز الطلب', PAYING: 'يدفع', SATISFIED: 'راضٍ', IMPATIENT: 'نفد صبره', ANGRY: 'غاضب', LEAVING: 'يغادر',
};
const format = (value: number) => new Intl.NumberFormat('ar-EG').format(value);

export default function Home() {
  const dokan = useDokanGame();
  const { game } = dokan;
  const [modal, setModal] = useState<ModalName>(null);
  const quote = useMemo(() => getQuote(game), [game]);
  const current = game.currentCustomer;
  const progress = game.metrics.served + game.metrics.left;
  const remaining = Math.max(0, game.metrics.totalCustomers - progress);
  const queuePreview = game.queue.slice(game.queueIndex, game.queueIndex + 3).map((id) => DAY_ONE_CUSTOMERS.find((customer) => customer.id === id)).filter(Boolean);
  const currentNet = netProfit(game.metrics);
  const lowStockProducts = game.products.filter((product) => dokan.lowStockIds.includes(product.id));

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, []);

  return <main className={`dokan-app quality-${game.settings.quality}`} dir="rtl">
    <header className="app-header">
      <div className="brand-lockup"><span className="brand-store">د</span><div><strong>دكان الحارة</strong><small>محاكاة بقالة مصرية • اليوم الأول</small></div></div>
      <div className="stat-strip" aria-label="إحصاءات اليوم">
        <Stat icon="👥" label="الزبائن" value={`${progress}/${game.metrics.totalCustomers}`} />
        <Stat icon="💵" label="السيولة" value={`${format(game.money)} ج`} />
        <Stat icon="📈" label="صافي الربح" value={`${format(currentNet)} ج`} tone={currentNet >= 0 ? 'good' : 'bad'} />
        <Stat icon="⭐" label="السمعة" value={`${game.reputation}/100`} tone={game.reputation > 66 ? 'good' : undefined} />
      </div>
      <div className="header-actions">
        <button onClick={() => setModal('guide')} title="طريقة اللعب">؟ <span>المساعدة</span></button>
        <button onClick={() => setModal('inventory')} title="إدارة المخزون">📦 <span>المخزون</span></button>
        <button onClick={() => setModal('settings')} title="الإعدادات">⚙ <span>الإعدادات</span></button>
      </div>
    </header>

    <div className="game-layout">
      <aside className="left-rail">
        <section className="surface day-card">
          <p className="eyebrow">خطة التشغيل</p><h1>اليوم الأول</h1>
          <div className="progress-track"><i style={{ width: `${progress / game.metrics.totalCustomers * 100}%` }} /></div>
          <p>{remaining ? `باقي ${remaining} زبون في اليوم` : 'تمت خدمة كل زبائن اليوم'}</p>
          <div className="day-objectives">
            <Objective done={game.metrics.served >= 25} text="خدمة 25 زبونًا أو أكثر" value={`${game.metrics.served}/25`} />
            <Objective done={game.reputation >= 65} text="حافظ على السمعة فوق 65" value={`${game.reputation}/65`} />
            <Objective done={currentNet >= 500} text="حقق صافي 500ج" value={`${format(Math.max(0, currentNet))}/500`} />
          </div>
        </section>
        <section className="surface queue-card">
          <div className="section-title"><h2>🚶 في الطريق</h2><span>{remaining}</span></div>
          {queuePreview.length ? queuePreview.map((customer) => customer && <div className="queue-person" key={customer.id}><b>{customer.avatar}</b><div><strong>{customer.name}</strong><small>{customer.kind} • {customer.bio}</small></div></div>) : <p className="empty-note">انتهت قائمة زبائن اليوم.</p>}
        </section>
        <section className="surface log-card">
          <div className="section-title"><h2>📒 آخر الأحداث</h2></div>
          <div className="event-log">{game.metrics.log.slice(-5).reverse().map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
        </section>
      </aside>

      <section className="play-area">
        <div className="scene-frame" aria-label="مشهد دكان الحارة">
          <img src="/store-scene.jpg" alt="خلفية لعبة دكان الحارة" draggable={false} />
          <div className="scene-shade" />
          {current && <div className={`customer-actor ${current.state.toLowerCase()}`}><span>{current.avatar}</span><b>{current.name}</b></div>}
          {game.phase === 'playing' && queuePreview.length > 0 && <div className="scene-queue" aria-label="زبائن في انتظار دورهم"><small>في الانتظار</small><div>{queuePreview.slice(0, 2).map((customer, index) => customer && <span key={customer.id} className={`queue-actor queue-${index}`} title={`${customer.name} — ${customer.kind}`}>{customer.avatar}</span>)}</div></div>}
          <div className="scene-status"><span className={game.phase === 'playing' ? 'open-dot' : 'closed-dot'} />{game.phase === 'playing' ? 'المحل مفتوح' : game.phase === 'results' ? 'أُغلق المحل' : 'في انتظار فتح المحل'}</div>
          {current && <div className="dialogue-bubble"><small>{current.name} • {current.kind} • {stateLabel[current.state]}</small><p>{current.message}</p></div>}
          {!current && game.phase === 'playing' && <div className="scene-message">باب الدكان مفتوح… الزبون التالي في الطريق.</div>}
          {game.phase === 'intro' && <div className="opening-prompt"><span>🏪</span><h2>صباح جديد في الحارة</h2><p>جهّز المخزون، واستقبل 37 شخصية مختلفة اليوم.</p><button className="primary large" onClick={dokan.open}>افتح الدكان</button></div>}
        </div>
        <section className="inventory-dock surface">
          <div className="section-title"><div><h2>🛒 رفوف الدكان</h2><small>توريد سريع: +{GAME_CONFIG.restockAmount} وحدات بسعر التكلفة</small></div><button className="text-button" onClick={() => setModal('inventory')}>إدارة الكل ←</button></div>
          {lowStockProducts.length > 0 && <div className="stock-radar" role="status"><span>⚠️ مخزون منخفض:</span><div>{lowStockProducts.slice(0, 3).map((product) => <button key={product.id} onClick={() => dokan.restock(product.id)}>{product.icon} {product.name} ({product.stock})</button>)}</div></div>}
          <div className="product-grid">{game.products.map((product) => <ProductTile key={product.id} product={product} money={game.money} low={dokan.lowStockIds.includes(product.id)} onRestock={dokan.restock} />)}</div>
        </section>
      </section>

      <aside className="right-rail">
        <section className="surface customer-panel">
          <div className="section-title"><h2>🧾 الكاشير</h2>{current && <span className={`state-pill ${current.state.toLowerCase()}`}>{stateLabel[current.state]}</span>}</div>
          {current ? <CustomerCheckout current={current} products={game.products} quote={quote} selected={dokan.selectedPrice} setSelected={dokan.setSelectedPrice} onChoose={dokan.choosePrice} onNegotiate={dokan.negotiate} onLeave={dokan.leave} onRestock={dokan.restock} /> : <EmptyCheckout phase={game.phase} onClose={dokan.closeDay} />}
        </section>
        <section className="surface feedback-card">
          <div className="section-title"><h2>✨ قراءة المحل</h2></div>
          <Meter icon="❤️" label="الرضا العام" value={averageSatisfaction(game)} />
          <Meter icon="⭐" label="سمعة الدكان" value={game.reputation} />
          <div className="feedback-row"><span>عملاء مرجّح عودتهم</span><b>{game.metrics.likelyReturns}</b></div>
          <div className="feedback-row"><span>غادروا غاضبين</span><b className="negative">{game.metrics.angry}</b></div>
        </section>
        <p className="shortcut-tip">⌨ Enter بيع بالسعر المختار • Space فصال • ↑↓ تغيير الخيار • Esc إغلاق اللوحات</p>
      </aside>
    </div>

    {dokan.toast && <div className="toast" role="status">{dokan.toast}</div>}
    {game.phase === 'results' && <Results game={game} onRestart={dokan.restart} />}
    {modal === 'inventory' && <Modal title="إدارة المخزون" close={() => setModal(null)}><InventoryModal products={game.products} money={game.money} onRestock={dokan.restock} lowIds={dokan.lowStockIds} /></Modal>}
    {modal === 'settings' && <Modal title="الإعدادات" close={() => setModal(null)}><Settings game={game} updateAudio={dokan.updateAudio} updateQuality={dokan.updateQuality} /></Modal>}
    {modal === 'guide' && <Modal title="كيف تدير يومك؟" close={() => setModal(null)}><Guide /></Modal>}
  </main>;
}

function CustomerCheckout({ current, products, quote, selected, setSelected, onChoose, onNegotiate, onLeave, onRestock }: { current: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>; products: Product[]; quote: ReturnType<typeof getQuote>; selected: PriceChoice; setSelected: (value: PriceChoice) => void; onChoose: (value: PriceChoice) => void; onNegotiate: () => void; onLeave: () => void; onRestock: (productId: string) => void }) {
  const ready = ['REQUESTING', 'NEGOTIATING', 'IMPATIENT'].includes(current.state);
  const unavailable = current.basket.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product && product.stock < line.quantity ? [{ product, missing: line.quantity - product.stock }] : [];
  });
  const selectedPrice = quote[selected];
  const dealProfit = selectedPrice - quote.cost;
  const discount = quote.full - selectedPrice;
  return <div className="checkout-content">
    <div className="customer-summary"><span>{current.avatar}</span><div><h3>{current.name}</h3><p>{current.kind} · {current.bio}</p></div></div>
    <div className="meters"><Meter icon="⏳" label="الصبر" value={current.patienceNow} danger={current.patienceNow < 30} /><Meter icon="❤️" label="الرضا" value={current.satisfactionNow} /></div>
    <div className="order-card"><small>الطلب</small><strong>{cartDescriptionFromCustomer(current)}</strong><div><span>الميزانية</span><b>{format(current.budget)} ج</b></div></div>
    {ready ? <>
      {unavailable.length > 0 && <div className="order-stockout"><b>⚠️ الطلب ناقص من الرف</b><p>{unavailable.map(({ product, missing }) => `${product.icon} ${product.name}: ناقص ${missing}`).join(' • ')}</p><div>{unavailable.map(({ product }) => <button key={product.id} onClick={() => onRestock(product.id)}>📦 توريد {product.name}</button>)}</div></div>}
      <p className="price-heading">اختَر عرضك للزبون</p>
      <div className="price-options">
        <PriceOption id="full" selected={selected} label="السعر الكامل" price={quote.full} note="أعلى هامش ربح" setSelected={setSelected} />
        <PriceOption id="smallDiscount" selected={selected} label="خصم بسيط" price={quote.smallDiscount} note="خصم 8% على المتاح" setSelected={setSelected} />
        <PriceOption id="customerOffer" selected={selected} label="عرض الزبون" price={quote.customerOffer} note="يرفع الرضا غالبًا" setSelected={setSelected} />
      </div>
      <div className="deal-preview"><span>ربح الصفقة <b className={dealProfit >= 0 ? 'positive' : 'negative'}>{format(dealProfit)} ج</b></span><span>الخصم <b>{format(discount)} ج</b></span></div>
      <button className="primary commit" onClick={() => onChoose(selected)}>💵 إتمام البيع بـ {format(quote[selected])} ج</button>
      <div className="secondary-actions"><button onClick={onNegotiate}>🤝 فصال</button><button onClick={onLeave}>🚫 اعتذر عن البيع</button></div>
    </> : <div className="waiting-action"><span>{current.state === 'ENTERING' ? '🚪' : current.state === 'BROWSING' ? '🔎' : current.state === 'BUYING' ? '🛍️' : current.state === 'PAYING' ? '💳' : '🌟'}</span><p>تتحرك العملية تلقائيًا…</p></div>}
  </div>;
}

function cartDescriptionFromCustomer(customer: NonNullable<ReturnType<typeof useDokanGame>['game']['currentCustomer']>) { return customer.basket.map((line) => { const product = PRODUCT_CATALOG.find((item) => item.id === line.productId); return `${line.quantity > 1 ? `${line.quantity}× ` : ''}${product?.name ?? line.productId}`; }).join('، '); }
function PriceOption({ id, selected, label, price, note, setSelected }: { id: PriceChoice; selected: PriceChoice; label: string; price: number; note: string; setSelected: (value: PriceChoice) => void }) { return <button className={`price-option ${selected === id ? 'selected' : ''}`} onClick={() => setSelected(id)}><span>{label}</span><strong>{format(price)} ج</strong><small>{note}</small></button>; }
function EmptyCheckout({ phase, onClose }: { phase: string; onClose: () => void }) { return <div className="empty-checkout"><span>{phase === 'results' ? '🌙' : '🧺'}</span><h3>{phase === 'results' ? 'انتهى اليوم' : 'الكاشير جاهز'}</h3><p>{phase === 'playing' ? 'الزبون التالي سيدخل تلقائيًا.' : 'افتح الدكان لاستقبال أول زبون.'}</p>{phase === 'playing' && <button className="danger subtle" onClick={onClose}>إنهاء اليوم مبكرًا</button>}</div>; }

function ProductTile({ product, money, low, onRestock }: { product: Product; money: number; low: boolean; onRestock: (id: string) => void }) {
  const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock); const bill = amount * product.cost;
  return <article className={`product-tile ${low ? 'low-stock' : ''}`}><span>{product.icon}</span><div><strong>{product.name}</strong><small>{product.brand} · {product.stock}/{product.maxStock}</small><i><b style={{ width: `${product.stock / product.maxStock * 100}%` }} /></i></div><button disabled={product.stock >= product.maxStock || money < bill} onClick={() => onRestock(product.id)} aria-label={`توريد ${product.name}`}>+{amount}</button>{low && <em>⚠</em>}</article>;
}

function InventoryModal({ products, money, onRestock, lowIds }: { products: Product[]; money: number; onRestock: (id: string) => void; lowIds: string[] }) { return <div className="inventory-modal">{products.map((product) => { const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock); return <div className="inventory-row" key={product.id}><span>{product.icon}</span><div><strong>{product.name}</strong><small>{product.category} · {product.brand} · جودة {product.quality}/100</small><p>سعر البيع {format(product.price)}ج · التكلفة {format(product.cost)}ج {lowIds.includes(product.id) && <b className="stock-warning">⚠️ مخزون منخفض</b>}</p></div><div className="stock-control"><b>{product.stock}/{product.maxStock}</b><button disabled={product.stock >= product.maxStock || money < amount * product.cost} onClick={() => onRestock(product.id)}>توريد +{amount}</button></div></div>; })}</div>; }

function Settings({ game, updateAudio, updateQuality }: { game: ReturnType<typeof useDokanGame>['game']; updateAudio: (field: 'master' | 'music' | 'sfx' | 'muted', value: number | boolean) => void; updateQuality: (quality: keyof typeof QUALITY_LABELS) => void }) { return <div className="settings-panel"><button className="sound-toggle" onClick={() => updateAudio('muted', !game.audio.muted)}>{game.audio.muted ? '🔇 تفعيل الصوت' : '🔊 كتم الصوت'}</button><Slider label="الصوت العام" value={game.audio.master} onChange={(value) => updateAudio('master', value)} /><Slider label="الموسيقى" value={game.audio.music} onChange={(value) => updateAudio('music', value)} /><Slider label="المؤثرات" value={game.audio.sfx} onChange={(value) => updateAudio('sfx', value)} /><label className="quality-select">جودة الأداء<select value={game.settings.quality} onChange={(event) => updateQuality(event.target.value as keyof typeof QUALITY_LABELS)}>{Object.entries(QUALITY_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><p>الجودة المنخفضة تقلل المؤثرات الحركية لتناسب الأجهزة الأضعف.</p></div>; }
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="range-label">{label}<b>{value}%</b><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Guide() { return <div className="guide"><p><b>1.</b> راقب الطلب والميزانية والصبر قبل الاختيار.</p><p><b>2.</b> السعر الكامل يحقق ربحًا أكبر، لكن الزبون الحساس للسعر أو الفصال قد يرفضه.</p><p><b>3.</b> إن ظهر ⚠️، ورّد المنتج قبل أن يصل الزبون؛ النفاد يخفض السمعة.</p><p><b>4.</b> لا تطِل في القرار: الصبر ينقص تلقائيًا، خاصة مع المستعجل والعصبي.</p><p><b>5.</b> تنتهي Day 1 تلقائيًا بعد 37 زبونًا، أو يمكنك الإغلاق مبكرًا.</p></div>; }

function Results({ game, onRestart }: { game: ReturnType<typeof useDokanGame>['game']; onRestart: () => void }) {
  const net = netProfit(game.metrics); const satisfaction = averageSatisfaction(game); const { best, worst } = bestAndWorstProducts(game);
  return <div className="results-layer"><section className="results-card"><span className="celebration">🎉</span><p className="eyebrow">DAY 1 COMPLETE</p><h2>أحسنت يا صاحب الدكان!</h2><p>أغلقت المحل بعد يوم مليان زباين وقرارات.</p><div className="results-grid"><Result label="إجمالي الزبائن" value={game.metrics.totalCustomers} /><Result label="تمت خدمتهم" value={game.metrics.served} /><Result label="إجمالي المبيعات" value={`${format(game.metrics.sales)} ج`} /><Result label="تكلفة المنتجات" value={`${format(game.metrics.costs)} ج`} /><Result label="إجمالي الخصومات" value={`${format(game.metrics.discounts)} ج`} /><Result label="صافي الربح" value={`${format(net)} ج`} positive={net >= 0} /><Result label="رضا العملاء" value={`${satisfaction}%`} /><Result label="سمعة المحل" value={`${game.reputation}%`} /></div><div className="bestsellers"><div><span>{best.icon}</span><p>الأكثر مبيعًا<b>{best.name} · {best.sold} وحدات</b></p></div><div><span>{worst.icon}</span><p>الأقل مبيعًا<b>{worst.name} · {worst.sold} وحدات</b></p></div></div><div className="stars">{satisfaction >= 75 ? '⭐⭐⭐⭐' : satisfaction >= 50 ? '⭐⭐⭐' : '⭐⭐'}</div><p className="result-note">{satisfaction >= 75 ? 'يوم ممتاز! زباين الحارة هيفتكروا معاملتك.' : 'بداية جيدة — المخزون والسرعة أهم شيء بكرة.'}</p><button className="primary large" onClick={onRestart}>إعادة لعب اليوم الأول</button></section></div>;
}

function Result({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) { return <div><span>{label}</span><b className={positive ? 'positive' : ''}>{value}</b></div>; }
function Stat({ icon, label, value, tone }: { icon: string; label: string; value: string; tone?: 'good' | 'bad' }) { return <div className={`stat ${tone ?? ''}`}><span>{icon}</span><p>{label}<b>{value}</b></p></div>; }
function Objective({ done, text, value }: { done: boolean; text: string; value: string }) { return <div className={done ? 'objective done' : 'objective'}><span>{done ? '✓' : '○'}</span><p>{text}<b>{value}</b></p></div>; }
function Meter({ icon, label, value, danger }: { icon: string; label: string; value: number; danger?: boolean }) { return <div className={`meter ${danger ? 'danger-meter' : ''}`}><div><span>{icon} {label}</span><b>{Math.round(value)}%</b></div><i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i></div>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="modal-layer" onMouseDown={close}><section className="modal" onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button onClick={close} aria-label="إغلاق">×</button></header>{children}</section></div>; }
