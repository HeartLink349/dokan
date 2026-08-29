'use client';
import { useMemo, useState, useRef, useEffect } from 'react';

type Product = { id: string; name: string; icon: string; price: number; cost: number; stock: number; color: string };
type Customer = { id: string; name: string; icon: string; need: string; budget: number; patience: number; kind: string; text: string; mood: 'good'|'neutral'|'bad' };

const PRODUCTS: Product[] = [
  { id:'water', name:'مياه معدنية', icon:'💧', price:20, cost:10, stock:20, color:'#5da9d6' },
  { id:'biscuit', name:'بسكويت', icon:'🍪', price:15, cost:8, stock:15, color:'#c58b45' },
  { id:'chips', name:'شيبسي', icon:'🥔', price:20, cost:12, stock:15, color:'#d7a43b' },
  { id:'juice', name:'عصير', icon:'🧃', price:18, cost:9, stock:15, color:'#e7a24b' },
  { id:'chocolate', name:'شوكولاتة', icon:'🍫', price:25, cost:14, stock:15, color:'#7e4d36' },
  { id:'cigs', name:'سجائر', icon:'🚬', price:30, cost:20, stock:10, color:'#b75a43' },
  { id:'tissue', name:'مناديل', icon:'🧻', price:12, cost:7, stock:10, color:'#b6d8e8' },
  { id:'toy', name:'لعب أطفال', icon:'🍭', price:10, cost:5, stock:10, color:'#d95d7c' },
];

const CUSTOMERS: Customer[] = [
  { id:'yousef', name:'يوسف', icon:'🧒', need:'chips', budget:20, patience:85, kind:'طفل', text:'عندي 15… عايز شيبسي.', mood:'good' },
  { id:'mahmoud', name:'محمود', icon:'🧔', need:'biscuit', budget:25, patience:65, kind:'فصال', text:'معايا 25، ممكن تخفض شوية؟', mood:'neutral' },
  { id:'uncle', name:'عم سيد', icon:'👴', need:'water', budget:20, patience:80, kind:'حساب', text:'تسجلي على الحساب يا ابني؟', mood:'neutral' },
  { id:'mona', name:'منى', icon:'👩‍🦱', need:'chocolate', budget:30, patience:75, kind:'عادية', text:'عندي 30، ممكن شوكولاتة وعصير؟', mood:'good' },
  { id:'angry', name:'أحمد', icon:'🧑', need:'juice', budget:18, patience:35, kind:'مستعجل', text:'مش عاجبني السعر!', mood:'bad' },
];

const INITIAL_NOTES = ['بداية اليوم الأول: تم فتح المحل.', 'رأس المال الابتدائي: 1,000 جنيه.', 'الهدف: حقق ربحًا لا يقل عن 250 جنيه.', 'الهدف: لا تنخفض السمعة عن 40.', 'الهدف: جهّز 8 منتجات.'];

