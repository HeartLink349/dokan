'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Product = {
  id: string; name: string; icon: string; cost: number; basePrice: number; stock: number;
  maxStock: number; demand: number; unlockLevel: number; category: string;
};
type CustomerKind = 'طالب'|'موظف'|'أم'|'رجل كبير'|'غني'|'مستعجل'|'بخيل'|'فصال'|'غاضب'|'دائم'|'VIP';
type Customer = { id:string; name:string; icon:string; kind:CustomerKind; need:string; budget:number; patience:number; priceSense:number; negotiation:number; baseMood:number; text:string };
type UpgradeId = 'fridge'|'shelves'|'cashier'|'storage'|'lighting'|'shop'|'service';
type Upgrade = { id:UpgradeId; name:string; icon:string; level:number; max:number; baseCost:number; description:string };
type Goal = { id:string; text:string; target:number; progress:number; reward:number; xp:number; done:boolean };
type EventState = { id:string; name:string; icon:string; description:string; effect:string; until:number };
type SaveData = {
  day:number; money:number; reputation:number; xp:number; level:number; products:Product[]; upgrades:Upgrade[];
  totalSales:number; totalProfit:number; totalCustomers:number; bestDayProfit:number; sound:boolean;
};

const STORAGE_KEY = 'dokan-full-save-v2';

const PRODUCT_SEED: Product[] = [
  {id:'water',name:'مياه معدنية',icon:'💧',cost:10,basePrice:20,stock:20,maxStock:20,demand:1.1,unlockLevel:1,category:'أساسيات'},
  {id:'biscuit',name:'بسكويت',icon:'🍪',cost:8,basePrice:15,stock:15,maxStock:15,demand:1.0,unlockLevel:1,category:'سناكس'},
  {id:'chips',name:'شيبسي',icon:'🥔',cost:12,basePrice:20,stock:15,maxStock:15,demand:1.2,unlockLevel:1,category:'سناكس'},
  {id:'juice',name:'عصير',icon:'🧃',cost:9,basePrice:18,stock:15,maxStock:15,demand:1.15,unlockLevel:1,category:'مشروبات'},
  {id:'chocolate',name:'شوكولاتة',icon:'🍫',cost:14,basePrice:25,stock:12,maxStock:15,demand:.9,unlockLevel:1,category:'حلويات'},
  {id:'cigs',name:'سجائر',icon:'🚬',cost:20,basePrice:30,stock:8,maxStock:10,demand:.8,unlockLevel:3,category:'مقيدة'},
  {id:'tissue',name:'مناديل',icon:'🧻',cost:7,basePrice:12,stock:10,maxStock:15,demand:.85,unlockLevel:2,category:'منزلية'},
  {id:'toy',name:'لعبة أطفال',icon:'🪀',cost:5,basePrice:10,stock:10,maxStock:15,demand:.75,unlockLevel:2,category:'أطفال'},
  {id:'coffee',name:'قهوة',icon:'☕',cost:11,basePrice:22,stock:0,maxStock:15,demand:1.0,unlockLevel:4,category:'مشروبات'},
  {id:'milk',name:'حليب',icon:'🥛',cost:13,basePrice:24,stock:0,maxStock:15,demand:1.25,unlockLevel:5,category:'أساسيات'},
  {id:'cereal',name:'حبوب إفطار',icon:'🥣',cost:18,basePrice:32,stock:0,maxStock:12,demand:.95,unlockLevel:6,category:'أساسيات'},
  {id:'soap',name:'صابون',icon:'🧼',cost:9,basePrice:19,stock:0,maxStock:15,demand:.9,unlockLevel:7,category:'منزلية'},
];

const CUSTOMER_SEED: Customer[] = [
  {id:'yousef',name:'يوسف',icon:'🧒',kind:'طالب',need:'chips',budget:23,patience:82,priceSense:1.1,negotiation:.35,baseMood:76,text:'عايز شيبسي بسرعة قبل الدرس.'},
  {id:'mahmoud',name:'محمود',icon:'🧔',kind:'فصال',need:'biscuit',budget:22,patience:65,priceSense:1.25,negotiation:.9,baseMood:60,text:'معايا ميزانية محدودة… نعملها 13؟'},
  {id:'said',name:'عم سيد',icon:'👴',kind:'رجل كبير',need:'water',budget:25,patience:88,priceSense:.95,negotiation:.25,baseMood:72,text:'المهم الجودة يا ابني، والسعر يكون معقول.'},
  {id:'mona',name:'منى',icon:'👩🏻',kind:'أم',need:'chocolate',budget:34,patience:72,priceSense:1.05,negotiation:.35,baseMood:80,text:'عايزة حاجة حلوة للولاد.'},
  {id:'ahmed',name:'أحمد',icon:'🧑🏻',kind:'مستعجل',need:'juice',budget:20,patience:30,priceSense:1.0,negotiation:.45,baseMood:48,text:'مش عاجبني السعر، خلصني بسرعة.'},
  {id:'nour',name:'نور',icon:'👩🏻‍🦱',kind:'موظف',need:'coffee',budget:28,patience:55,priceSense:1.1,negotiation:.5,baseMood:66,text:'القهوة أهم حاجة عندي النهارده.'},
  {id:'hassan',name:'حسن',icon:'🧔🏻',kind:'بخيل',need:'tissue',budget:15,patience:75,priceSense:1.35,negotiation:.75,baseMood:55,text:'أرخص سعر عندك كام؟'},
  {id:'vip',name:'الأستاذ كريم',icon:'🕴️',kind:'VIP',need:'chocolate',budget:70,patience:92,priceSense:.8,negotiation:.2,baseMood:90,text:'سمعت إن المحل عنده تعامل محترم.'},
  {id:'permanent',name:'عميل دائم',icon:'🙂',kind:'دائم',need:'water',budget:30,patience:80,priceSense:.9,negotiation:.2,baseMood:84,text:'أنا متعود أشتري منك كل يوم.'},
  {id:'angry',name:'وليد',icon:'😠',kind:'غاضب',need:'chips',budget:25,patience:22,priceSense:1.2,negotiation:.6,baseMood:35,text:'لو السعر غالي هروح للمحل اللي جنبك.'},
];

