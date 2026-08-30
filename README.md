# دكان الحارة — Full Gameplay Upgrade

لعبة متجر/بقالة مبنية على Next.js + TypeScript، مطورة فوق المشروع الأصلي بدون تغيير التقنية.

## الأنظمة المضافة
- أيام متتالية قابلة للتمديد (Day 1 → 30+).
- زبائن متعددون بخصائص مختلفة وصبر وميزانية وحس سعر واحتمال تفاوض.
- بيع حقيقي مرتبط بالمخزون والمال والتكلفة والربح والسمعة.
- تفاوض واقتراح أسعار ورفض البيع مع تأثير على رضا الزبون.
- اقتصاد يومي وأسعار متغيرة وأحداث تؤثر على الطلب والتكلفة والمخزون.
- مخزون وإعادة تخزين مع خصومات الموردين.
- 12 منتجًا مع فتح تدريجي حسب المستوى.
- 7 تطويرات للمتجر بمستويات وتأثيرات Gameplay.
- Reputation + XP + Levels وفتح محتوى تدريجي.
- أهداف يومية ومكافآت مال/XP/سمعة.
- تقرير نهاية اليوم والانتقال لليوم التالي.
- حفظ تلقائي في localStorage مع Continue / Reset Save.
- أحداث عشوائية: كهرباء، مطر، مورد، ازدحام، نقص سوق، تلف، VIP، تخفيضات.
- Responsive UI للهاتف والتابلت والكمبيوتر.
- Animations خفيفة وإشعارات وتفاعل بصري.
- لوحة مذكرة، مخزون، تطويرات، إحصائيات وأهداف.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:3000`.

## الإنتاج

```bash
npm run build
npm start
```

الحفظ يتم محليًا في المتصفح تحت المفتاح `dokan-full-save-v2`.

## Reference-first layout

The game board now follows the supplied landscape reference: fixed three-column desktop layout, large illustrated shop scene in the center, goals/inventory on the left, event/customer/progression on the right, and the day log panels beneath the scene.

On phones the game is intentionally **landscape-first**. In portrait orientation it shows a rotate-device prompt instead of collapsing the game into a tall dashboard.

The existing Next.js + React + TypeScript architecture is preserved; the reference artwork in `public/store-scene.png` remains the scene layer while gameplay state stays interactive in React.