export default function Home() {
  const [products, setProducts] = useState(PRODUCTS);
  const [money, setMoney] = useState(1000);
  const [reputation, setReputation] = useState(50);
  const [sales, setSales] = useState(0);
  const [costSold, setCostSold] = useState(0);
  const [served, setServed] = useState(0);
  const [customerIndex, setCustomerIndex] = useState(-1);
  const [price, setPrice] = useState(20);
  const [dialog, setDialog] = useState('');
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [event, setEvent] = useState('قد يحدث حدث في أي وقت مثل انقطاع كهرباء أو تفتيش مفاجئ.');
  const [electricity, setElectricity] = useState(false);
  const [dayEnded, setDayEnded] = useState(false);
  const [intro, setIntro] = useState(true);
  const [panel, setPanel] = useState<'none'|'inventory'|'notebook'|'stats'|'menu'>('none');
  const stateRef = useRef({ sales:0, costSold:0, reputation:50, served:0 });
  useEffect(()=>{ stateRef.current={sales,costSold,reputation,served}; },[sales,costSold,reputation,served]);

  const customer = customerIndex >= 0 ? CUSTOMERS[customerIndex] : null;
  const product = customer ? products.find(p => p.id === customer.need) ?? null : null;
  const profit = sales - costSold;
  const time = dayEnded ? '10:30 م' : customerIndex < 0 ? '08:00 ص' : `08:${Math.min(55, Math.max(0, customerIndex * 12)).toString().padStart(2,'0')} ص`;
  const totalStock = useMemo(() => products.reduce((n,p)=>n+p.stock,0), [products]);
  const goals = [
    { text:'حقق ربحًا لا يقل عن 250', ok: profit >= 250 },
    { text:'لا تنخفض السمعة عن 40', ok: reputation >= 40 },
    { text:'جهّز 8 منتجات', ok: totalStock >= 8 },
  ];

  function addNote(text:string){ setNotes(n => [...n, text]); }

  function startNextCustomer(){
    if (dayEnded) return;
    const next = customerIndex + 1;
    if (next >= CUSTOMERS.length) { finishDay(); return; }
    const c = CUSTOMERS[next];
    const p = products.find(x=>x.id===c.need);
    setCustomerIndex(next);
    setPrice(p?.price ?? 20);
    setDialog(c.text);
  }

  function sell(){
    if (!customer || !product || dayEnded) return;
    const p = Math.round(price);
    if (!Number.isFinite(p) || p <= 0) { setDialog('اكتب سعرًا صحيحًا أولًا.'); return; }
    if (p < product.cost) { setDialog(`مينفعش تبيع ${product.name} بأقل من تكلفة الشراء (${product.cost} جنيه).`); return; }
    if (product.stock <= 0) { setDialog('المنتج خلص. اختار منتجًا آخر.'); return; }

    const fair = product.price;
    const overBudget = p > customer.budget;
    const tooExpensive = p > fair + Math.ceil(fair * .2);
    if (overBudget || tooExpensive) {
      setDialog(customer.mood === 'bad' ? 'مش عاجبني السعر! مش هشتري.' : 'السعر عالي شوية… حاول تنزل السعر.');
      setReputation(r=>Math.max(0, r-1));
      addNote(`${customer.name} رفض السعر ${p} جنيه.`);
      setCustomerIndex(i=>i); return;
    }

    setProducts(ps=>ps.map(x=>x.id===product.id ? {...x, stock:x.stock-1} : x));
    setMoney(m=>m+p);
    setSales(s=>s+p);
    setCostSold(c=>c+product.cost);
    setServed(s=>s+1);
    const rep = p <= fair ? 1 : 0;
    setReputation(r=>Math.min(100, Math.max(0,r+rep)));
    setDialog(p < fair ? `تمام، كده كسبت ثقة الزبون. ${p} جنيه.` : 'اتفقنا. شكرًا يا معلم!');
    addNote(`${customer.name} اشترى ${product.name} بسعر ${p} جنيه.`);
    window.setTimeout(()=>{
      if (customerIndex >= CUSTOMERS.length - 1) finishDay();
      else startNextCustomer();
    }, 550);
  }

  function negotiate(){
    if (!customer || !product) return;
    const fair = product.price;
    setPrice(Math.max(product.cost, fair - (customer.kind === 'فصال' ? 2 : 0)));
    setDialog('خلينا نوصل لسعر عادل. السعر المقترح اتظبط لك.');
  }

  function reject(){
    if (!customer) return;
    setDialog('تمام، ولا يهمك. الزبون مشي من غير ما يشتري.');
    setReputation(r=>Math.max(0,r-1));
    addNote(`${customer.name} تم رفض عملية بيعه.`);
    window.setTimeout(startNextCustomer, 450);
  }

  function triggerEvent(){
    if (dayEnded) return;
    if (electricity) return;
    setElectricity(true);
    setEvent('انقطاع كهرباء! الثلاجة متوقفة مؤقتًا.');
    addNote('⚡ حدث اليوم: انقطاع كهرباء لمدة دقيقة.');
    setDialog('⚡ الكهرباء قطعت! حاول تكمّل بهدوء.');
    window.setTimeout(()=>{setElectricity(false);setEvent('الكهرباء رجعت والمحل يعمل بشكل طبيعي.');addNote('💡 الكهرباء رجعت.');}, 4500);
  }

  function finishDay(){
    setDayEnded(true); setCustomerIndex(-1); setDialog('');
    const s = stateRef.current;
    addNote(`انتهى اليوم: المبيعات ${s.sales} جنيه، التكلفة ${s.costSold} جنيه، الربح ${s.sales-s.costSold} جنيه.`);
    addNote(`تم التعامل مع ${s.served} زبائن. السمعة: ${s.reputation}/100.`);
  }

  function reset(){ location.reload(); }

  return <main className="game-shell" dir="rtl">
    {intro && <div className="overlay"><div className="intro-card">
      <div className="intro-icon">🏪</div><h1>dokan</h1><h2>اليوم الأول</h2>
      <p>كل حاجة كبيرة بدأت بحاجة صغيرة.</p><div className="intro-money">💰 رأس المال: 1,000 جنيه</div>
      <button onClick={()=>{setIntro(false);window.setTimeout(startNextCustomer,500)}}>افتح المحل</button>
    </div></div>}

    <header className="topbar">
      <div className="brand"><strong>اليوم الأول</strong><span>📅</span></div>
      <div className="top-stats">
        <Stat title="الوقت" value={time} icon="🕐" />
        <Stat title="رأس المال" value={`${money.toLocaleString()} ج`} icon="💵" />
        <Stat title="الربح" value={`${profit.toLocaleString()} ج`} icon="💵" />
        <Stat title="السمعة" value={`${reputation}`} icon={reputation>=50?'🙂':'😐'} />
      </div>
      <div className="top-actions"><button onClick={()=>setPanel('notebook')}>📋<span>المذكرة</span></button><button onClick={()=>setPanel('menu')}>⚙️<span>الإعدادات</span></button><button onClick={()=>setPanel('menu')}>☰<span>القائمة</span></button></div>
    </header>

    <div className="layout">
      <aside className="side left">
        <section className="panel goals"><h2>أهداف اليوم</h2>{goals.map((g,i)=><div className="goal" key={i}><b>{g.ok?'✓':'✓'}</b><span>{g.text}</span><em>⭐</em></div>)}</section>
        <section className="panel inventory"><h2>المتجر <small>📦</small></h2><h3>المنتجات ({products.length}/8)</h3>{products.map(p=><div className="product-row" key={p.id}><span className="picon">{p.icon}</span><div><b>{p.name}</b><small>تكلفة: {p.cost} 🪙</small></div><div className="pnums"><strong>{p.stock}</strong><span>سعر {p.price} 🪙</span></div></div>)}<button className="stock-btn" onClick={()=>setPanel('inventory')}>📦 تجهيز البضائع</button></section>
      </aside>

      <section className="center">
        <div className="shop-scene">
          <div className="shop-wall"><div className="lamp">💡</div><div className="fan">🌀</div><div className="shelf-art shelf1">{products.slice(0,4).map(p=><span key={p.id}>{p.icon}</span>)}</div><div className="shelf-art shelf2">{products.slice(4).map(p=><span key={p.id}>{p.icon}</span>)}</div><div className="fridge-art">🧊<small>الثلاجة</small></div><div className="radio">📻</div><div className="window-art">🌳<br/>🏠</div></div>
          <div className="counter-art"><div className="register">🖥️<b>الكاشير</b></div><div className="counter-sign">أمانة ورزق<br/>بالكسب الحلال</div></div>
          <div className="cashier-person">🧑‍💼</div>
          {CUSTOMERS.map((c,i)=><div className={`scene-customer c${i} ${customerIndex===i?'active':''}`} key={c.id}><div className="scene-bubble">{customerIndex===i ? dialog || c.text : c.text}</div><div className="avatar">{c.icon}</div><span className={`mood ${c.mood}`}>{c.mood==='good'?'🙂':c.mood==='bad'?'😡':'😐'}</span></div>)}
          {!customer && !dayEnded && <button className="door-start" onClick={startNextCustomer}>🚪 استقبال الزبون</button>}
          {dayEnded && <div className="closed"><div>🌙</div><h2>نهاية اليوم</h2><p>انتهى اليوم الأول.</p><button onClick={()=>setPanel('notebook')}>📒 افتح مذكرة اليوم</button></div>}
        </div>

        <div className="bottom-panels">
          <section className="panel memo"><h2>مذكرة اليوم 📝</h2><div>المبيعات: <b>{sales}</b> 🪙</div><div>التكلفة: <b>{costSold}</b> 🪙</div><div>الربح: <b>{profit}</b> 🪙</div><div>عدد الزبائن: <b>{served}</b></div><div>السمعة: <b>{reputation}</b> ⭐</div><div>الأحداث: <b>{event.includes('انقطاع')?'حدث نشط':'لا يوجد'}</b></div></section>
          <section className="panel log"><h2>سجل الأحداث 📜</h2><div className="timeline"><p><b>08:00</b> بداية اليوم الأول. تم فتح المحل.</p><p><b>08:00</b> وصل أول زبون.</p><p><b>--:--</b> {notes[notes.length-1] || 'لم يحدث أي أحداث بعد.'}</p></div></section>
          <section className="panel random"><h2>حدث عشوائي 🎲</h2><p>{event}</p><button onClick={triggerEvent} disabled={electricity}>إحداث حدث الآن ⚡</button></section>
          <section className="panel end"><h2>نهاية اليوم 🌙</h2><p>سينتهي اليوم عند<br/><b>10:30 مساءً</b></p><button disabled={!dayEnded} onClick={finishDay}>{dayEnded?'اليوم انتهى':'إنهاء اليوم الآن'} 🔒</button></section>
        </div>
        <div className="tip">⭐ نصيحة: حافظ على سمعتك عالية، فاوض بذكاء، ولا تبيع بخسارة!</div>
      </section>

      <aside className="side right">
        <section className="panel event-card"><h2>حدث اليوم</h2><div className="event-icon">⚡</div><b>{event.includes('انقطاع')?'انقطاع كهرباء':'المحل يعمل طبيعيًا'}</b><small>قد يحدث في أي وقت</small></section>
        <section className="panel current"><h2>الزبون الحالي</h2>{customer ? <><div className="current-person"><span>{customer.icon}</span><div><b>{customer.name}</b><small>{customer.kind}</small></div></div><p>الميزانية: {customer.budget} 🪙</p><p>الصبر: {customer.patience} ⏳</p><p>المعرفة بالأسعار: {customer.kind==='فصال'?'عالية':'متوسطة'} 🧠</p><p>الموقف: تفاوض 🤝</p><hr/><div className="need">يريد: {product?.name} {product?.icon}<br/>سعره الأقصى: {customer.budget} 🪙</div><div className="sell-box"><label>سعر البيع الحالي</label><div className="price-input"><input value={price} type="number" onChange={e=>setPrice(Number(e.target.value))}/><span>ج</span></div></div><button className="green" onClick={sell}>💵 بيع بالسعر الحالي ({price})</button><button className="blue" onClick={negotiate}>🤝 تفاوض على السعر</button><button className="orange" onClick={reject}>🤲 اقتراح منتج آخر</button><button className="dark" onClick={reject}>🚫 رفض البيع</button></> : <div className="empty-current">لا يوجد زبون الآن.<br/>اضغط استقبال الزبون.</div>}</section>
      </aside>
    </div>

    {panel!=='none' && <Modal title={panel==='inventory'?'📦 المخزن':panel==='notebook'?'📒 مذكرة اليوم':panel==='stats'?'📊 الحساب':'⚙️ القائمة'} close={()=>setPanel('none')}>
      {panel==='inventory' && <div className="modal-list">{products.map(p=><div className="modal-product" key={p.id}><span>{p.icon}</span><div><b>{p.name}</b><small>تكلفة {p.cost} ج · سعر مقترح {p.price} ج</small></div><strong>×{p.stock}</strong></div>)}</div>}
      {panel==='notebook' && <div className="paper"><h3>اليوم الأول</h3>{notes.map((n,i)=><p key={i}>• {n}</p>)}<hr/><b>المبيعات: {sales} · الربح: {profit} · السمعة: {reputation}</b>{dayEnded&&<button onClick={reset}>🔄 إعادة اليوم</button>}</div>}
      {panel==='stats' && <div className="report"><div>💰 النقد الحالي <b>{money} جنيه</b></div><div>🛒 إجمالي المبيعات <b>{sales} جنيه</b></div><div>📦 التكلفة <b>{costSold} جنيه</b></div><div>📈 الربح <b>{profit} جنيه</b></div><div>👥 الزبائن <b>{served}</b></div><div>⭐ السمعة <b>{reputation}/100</b></div></div>}
      {panel==='menu' && <div className="menu-actions"><button onClick={()=>setPanel('notebook')}>📋 المذكرة</button><button onClick={()=>setPanel('inventory')}>📦 المخزن</button><button onClick={()=>setPanel('stats')}>📊 الحساب</button><button onClick={reset}>🔄 إعادة اليوم الأول</button></div>}
    </Modal>}
  </main>;
}

function Stat({title,value,icon}:{title:string;value:string;icon:string}){return <div className="stat"><span className="stat-title">{title}</span><div><b>{icon}</b><strong>{value}</strong></div></div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close}>✕</button></div>{children}</div></div>}
