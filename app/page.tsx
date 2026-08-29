'use client';
import { useState } from 'react';

export default function GamePage() {
  return (
    <div className="game-shell">
      {/* --- الشريط العلوي --- */}
      <header className="topbar">
        <div className="brand-box">
          <div className="brand-icon">📅</div>
          <div className="brand-text">
            <h2>اليوم الأول</h2>
          </div>
        </div>

        <div className="top-stats">
          <StatBox title="الوقت" value="08:00" subtitle="صباحاً" icon="🕒" />
          <StatBox title="رأس المال" value="1,000" icon="💵" />
          <StatBox title="الربح" value="0" icon="💸" />
          <StatBox title="السمعة" value="50" icon="⭐" mood="🙂" />
        </div>

        <div className="top-actions">
          <button><span className="icon">📋</span>المذكرة</button>
          <button><span className="icon">⚙️</span>الإعدادات</button>
          <button><span className="icon">🎛️</span>القائمة</button>
        </div>
      </header>

      <main className="layout-main">
        {/* --- الشريط الجانبي الأيسر: المتجر --- */}
        <aside className="sidebar-left">
          <div className="panel goals-panel">
            <h3>أهداف اليوم</h3>
            <ul>
              <li><span className="check">✅</span> حقق ربحا لا يقل عن 250 <span className="star">⭐</span></li>
              <li><span className="check">✅</span> لا تنخفض السمعة عن 40 <span className="star">⭐</span></li>
              <li><span className="check">✅</span> جهز 8 منتجات <span className="star">⭐</span></li>
            </ul>
          </div>

          <div className="panel store-panel">
            <div className="panel-header">
              <h3>المتجر</h3>
              <span>📦</span>
            </div>
            <div className="products-count">(8/8) المنتجات</div>
            
            <div className="products-list">
              <ProductItem name="مياه" icon="💧" cost="10" price="20" />
              <ProductItem name="بسكويت" icon="🍪" cost="8" price="15" />
              <ProductItem name="شيبسي" icon="🥔" cost="12" price="20" />
              <ProductItem name="عصير" icon="🧃" cost="9" price="18" />
              <ProductItem name="شوكولاتة" icon="🍫" cost="14" price="25" />
              <ProductItem name="سجائر" icon="🚬" cost="20" price="30" />
              <ProductItem name="مناديل" icon="🧻" cost="7" price="17" />
              <ProductItem name="ألعاب أطفال" icon="🍭" cost="5" price="10" />
            </div>

            <button className="prepare-btn">تجهيز البضائع 📦</button>
          </div>
        </aside>

        {/* --- منطقة اللعب المركزية --- */}
        <section className="center-stage">
          <div className="shop-background">
            <div className="shop-owner">
              <span className="character">🧑‍💼</span>
            </div>
            <div className="customers-queue">
              <Customer bubble="عندي 15 عايز شيبسي" icon="👦" mood="🙂" />
              <Customer bubble="معايا 25.. ممكن تخفض شوية؟" icon="🧔" mood="😐" />
              <Customer bubble="تسجللي على الحساب يا ابني؟" icon="👴" mood="😐" />
              <Customer bubble="عندي 30.. ممكن شوكولاتة وعصير" icon="🧕" mood="🙂" />
              <Customer bubble="مش عاجبني السعر!" icon="👦🏻" mood="😡" />
            </div>
          </div>
        </section>

        {/* --- الشريط الجانبي الأيمن: الزبون والأحداث --- */}
        <aside className="sidebar-right">
          <div className="panel event-panel">
            <div className="event-icon">⚡</div>
            <div>
              <h4 className="text-warning">حدث اليوم</h4>
              <h3>انقطاع كهرباء</h3>
              <p>قد يحدث في أي وقت</p>
            </div>
          </div>

          <div className="panel customer-panel">
            <h3 className="panel-title">الزبون الحالي</h3>
            <div className="customer-card">
              <div className="customer-avatar">🧔🏻</div>
              <div className="customer-info">
                <h2>كريم</h2>
                <span className="badge">طالب</span>
              </div>
            </div>

            <div className="customer-stats">
              <div>💵 الميزانية: 25</div>
              <div>⏳ الصبر: متوسط</div>
              <div>🧠 المعرفة بالأسعار: عالية</div>
              <div>🤝 الموقف: تفاوض</div>
            </div>

            <div className="customer-request">
              <div>يريد: <strong>شيبسي 🥔</strong></div>
              <div>سعره الأقصى: <strong>22</strong></div>
            </div>

            <div className="action-buttons">
              <button className="btn-buy">بيع بالسعر الحالي (20) 💲</button>
              <button className="btn-negotiate">تفاوض على السعر 🤝</button>
              <button className="btn-suggest">اقتراح منتج آخر 📦</button>
              <button className="btn-refuse">رفض البيع ❌</button>
            </div>
          </div>
        </aside>
      </main>

      {/* --- الشريط السفلي --- */}
      <footer className="bottom-panels">
        <div className="panel notebook-panel">
          <h3>مذكرة اليوم 📝</h3>
          <div className="notes-content">
            <div>💰 المبيعات: 0</div>
            <div>📦 التكلفة: 0</div>
            <div>📈 الربح: 0</div>
            <div>👥 عدد الزبائن: 0</div>
            <div>⭐ السمعة: 30</div>
            <div>🕒 الأحداث: لا يوجد</div>
          </div>
        </div>

        <div className="panel log-panel">
          <h3>سجل الأحداث 📜</h3>
          <div className="timeline">
            <div className="timeline-item">
              <span className="time">08:00</span>
              <span className="text">بداية اليوم الأول. تم فتح المحل.</span>
            </div>
            <div className="timeline-item">
              <span className="time">08:00</span>
              <span className="text">وصل أول زبون.</span>
            </div>
            <div className="timeline-item disabled">
              <span className="time">--:--</span>
              <span className="text">لم يحدث أي أحداث بعد</span>
            </div>
          </div>
        </div>

        <div className="panel random-event-panel">
          <h3>حدث عشوائي 🎲</h3>
          <p>قد يحدث حدث في أي وقت مثل انقطاع كهرباء تفتيش مفاجئ سقوط أمطار...</p>
          <button className="btn-trigger">إحداث حدث الآن ⚡</button>
        </div>

        <div className="panel end-day-panel">
          <h3>نهاية اليوم 🌙</h3>
          <p>سينتهي اليوم عند<br/><strong>10:30 مساءً</strong></p>
          <button className="btn-end" disabled>إنهاء اليوم الآن 🔒</button>
        </div>
      </footer>
    </div>
  );
}

/* مكونات فرعية لتنظيف الكود */
function StatBox({title, value, subtitle, icon, mood}: any) {
  return (
    <div className="stat-box">
      <div className="stat-header">{title}</div>
      <div className="stat-body">
        <span className="stat-icon">{icon}</span>
        <span className="stat-value">{value}</span>
        {mood && <span className="stat-mood">{mood}</span>}
      </div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}

function ProductItem({name, icon, cost, price}: any) {
  return (
    <div className="product-item">
      <span className="p-icon">{icon}</span>
      <div className="p-details">
        <span className="p-name">{name}</span>
        <div className="p-price-meta">
          <span className="p-cost">🪙 {cost} تكلفة</span>
          <span className="p-price">💰 {price} سعر</span>
        </div>
      </div>
    </div>
  );
}

function Customer({bubble, icon, mood}: any) {
  return (
    <div className="customer">
      <div className="bubble">{bubble}</div>
      <div className="avatar">{icon}</div>
      <div className="mood-indicator">{mood}</div>
    </div>
  );
}