const UPGRADE_SEED: Upgrade[] = [
  {id:'fridge',name:'الثلاجة',icon:'🧊',level:1,max:5,baseCost:180,description:'تزيد سعة المشروبات وتقلل خسائر انقطاع الكهرباء.'},
  {id:'shelves',name:'الرفوف',icon:'🗄️',level:1,max:5,baseCost:160,description:'تزيد سعة التخزين وتفتح منتجات جديدة.'},
  {id:'cashier',name:'الكاشير',icon:'🧾',level:1,max:5,baseCost:220,description:'تزيد سرعة الخدمة وفرصة إتمام المفاوضات.'},
  {id:'storage',name:'المخزن',icon:'📦',level:1,max:5,baseCost:200,description:'يرفع الحد الأقصى لكل المنتجات.'},
  {id:'lighting',name:'الإضاءة',icon:'💡',level:1,max:4,baseCost:140,description:'تحسن رضا الزبائن وتقلل أثر الأيام المزدحمة.'},
  {id:'shop',name:'شكل المتجر',icon:'🏪',level:1,max:5,baseCost:300,description:'يزيد السمعة وفرصة ظهور الزبائن المميزين.'},
  {id:'service',name:'سرعة الخدمة',icon:'⚡',level:1,max:5,baseCost:250,description:'تزيد الصبر الفعلي وتقلل فرص ترك الزبون.'},
];

const EVENTS = [
  {id:'power',name:'انقطاع كهرباء',icon:'⚡',description:'الثلاجة تتوقف مؤقتًا. بعض الزبائن يفقدون صبرهم.',effect:'patience-10'},
  {id:'rain',name:'مطر مفاجئ',icon:'🌧️',description:'يزيد الطلب على المشروبات الساخنة والمناديل.',effect:'demand-up'},
  {id:'supplier',name:'خصم من المورد',icon:'🚚',description:'تكلفة إعادة التخزين أقل خلال هذا الحدث.',effect:'restock-discount'},
  {id:'rush',name:'ازدحام مفاجئ',icon:'👥',description:'يصل زبائن أكثر، لكن الضغط أعلى.',effect:'more-customers'},
  {id:'shortage',name:'نقص في السوق',icon:'📈',description:'أسعار بعض المنتجات ترتفع مؤقتًا.',effect:'price-up'},
  {id:'spoiled',name:'تلف بعض المنتجات',icon:'🥀',description:'فقدت وحدات من منتج عشوائي بسبب التخزين.',effect:'stock-loss'},
  {id:'vip',name:'زبون VIP',icon:'💎',description:'زبون غني وصل بسبب سمعة المحل.',effect:'vip'},
  {id:'discount',name:'تخفيضات السوق',icon:'🏷️',description:'تكلفة الشراء منخفضة اليوم.',effect:'cost-down'},
];

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}
function priceFor(p:Product, day:number, event?:EventState|null){
  let factor = 1 + Math.sin(day*1.7 + p.id.length)*.07;
  if(event?.id==='shortage' && ['water','juice','milk','chips'].includes(p.id)) factor += .15;
  return Math.max(p.cost+1, Math.round(p.basePrice*factor));
}
function levelForXp(xp:number){let level=1; let need=100; let left=xp; while(left>=need && level<30){left-=need; level++; need=Math.round(need*1.18);} return level;}
function xpForLevel(level:number){let total=0,need=100; for(let i=1;i<level;i++){total+=need;need=Math.round(need*1.18);} return total;}

