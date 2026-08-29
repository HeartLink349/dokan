'use client';
import { useMemo, useState } from 'react';

type Product = {id:string; name:string; icon:string; cost:number; market:number; stock:number; initial:number};
type Customer = {id:string; name:string; emoji:string; need:string; patience:number; bargain:number; knowledge:number; maxPay:number; dialogue:string; kind:string};

const PRODUCTS: Product[] = [
 {id:'water',name:'مياه',icon:'💧',cost:7,market:10,stock:12,initial:12},
 {id:'soda',name:'مشروب غازي',icon:'🥤',cost:10,market:13,stock:8,initial:8},
 {id:'juice',name:'عصير',icon:'🧃',cost:8,market:11,stock:7,initial:7},
 {id:'chips',name:'شيبسي',icon:'🍟',cost:7,market:10,stock:10,initial:10},
 {id:'biscuit',name:'بسكويت',icon:'🍪',cost:6,market:9,stock:8,initial:8},
 {id:'chocolate',name:'شوكولاتة',icon:'🍫',cost:10,market:14,stock:6,initial:6},
 {id:'gum',name:'لبان',icon:'🍬',cost:3,market:5,stock:12,initial:12},
 {id:'tissue',name:'مناديل',icon:'🧻',cost:8,market:11,stock:5,initial:5},
];
const CUSTOMERS: Customer[] = [
 {id:'mohamed',name:'عم محمد',emoji:'🧔',need:'water',patience:55,bargain:70,knowledge:65,maxPay:12,dialogue:'صباح الخير يا معلم، عايز إزازة مية.',kind:'فصال'},
 {id:'ahmed',name:'أحمد',emoji:'🧑',need:'chips',patience:70,bargain:35,knowledge:80,maxPay:10,dialogue:'عندك شيبسي؟',kind:'فاهم في الأسعار'},
 {id:'weird',name:'الراجل الغريب',emoji:'🤪',need:'chocolate',patience:80,bargain:5,knowledge:20,maxPay:20,dialogue:'معاك شوكولاتة؟',kind:'غريب'},
 {id:'hassan',name:'حسن',emoji:'👨‍🔧',need:'soda',patience:45,bargain:55,knowledge:55,maxPay:14,dialogue:'هاتلي مشروب غازي، واكتبلي كمان لو ينفع.',kind:'دين'},
 {id:'nada',name:'مدام نادية',emoji:'👩',need:'juice',patience:60,bargain:65,knowledge:75,maxPay:12,dialogue:'العصير بكام يا ابني؟',kind:'مقارنة'},
 {id:'sayed',name:'عم سيد',emoji:'👴',need:'gum',patience:85,bargain:25,knowledge:50,maxPay:6,dialogue:'هاتلي لبان يا ابني.',kind:'هادئ'},
 {id:'khaled',name:'خالد',emoji:'👨‍💼',need:'water',patience:30,bargain:20,knowledge:90,maxPay:10,dialogue:'مية بسرعة لو سمحت.',kind:'مستعجل'},
 {id:'fatma',name:'فاطمة',emoji:'👩‍🦱',need:'tissue',patience:65,bargain:45,knowledge:60,maxPay:12,dialogue:'عايزة مناديل.',kind:'عادي'},
 {id:'karim',name:'كريم',emoji:'🧒',need:'soda',patience:70,bargain:10,knowledge:30,maxPay:15,dialogue:'عايز حاجة ساقعة.',kind:'طفل'},
 {id:'ali',name:'علي',emoji:'🧑‍🦰',need:'biscuit',patience:50,bargain:60,knowledge:65,maxPay:10,dialogue:'البسكويت ده بكام؟',kind:'فصال'},
 {id:'samir',name:'سمير',emoji:'👨‍🦲',need:'chips',patience:75,bargain:45,knowledge:55,maxPay:12,dialogue:'هات شيبسي كده.',kind:'عادي'},
];

const initialNotebook = ['فتحت المحل لأول مرة.','رأس المال: 1,000 جنيه.'];