export default function Home(){
  const [hydrated,setHydrated]=useState(false);
  const [day,setDay]=useState(1);
  const [money,setMoney]=useState(1000);
  const [reputation,setReputation]=useState(50);
  const [xp,setXp]=useState(0);
  const [level,setLevel]=useState(1);
  const [products,setProducts]=useState<Product[]>(PRODUCT_SEED);
  const [upgrades,setUpgrades]=useState<Upgrade[]>(UPGRADE_SEED);
  const [sales,setSales]=useState(0);
  const [costs,setCosts]=useState(0);
  const [served,setServed]=useState(0);
  const [missed,setMissed]=useState(0);
  const [profit,setProfit]=useState(0);
  const [notes,setNotes]=useState<string[]>(['بداية اليوم الأول: افتح المحل وابدأ بناء سمعتك.']);
  const [customer,setCustomer]=useState<Customer|null>(null);
  const [customerQueue,setCustomerQueue]=useState<Customer[]>([]);
  const [price,setPrice]=useState(20);
  const [dialog,setDialog]=useState('');
  const [event,setEvent]=useState<EventState|null>(null);
  const [goals,setGoals]=useState<Goal[]>([]);
  const [dayEnded,setDayEnded]=useState(false);
  const [intro,setIntro]=useState(true);
  const [panel,setPanel]=useState<'none'|'inventory'|'upgrades'|'notebook'|'stats'|'menu'|'goals'>('none');
  const [sound,setSound]=useState(true);
  const [toast,setToast]=useState('');
  const [showNewDay,setShowNewDay]=useState(false);
  const [busy,setBusy]=useState(false);
  const stateRef=useRef({sales,costs,served,profit,reputation});

  useEffect(()=>{stateRef.current={sales,costs,served,profit,reputation};},[sales,costs,served,profit,reputation]);

  const visibleProducts=useMemo(()=>products.filter(p=>p.unlockLevel<=level),[products,level]);
  const currentProduct=customer ? products.find(p=>p.id===customer.need) ?? null : null;
  const totalStock=useMemo(()=>visibleProducts.reduce((n,p)=>n+p.stock,0),[visibleProducts]);
  const dayExpense=useMemo(()=>Math.max(0, 35 + day*5 - upgrades.find(u=>u.id==='shop')!.level*3),[day,upgrades]);
  const xpProgress=xp-xpForLevel(level);
  const xpNeed=(level<30?xpForLevel(level+1)-xpForLevel(level):1);
  const dayTargetCustomers=clamp(5+Math.floor(day*.65)+(event?.id==='rush'?2:0),5,16);
  const timeLabel=dayEnded?'10:30 م':customer?`08:${Math.min(59,10+served*4).toString().padStart(2,'0')} ص`:'08:00 ص';

  const saveData=useCallback(():SaveData=>({day,money,reputation,xp,level,products,upgrades,totalSales:sales,totalProfit:profit,totalCustomers:served,bestDayProfit:profit,sound}),[day,money,reputation,xp,level,products,upgrades,sales,profit,served,sound]);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){const s:SaveData=JSON.parse(raw);setDay(s.day);setMoney(s.money);setReputation(s.reputation);setXp(s.xp);setLevel(s.level);setProducts(s.products?.length?s.products:PRODUCT_SEED);setUpgrades(s.upgrades?.length?s.upgrades:UPGRADE_SEED);setSound(s.sound!==false);setIntro(false);}
    }catch{}
    setHydrated(true);
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem(STORAGE_KEY,JSON.stringify(saveData()));},[hydrated,saveData]);

  const notify=useCallback((text:string)=>{setToast(text);window.setTimeout(()=>setToast(''),2200);},[]);
  const addNote=useCallback((text:string)=>setNotes(n=>[...n.slice(-11),text]),[]);

  const makeGoals=useCallback((d:number):Goal[]=>[
    {id:'sales',text:`بع ${Math.min(12,5+Math.floor(d/2))} منتجات`,target:Math.min(12,5+Math.floor(d/2)),progress:0,reward:70+d*6,xp:35+d*2,done:false},
    {id:'profit',text:`حقق ربحًا قدره ${Math.min(500,180+d*18)} جنيه`,target:Math.min(500,180+d*18),progress:0,reward:90+d*8,xp:45+d*2,done:false},
    {id:'rep',text:'حافظ على السمعة فوق 45',target:45,progress:50,reward:60+d*5,xp:30+d,done:false},
    {id:'stock',text:'احتفظ بمخزون أساسي لا يقل عن 8',target:8,progress:8,reward:50+d*4,xp:25+d,done:false},
  ],[]);

  useEffect(()=>{if(!goals.length)setGoals(makeGoals(day));},[day,goals.length,makeGoals]);

  function unlockByLevel(nextLevel:number){
    setProducts(ps=>ps.map(p=>p.unlockLevel<=nextLevel && p.stock===0 && PRODUCT_SEED.find(x=>x.id===p.id)?.stock===0 ? {...p,stock:Math.min(5,p.maxStock)}:p));
  }
  function awardXp(amount:number){
    setXp(old=>{const next=old+amount; const newLevel=levelForXp(next); if(newLevel>level){setLevel(newLevel);unlockByLevel(newLevel);notify(`🎉 وصلت للمستوى ${newLevel}! منتجات ومزايا جديدة فتحت.`);addNote(`⭐ ارتفع مستواك إلى ${newLevel}.`);} return next;});
  }
  function syncGoals(){
    setGoals(gs=>gs.map(g=>{let progress=g.progress; if(g.id==='sales')progress=served; if(g.id==='profit')progress=profit; if(g.id==='rep')progress=reputation; if(g.id==='stock')progress=totalStock; const done=progress>=g.target; if(done&&!g.done){setMoney(m=>m+g.reward);awardXp(g.xp);setReputation(r=>clamp(r+2,0,100));notify(`🎯 تم تحقيق الهدف: ${g.text} +${g.reward}ج`);addNote(`🎯 اكتمل هدف: ${g.text}`);} return {...g,progress,done};}));
  }
  useEffect(()=>{if(hydrated&&!dayEnded)syncGoals();},[served,profit,reputation,totalStock,hydrated,dayEnded]);

  function startDay(startDayNumber=day){
    setIntro(false);setDayEnded(false);setCustomer(null);setCustomerQueue([]);setSales(0);setCosts(0);setProfit(0);setServed(0);setMissed(0);setNotes([`بدأ اليوم ${startDayNumber}. الإيجار والمصاريف اليومية المتوقعة: ${Math.max(0,35+startDayNumber*5-upgrades.find(u=>u.id==='shop')!.level*3)} جنيه.`]);setEvent(null);setGoals(makeGoals(startDayNumber));setShowNewDay(false);setDialog('');
    const unlocked=products.filter(p=>p.unlockLevel<=level);
    const queue=buildQueue(startDayNumber,unlocked,clamp(5+Math.floor(startDayNumber*.65)+(event?.id==='rush'?2:0),5,16),reputation);
    setCustomerQueue(queue);setTimeout(()=>nextFromQueue(queue),350);
  }
  function buildQueue(d:number, unlocked:Product[], count:number, rep:number){
    const pool=CUSTOMER_SEED.filter(c=>unlocked.some(p=>p.id===c.need)&& (c.kind!=='VIP'||rep>=65||d>=10));
    const arr:Customer[]=[]; for(let i=0;i<count;i++){const base=pool[(i*3+d)%pool.length]; const c={...base,id:`${base.id}-${d}-${i}`,budget:Math.round(base.budget*(1+d*.025+(Math.random()-.5)*.12)),patience:clamp(base.patience+d*.5,15,98),baseMood:clamp(base.baseMood+rep*.08+(Math.random()*8-4),15,98)}; arr.push(c);} return arr;
  }
  function nextFromQueue(queue=customerQueue){
    if(dayEnded||busy)return;
    if(!queue.length){finishDay();return;}
    const [next,...rest]=queue;setCustomerQueue(rest);setCustomer(next);const p=products.find(x=>x.id===next.need);setPrice(p?priceFor(p,day,event):20);setDialog(next.text);
  }
  function finishDay(){
    if(dayEnded)return; setDayEnded(true);setCustomer(null);setBusy(false);const s=stateRef.current;const net=s.profit-dayExpense;setMoney(m=>Math.max(0,m-dayExpense));setProfit(net);setDayEnded(true);addNote(`🌙 نهاية اليوم: مبيعات ${s.sales}ج، تكلفة ${s.costs}ج، ربح تشغيلي ${net}ج.`);setShowNewDay(true);notify('🌙 انتهى يوم العمل. راجع التقرير.');
  }
  function applyEvent(){
    if(dayEnded||event)return;
    const choices=EVENTS.filter(e=>e.id!=='vip'||reputation>=60||day>=7);const e=choices[Math.floor(Math.random()*choices.length)];
    setEvent({...e,until:Date.now()+6500});addNote(`${e.icon} حدث: ${e.name} — ${e.description}`);notify(`${e.icon} ${e.name}`);
    if(e.id==='spoiled'){const eligible=products.filter(p=>p.unlockLevel<=level&&p.stock>0);if(eligible.length){const target=eligible[Math.floor(Math.random()*eligible.length)];setProducts(ps=>ps.map(p=>p.id===target.id?{...p,stock:Math.max(0,p.stock-2)}:p));}}
    if(e.id==='power')setDialog('⚡ الكهرباء قطعت! الزبون مستعجل، حاول ما تتأخرش.');
    window.setTimeout(()=>setEvent(null),6500);
  }
  function sell(){
    if(!customer||!currentProduct||busy||dayEnded)return;
    const selling=Math.round(price); const fair=priceFor(currentProduct,day,event); const effectiveBudget=Math.round(customer.budget*(event?.id==='rain'?1.03:1));
    if(currentProduct.stock<=0){setDialog('المنتج خلص من الرف. اعرض بديلًا أو جهّز بضاعة.');setReputation(r=>clamp(r-2,0,100));setMissed(m=>m+1);return;}
    if(selling<currentProduct.cost){setDialog(`لا يمكن البيع بأقل من تكلفة الشراء (${currentProduct.cost}ج).`);return;}
    const tolerance=fair*(0.13+customer.priceSense*.05)+(upgrades.find(u=>u.id==='cashier')!.level*0.8);
    const tooHigh=selling>effectiveBudget||selling>fair+tolerance;
    const tooLow=selling<fair*.72;
    if(tooHigh){setDialog(customer.kind==='غاضب'?'السعر ده مبالغ فيه! أنا ماشي.':'السعر عالي شوية… ممكن تعمل سعر أحسن؟');setReputation(r=>clamp(r-1,0,100));setMissed(m=>m+1);setCustomer(c=>c?{...c,patience:Math.max(0,c.patience-14)}:c);addNote(`❌ ${customer.name} رفض السعر ${selling}ج.`);if(customer.patience<25||selling>effectiveBudget*1.12){setBusy(true);setTimeout(()=>{setBusy(false);nextFromQueue();},650);}return;}
    const satisfaction=clamp(Math.round(customer.baseMood + (fair-selling)*1.8 - (selling>fair?12:0) + (event?.id==='power'?-8:0)),0,100);
    const saleProfit=selling-currentProduct.cost;setBusy(true);setProducts(ps=>ps.map(p=>p.id===currentProduct.id?{...p,stock:p.stock-1}:p));setMoney(m=>m+selling);setSales(s=>s+selling);setCosts(c=>c+currentProduct.cost);setProfit(p=>p+saleProfit);setServed(s=>s+1);
    const repDelta=satisfaction>=80?2:satisfaction>=60?1:satisfaction<45?-2:0;setReputation(r=>clamp(r+repDelta,0,100));awardXp(12+Math.max(0,saleProfit));
    setDialog(tooLow?'صفقة ممتازة! الزبون مبسوط، بس هامش الربح قليل.':satisfaction>=80?'ممتاز! الزبون خرج مبسوط جدًا.':'اتفقنا، شكرًا لزيارتك.');addNote(`🛒 ${customer.name} اشترى ${currentProduct.name} بـ${selling}ج — رضا ${satisfaction}%.`);notify(`+${selling}ج • +${Math.max(0,saleProfit)}ج ربح`);
    setTimeout(()=>{setBusy(false);nextFromQueue();},700);
  }
  function negotiate(){
    if(!customer||!currentProduct||busy)return; const fair=priceFor(currentProduct,day,event); const offer=Math.max(currentProduct.cost+1,Math.round(fair*(customer.kind==='فصال'?.84:customer.kind==='بخيل'?.78:.9)));setPrice(offer);setDialog(`الزبون يقترح ${offer} جنيه. تقدر تقبل، أو تزود السعر يدويًا.`);addNote(`🤝 تفاوض مع ${customer.name}: العرض ${offer}ج.`);
  }
  function proposeHigher(){
    if(!customer||!currentProduct)return; const fair=priceFor(currentProduct,day,event);const next=clamp(Math.round(price+2),currentProduct.cost+1,Math.round(fair*1.2));setPrice(next);setDialog(next<=customer.budget?'ممكن نمشي على السعر ده؟':'ده أعلى من ميزانيتي…');
  }
  function reject(){if(!customer||busy)return;setBusy(true);setReputation(r=>clamp(r-1,0,100));setMissed(m=>m+1);addNote(`🚫 تم رفض ${customer.name} وغادر بدون شراء.`);setDialog('تمام، ولا يهمك. الزبون مشي.');setTimeout(()=>{setBusy(false);nextFromQueue();},500);}
  function restock(){
    if(dayEnded)return;
    const storage=upgrades.find(u=>u.id==='storage')!.level;
    const capacity=10+storage*3;
    const discount=event?.id==='supplier'?.82:event?.id==='discount'?.9:1;
    const plan=products.filter(p=>p.unlockLevel<=level).map(p=>{
      const add=Math.min(capacity,p.maxStock+storage*2-p.stock);
      return {id:p.id,add,cost:Math.round(p.cost*add*discount)};
    }).filter(x=>x.add>0);
    const total=plan.reduce((sum,x)=>sum+x.cost,0);
    if(total>money){notify(`💸 تحتاج ${total}ج لتجهيز البضاعة، ومعك ${money}ج فقط.`);return;}
    setProducts(ps=>ps.map(p=>{const item=plan.find(x=>x.id===p.id);return item?{...p,stock:p.stock+item.add,maxStock:p.maxStock+storage}:p;}));
    setMoney(m=>m-total);setCosts(c=>c+total);addNote(`📦 تم تجهيز البضاعة بتكلفة ${total}ج.`);notify(`📦 تجهيز البضاعة: -${total}ج`);
  }
  function buyUpgrade(id:UpgradeId){
    const u=upgrades.find(x=>x.id===id);if(!u||u.level>=u.max)return;const cost=u.baseCost*u.level;if(money<cost){notify('💸 رأس المال لا يكفي.');return;}setMoney(m=>m-cost);setUpgrades(us=>us.map(x=>x.id===id?{...x,level:x.level+1}:x));if(id==='storage'||id==='shelves'){setProducts(ps=>ps.map(p=>({...p,maxStock:p.maxStock+2,stock:p.unlockLevel<=level&&p.stock===0?p.maxStock+2:p.stock})));}setReputation(r=>id==='shop'?clamp(r+3,0,100):r);awardXp(35);addNote(`🔧 تطوير ${u.name} إلى المستوى ${u.level+1}. تكلفة ${cost}ج.`);notify(`🔧 ${u.name} Lv.${u.level+1}`);
  }
  function newDay(){
    const s=stateRef.current;const bonus=Math.max(0,Math.round(s.profit*.08));const nextDay=day+1;setDay(nextDay);setMoney(m=>m+bonus);setNotes(n=>[...n,`🌅 مكافأة الاستمرارية: ${bonus}ج.`]);setShowNewDay(false);setDayEnded(false);setCustomer(null);setEvent(null);setSales(0);setCosts(0);setProfit(0);setServed(0);setMissed(0);setTimeout(()=>startDay(nextDay),50);
  }
  function resetSave(){if(!confirm('هل أنت متأكد؟ سيتم حذف كل تقدم اللعبة نهائيًا.'))return;localStorage.removeItem(STORAGE_KEY);location.reload();}

  const mood=customer?clamp(Math.round(customer.baseMood+(reputation-50)*.25-(customer.patience<35?12:0)),0,100):0;
  const goalsView=goals.map(g=>({...g,progress:g.id==='sales'?served:g.id==='profit'?profit:g.id==='rep'?reputation:totalStock,done:g.id==='sales'?served>=g.target:g.id==='profit'?profit>=g.target:g.id==='rep'?reputation>=g.target:totalStock>=g.target}));

  return <main className="game" dir="rtl">
    <div className="portrait-warning" aria-hidden="true"><div><span>📱↔️</span><b>لف الموبايل بالعرض</b><small>اللعبة مصممة أفقيًا عشان تشوف المتجر والزبائن وكل لوحات اللعب معًا.</small></div></div>
    {intro && <div className="overlay"><div className="intro-card"><div className="intro-logo">🏪</div><div className="eyebrow">DOKAN • MARKET SIM</div><h1>دكان الحارة</h1><h2>اليوم {day}</h2><p>ابدأ من محل صغير وابنِ سلسلة ناجحة خلال 30 يومًا وأكثر.</p><div className="intro-grid"><span>💰 رأس المال <b>{money.toLocaleString()}ج</b></span><span>⭐ السمعة <b>{reputation}</b></span><span>🎯 أهداف اليوم <b>{goals.length||4}</b></span><span>🧠 المستوى <b>{level}</b></span></div><button className="primary big" onClick={startDay}>افتح المحل وابدأ اليوم</button><small>يتم الحفظ تلقائيًا على جهازك.</small></div></div>}

    <header className="topbar">
      <div className="brand-card"><div className="brand-icon">📅</div><div><span>دكان الحارة</span><strong>اليوم {day}</strong></div></div>
      <div className="stats-row"><Stat title="الوقت" value={timeLabel} icon="🕐"/><Stat title="رأس المال" value={`${money.toLocaleString()} ج`} icon="💵"/><Stat title="ربح اليوم" value={`${profit.toLocaleString()} ج`} icon="📈"/><Stat title="السمعة" value={`${reputation}/100`} icon={reputation>=70?'😄':reputation>=45?'🙂':'😟'}/><Stat title="المستوى" value={`Lv.${level}`} icon="⭐"/></div>
      <div className="top-actions"><button onClick={()=>setPanel('notebook')}>📋<span>المذكرة</span></button><button onClick={()=>setPanel('upgrades')}>🔧<span>التطوير</span></button><button onClick={()=>setPanel('menu')}>☰<span>القائمة</span></button></div>
    </header>

    <div className="main-grid">
      <aside className="left-column">
        <section className="panel goals-panel"><PanelTitle icon="🎯" title="أهداف اليوم"/><div className="goal-list">{goalsView.map(g=><div className={`goal ${g.done?'done':''}`} key={g.id}><b>{g.done?'✓':'○'}</b><span>{g.text}<small>{Math.min(g.progress,g.target)} / {g.target}</small></span><em>⭐</em></div>)}</div></section>
        <section className="panel inventory-panel"><PanelTitle icon="📦" title="المتجر" badge={`${visibleProducts.length}/${PRODUCT_SEED.length}`}/><div className="inventory-list">{visibleProducts.map(p=><div className="product-row" key={p.id}><span className="product-icon">{p.icon}</span><div className="product-info"><b>{p.name}</b><small>{p.category} • تكلفة {p.cost}ج</small></div><div className="product-num"><strong>{p.stock}</strong><small>سعر {priceFor(p,day,event)}ج</small></div></div>)}</div><button className="wide secondary" onClick={()=>setPanel('inventory')}>📦 إدارة المخزون</button><button className="wide gold" onClick={restock} disabled={dayEnded}>🚚 تجهيز البضائع</button></section>
      </aside>

      <section className="center-column">
        <div className="scene scene-reference">
          <img className="scene-reference-image" src="/store-scene.png" alt="مشهد دكان الحارة" draggable={false}/>
          <div className="scene-vignette" aria-hidden="true" />
          {customer && <div className="scene-dialog"><span>{dialog||customer.text}</span><b>{customer.name} • {customer.kind}</b></div>}
          {!customer&&!dayEnded&&<button className="welcome-btn scene-welcome" onClick={()=>nextFromQueue()}>🚪 استقبال الزبون التالي</button>}
          {dayEnded&&<div className="closed-sign scene-closed"><span>🌙</span><b>المحل مغلق</b><small>راجع تقرير اليوم للمتابعة</small></div>}
          {event&&<div className="event-badge"><span>{event.icon}</span><div><b>{event.name}</b><small>{event.description}</small></div></div>}
        </div>
        <div className="bottom-grid">
          <section className="panel day-note"><PanelTitle icon="📝" title="مذكرة اليوم"/><div className="metric-list"><div><span>المبيعات</span><b>{sales}ج</b></div><div><span>التكلفة</span><b>{costs}ج</b></div><div><span>الربح</span><b className={profit>=0?'positive':'negative'}>{profit}ج</b></div><div><span>الزبائن</span><b>{served}</b></div><div><span>رفضوا</span><b>{missed}</b></div><div><span>XP</span><b>{xpProgress}/{xpNeed}</b></div></div></section>
          <section className="panel event-log"><PanelTitle icon="📜" title="سجل الأحداث"/><div className="log-list">{notes.slice(-6).reverse().map((n,i)=><p key={i}><span>{i===0?'الآن':`0${Math.max(8,9-i)}:${String(i*7).padStart(2,'0')}`}</span>{n}</p>)}</div></section>
          <section className="panel random-panel"><PanelTitle icon="🎲" title="حدث عشوائي"/><div className="random-content"><div className="random-icon">{event?.icon||'🎲'}</div><b>{event?.name||'لا يوجد حدث نشط'}</b><p>{event?.description||'الأحداث تغيّر الاقتصاد والزبائن والمخزون، وتمنح كل يوم مفاجآت جديدة.'}</p><button className="gold wide" onClick={applyEvent} disabled={!!event||dayEnded}>⚡ إحداث حدث الآن</button></div></section>
          <section className="panel end-panel"><PanelTitle icon="🌙" title="نهاية اليوم"/><div className="end-content"><div className="moon">🌙</div><p>وقت الإغلاق<br/><b>10:30 مساءً</b></p>{dayEnded?<button className="primary wide" onClick={()=>setShowNewDay(true)}>📊 فتح تقرير اليوم</button>:<button className="danger wide" onClick={finishDay}>إنهاء اليوم مبكرًا</button>}</div></section>
        </div>
        <div className="tip-bar">💡 <b>نصيحة:</b> السعر المنخفض يرفع الرضا، لكن السعر الذكي يحافظ على الربح. طوّر الكاشير لزيادة فرص نجاح التفاوض.</div>
      </section>

      <aside className="right-column">
        <section className="panel today-event"><PanelTitle icon={event?.icon||'⚡'} title="حدث اليوم"/><div className="big-event-icon">{event?.icon||'🌤️'}</div><b>{event?.name||'المحل يعمل طبيعيًا'}</b><small>{event?.description||'يمكنك إطلاق حدث عشوائي يدويًا.'}</small></section>
        <section className="panel customer-panel"><PanelTitle icon="👤" title="الزبون الحالي"/>{customer&&currentProduct?<div className="customer-card"><div className="customer-head"><span>{customer.icon}</span><div><h3>{customer.name}</h3><label>{customer.kind}</label></div></div><div className="customer-stats"><span>💰 الميزانية <b>{customer.budget}</b></span><span>⏳ الصبر <b>{customer.patience}</b></span><span>🧠 حس السعر <b>{customer.priceSense>1.15?'عالية':customer.priceSense<.9?'منخفضة':'متوسطة'}</b></span><span>🤝 تفاوض <b>{Math.round(customer.negotiation*100)}%</b></span></div><div className="need-card"><span>يريد</span><b>{currentProduct.icon} {currentProduct.name}</b><small>السعر المقترح اليوم: {priceFor(currentProduct,day,event)}ج</small></div><label className="field-label">سعر البيع</label><div className="price-control"><input type="number" min={currentProduct.cost+1} value={price} onChange={e=>setPrice(Number(e.target.value))}/><span>ج</span></div><div className="button-stack"><button className="primary" onClick={sell} disabled={busy}>💵 بيع بالسعر الحالي</button><button className="blue" onClick={negotiate} disabled={busy}>🤝 تفاوض</button><button className="orange" onClick={proposeHigher} disabled={busy}>↗️ اقترح سعرًا آخر</button><button className="secondary" onClick={reject} disabled={busy}>🚫 رفض البيع</button></div></div>:<div className="empty-card"><div>🛒</div><b>لا يوجد زبون أمام الكاشير</b><p>ابدأ استقبال الزبائن أو جهّز البضاعة لرفع فرص البيع.</p><button className="primary wide" onClick={()=>nextFromQueue()} disabled={dayEnded}>استقبال الزبون التالي</button></div>}</section>
        <section className="panel progression"><PanelTitle icon="⭐" title="تقدم اللاعب"/><div className="level-line"><b>Lv.{level}</b><span>XP {xpProgress}/{xpNeed}</span></div><div className="xp-bar"><i style={{width:`${Math.min(100,xpProgress/xpNeed*100)}%`}}/></div><div className="progress-items"><span>🔓 المنتجات: {visibleProducts.length}</span><span>🔧 تطويرات: {upgrades.filter(u=>u.level>1).length}/{upgrades.length}</span><span>📅 اليوم: {day}/30+</span></div></section>
      </aside>
    </div>

    {toast&&<div className="toast">{toast}</div>}
    {showNewDay&&<div className="overlay"><div className="report-card"><div className="report-icon">🌙</div><h2>نهاية اليوم {day}</h2><p>أحسنت! هذه نتيجة يومك قبل الانتقال لليوم التالي.</p><div className="report-grid"><div>المبيعات <b>{sales}ج</b></div><div>التكلفة <b>{costs}ج</b></div><div>الربح <b>{profit}ج</b></div><div>الزبائن <b>{served}</b></div><div>السمعة <b>{reputation}/100</b></div><div>XP المكتسب <b>{Math.max(0,xp-xpForLevel(level))}</b></div></div><div className="report-goals">{goalsView.map(g=><span className={g.done?'ok':'bad'} key={g.id}>{g.done?'✓':'✕'} {g.text}</span>)}</div><button className="primary big" onClick={newDay}>🌅 ابدأ اليوم {day+1}</button><button className="link-button" onClick={()=>setShowNewDay(false)}>إغلاق التقرير</button></div></div>}

    {panel!=='none'&&<Modal title={panel==='inventory'?'📦 إدارة المخزون':panel==='upgrades'?'🔧 تطوير المتجر':panel==='notebook'?'📒 المذكرة':panel==='stats'?'📊 الإحصائيات':panel==='goals'?'🎯 أهداف اليوم':'☰ القائمة'} close={()=>setPanel('none')}>
      {panel==='inventory'&&<div className="modal-list">{products.map(p=><div className={`modal-product ${p.unlockLevel>level?'locked':''}`} key={p.id}><span>{p.unlockLevel>level?'🔒':p.icon}</span><div><b>{p.name}</b><small>{p.unlockLevel>level?`يفتح في المستوى ${p.unlockLevel}`:`تكلفة ${p.cost}ج • سعر اليوم ${priceFor(p,day,event)}ج • حد ${p.maxStock}`}</small></div><strong>{p.unlockLevel>level?'—':`×${p.stock}`}</strong></div>)}<button className="primary wide" onClick={restock}>🚚 إعادة تخزين كل المنتجات المفتوحة</button></div>}
      {panel==='upgrades'&&<div className="upgrade-grid">{upgrades.map(u=>{const cost=u.baseCost*u.level;return <div className="upgrade-card" key={u.id}><div className="upgrade-top"><span>{u.icon}</span><div><b>{u.name}</b><small>المستوى {u.level}/{u.max}</small></div></div><p>{u.description}</p><div className="level-pips">{Array.from({length:u.max}).map((_,i)=><i className={i<u.level?'on':''} key={i}/>)}</div><button className="primary wide" disabled={u.level>=u.max||money<cost} onClick={()=>buyUpgrade(u.id)}>{u.level>=u.max?'MAX':`تطوير مقابل ${cost}ج`}</button></div>})}</div>}
      {panel==='notebook'&&<div className="paper"><h3>دكان الحارة — اليوم {day}</h3>{notes.map((n,i)=><p key={i}>• {n}</p>)}<hr/><b>السمعة الحالية: {reputation}/100</b><br/><b>المستوى: {level} • XP: {xp}</b></div>}
      {panel==='stats'&&<div className="report-list"><div>💰 النقد الحالي <b>{money}ج</b></div><div>🛒 مبيعات اليوم <b>{sales}ج</b></div><div>📈 ربح اليوم <b>{profit}ج</b></div><div>👥 زبائن تم خدمتهم <b>{served}</b></div><div>🚫 زبائن غادروا <b>{missed}</b></div><div>⭐ السمعة <b>{reputation}/100</b></div><div>🧠 المستوى <b>{level}</b></div><div>📅 التقدم <b>اليوم {day}</b></div></div>}
      {panel==='goals'&&<div className="goals-modal">{goalsView.map(g=><div className="goal-big" key={g.id}><span>{g.done?'🏆':'🎯'}</span><div><b>{g.text}</b><small>{Math.min(g.progress,g.target)} / {g.target}</small><div className="mini-bar"><i style={{width:`${Math.min(100,g.progress/g.target*100)}%`}}/></div></div><strong>+{g.reward}ج<br/>+{g.xp}XP</strong></div>)}</div>}
      {panel==='menu'&&<div className="menu-grid"><button onClick={()=>setPanel('notebook')}>📋 المذكرة</button><button onClick={()=>setPanel('inventory')}>📦 المخزون</button><button onClick={()=>setPanel('upgrades')}>🔧 التطوير</button><button onClick={()=>setPanel('stats')}>📊 الإحصائيات</button><button onClick={()=>setPanel('goals')}>🎯 الأهداف</button><button onClick={()=>setSound(s=>!s)}>🔊 الصوت: {sound?'ON':'OFF'}</button><button className="danger" onClick={resetSave}>🗑️ حذف الحفظ وبدء جديد</button></div>}
    </Modal>}
  </main>;
}

function Stat({title,value,icon}:{title:string;value:string;icon:string}){return <div className="stat"><span>{title}</span><div><b>{icon}</b><strong>{value}</strong></div></div>}
function PanelTitle({title,icon,badge}:{title:string;icon:string;badge?:string}){return <div className="panel-title"><h2>{icon} {title}</h2>{badge&&<span>{badge}</span>}</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close}>✕</button></div>{children}</div></div>}