export default function Home(){
 const [products,setProducts]=useState(PRODUCTS);
 const [money,setMoney]=useState(1000);
 const [reputation,setReputation]=useState(50);
 const [customerIndex,setCustomerIndex]=useState(-1);
 const [price,setPrice]=useState(10);
 const [dialog,setDialog]=useState('');
 const [notebook,setNotebook]=useState(initialNotebook);
 const [sales,setSales]=useState(0);
 const [costSold,setCostSold]=useState(0);
 const [served,setServed]=useState(0);
 const [dayEnded,setDayEnded]=useState(false);
 const [electricity,setElectricity]=useState(false);
 const [inventoryOpen,setInventoryOpen]=useState(false);
 const [notebookOpen,setNotebookOpen]=useState(false);
 const [statsOpen,setStatsOpen]=useState(false);
 const [intro,setIntro]=useState(true);
 const customer = customerIndex >= 0 ? CUSTOMERS[customerIndex] : null;
 const product = customer ? products.find(p=>p.id===customer.need)! : null;
 const soldCost = useMemo(()=>costSold,[costSold]);
 const profit = sales-soldCost;
 const time = dayEnded ? '10:30 م' : customerIndex < 0 ? '08:00 ص' : `${9+Math.min(Math.floor(served/2),10)}:${served%2?'30':'00'} ص`;

 function addNote(s:string){setNotebook(n=>[...n,s]);}
 function openCustomer(){
   if(dayEnded) return;
   const next=customerIndex+1;
   if(next>=CUSTOMERS.length){ endDay(); return; }
   const c=CUSTOMERS[next]; const p=products.find(x=>x.id===c.need)!;
   if(p.stock<=0){ setCustomerIndex(next); setDialog('المنتج المطلوب خلص للأسف.'); return; }
   setCustomerIndex(next); setPrice(p.market); setDialog(c.dialogue);
 }
 function finishCustomer(){
   if(!customer || !product || product.stock<=0) return;
   const p=price;
   if(p<product.cost){ setDialog('السعر أقل من تكلفة الشراء. مش هينفع تبيع بالخسارة في النسخة الأولى.'); return; }
   const tooHigh=p>customer.maxPay;
   const bargainHit=p>product.market && p<=customer.maxPay && customer.bargain>=40;
   if(tooHigh){
      setDialog(customer.kind==='غريب' ? '😅 غريبة! أنا موافق... بس المرة الجاية هسأل على السعر الأول.' : 'إيه يا معلم؟ ده غالي أوي! مش هاخدها.');
      setReputation(r=>Math.max(0,r-(p>product.market*1.3?2:1)));
      addNote(`${customer.name} رفض السعر ${p} جنيه.`);
      setServed(s=>s+1); return;
   }
   const accepted=bargainHit || p<=customer.maxPay;
   if(!accepted){ setDialog('لا يا معلم، خلينا في السعر العادل.'); return; }
   const newStock=product.stock-1;
   setProducts(ps=>ps.map(x=>x.id===product.id?{...x,stock:newStock}:x));
   setMoney(m=>m+p); setSales(s=>s+p); setCostSold(c=>c+product.cost); setServed(s=>s+1);
   let repDelta=0;
   if(p<=product.market) repDelta=1; else if(p>product.market*1.25) repDelta=-2; else repDelta=-1;
   if(customer.kind==='غريب' && p>product.market*1.25) repDelta=-1;
   setReputation(r=>Math.max(0,Math.min(100,r+repDelta)));
   setDialog(p>product.market ? `تمام يا معلم. ${p} جنيه.` : 'تسلم يا معلم ❤️');
   addNote(`${customer.name} اشترى ${product.name} بـ ${p} جنيه.`);
   setTimeout(()=>{ if(nextCustomerAvailable()) openCustomer(); },450);
 }
 function nextCustomerAvailable(){return !dayEnded && customerIndex<CUSTOMERS.length-1;}
 function triggerElectricity(){ if(electricity||dayEnded)return; setElectricity(true); addNote('⚡ الكهرباء قطعت لمدة ساعة.'); setDialog('⚡ الكهرباء قطعت! الثلاجة واقفة مؤقتًا.'); setTimeout(()=>{setElectricity(false);addNote('💡 الكهرباء رجعت.');setDialog('💡 الكهرباء رجعت الحمد لله.');},5000); }
 function endDay(){
   setDayEnded(true); setCustomerIndex(-1); setDialog('');
   addNote(`انتهى اليوم. المبيعات: ${sales} جنيه — تكلفة البضاعة المباعة: ${soldCost} جنيه — الربح: ${sales-soldCost} جنيه.`);
   addNote(`الزبائن الذين تم التعامل معهم: ${served}. السمعة: ${reputation}/100.`);
 }
 function reset(){location.reload();}
 return <main className="game-shell">
   {intro && <div className="overlay"><div className="intro-card"><div className="intro-icon">🏪</div><h1>dokan</h1><h2>اليوم الأول</h2><p>كل حاجة كبيرة بدأت بحاجة صغيرة.</p><div className="intro-money">💰 رأس المال: 1,000 جنيه</div><button onClick={()=>{setIntro(false);setTimeout(openCustomer,700)}}>افتح المحل</button></div></div>}
   <header className="topbar"><div><strong>🏪 dokan</strong><span className="muted">اليوم الأول</span></div><div className="stats"><span>📅 اليوم 1</span><span>⏰ {time}</span><span>💰 {money} ج</span><span>⭐ {reputation}</span></div></header>
   <section className="shop">
     <div className="wall-sign">بقالة الحاج ❤️</div>
     <div className="window"><span>🥤 مشروبات</span><span>🛒 أهلاً وسهلاً</span></div>
     <div className="shelf shelf-a">{products.slice(0,4).map(p=><button key={p.id} className="product" onClick={()=>setInventoryOpen(true)} disabled={p.stock===0}><span>{p.icon}</span><b>{p.name}</b><small>{p.stock} قطعة</small></button>)}</div>
     <div className="shelf shelf-b">{products.slice(4).map(p=><button key={p.id} className="product" onClick={()=>setInventoryOpen(true)} disabled={p.stock===0}><span>{p.icon}</span><b>{p.name}</b><small>{p.stock} قطعة</small></button>)}</div>
     <div className="fridge" onClick={()=>setInventoryOpen(true)}><div>🧊</div><b>الثلاجة</b><small>{electricity?'الكهرباء قاطعة':'اضغط للمخزون'}</small></div>
     <div className="counter"><div className="cashier">🧾<b>الكاشير</b><small>{money} جنيه</small></div><div className="notepad-mini">📒</div></div>
     <div className="door" onClick={openCustomer}><div>🚪</div><small>الباب</small></div>
     {customer && product && !dayEnded && <div className="customer"><div className="bubble"><b>{customer.name}</b><p>{dialog||customer.dialogue}</p><div className="price-row"><span>{product.name} — السعر العادل {product.market} ج</span><input type="number" min={product.cost} value={price} onChange={e=>setPrice(Number(e.target.value)||0)}/><button onClick={finishCustomer}>بيع</button></div></div><div className="person">{customer.emoji}</div></div>}
     {!customer && !dayEnded && <div className="hint">👆 اضغط على الباب لاستقبال أول زبون</div>}
     {dayEnded && <div className="closed"><div>🌙</div><h2>المحل قفل</h2><p>انتهى اليوم الأول.</p><button onClick={()=>setNotebookOpen(true)}>📒 افتح النوتة</button></div>}
   </section>
   <nav className="bottom-nav"><button onClick={()=>setNotebookOpen(true)}>📒<span>النوتة</span></button><button onClick={()=>setInventoryOpen(true)}>📦<span>المخزن</span></button><button onClick={()=>setStatsOpen(true)}>📊<span>الحساب</span></button><button onClick={triggerElectricity} disabled={electricity||dayEnded}>⚡<span>حدث</span></button></nav>
   {inventoryOpen && <Modal title="📦 المخزن" close={()=>setInventoryOpen(false)}><div className="inventory-grid">{products.map(p=><div className="inv" key={p.id}><span>{p.icon}</span><b>{p.name}</b><small>شراء {p.cost} ج · بيع مقترح {p.market} ج</small><strong>× {p.stock}</strong></div>)}</div></Modal>}
   {statsOpen && <Modal title="📊 حساب المحل" close={()=>setStatsOpen(false)}><div className="report"><div>💰 النقد الحالي <b>{money} جنيه</b></div><div>🛒 إجمالي المبيعات <b>{sales} جنيه</b></div><div>📦 تكلفة البضاعة المباعة <b>{costSold} جنيه</b></div><div>📈 الربح الحالي <b>{profit} جنيه</b></div><div>👥 الزبائن <b>{served}</b></div><div>⭐ السمعة <b>{reputation}/100</b></div></div></Modal>}
   {notebookOpen && <Modal title="📒 النوتة" close={()=>setNotebookOpen(false)}><div className="notebook"><div className="paper"><h3>اليوم الأول</h3><p>السبت — أول يوم في المحل</p>{notebook.map((n,i)=><p key={i}>• {n}</p>)}<hr/><div className="summary">المبيعات: {sales} ج · الربح: {profit} ج · الزبائن: {served} · السمعة: {reputation}</div>{dayEnded&&<button onClick={reset}>🔄 جرّب اليوم الأول من جديد</button>}</div></div></Modal>}
 </main>
}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close}>✕</button></div>{children}</div></div>}
