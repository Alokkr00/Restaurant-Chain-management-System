import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Flame, 
  BarChart3, 
  Plus, 
  Trash2, 
  Lock, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Search
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/v1';

export function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'hq'>('pos');
  
  // POS STATE
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('Table 2');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', cat: 'cat_mains', station: 'GRILL', price: '' });

  // KDS STATE
  const [kdsStation, setKdsStation] = useState('GRILL');
  const [kdsTickets, setKdsTickets] = useState<any[]>([]);

  // HQ STATE
  const [hqMetrics, setHqMetrics] = useState<any>({
    totalSales: 146500,
    totalOrders: 240,
    avgFoodCostPct: 30.42,
    outlets: []
  });

  // FETCH MENU
  useEffect(() => {
    fetchMenu();
  }, []);

  // POLL DATA BASED ON ACTIVE TAB
  useEffect(() => {
    if (activeTab === 'kds') {
      fetchKdsTickets();
      const interval = setInterval(fetchKdsTickets, 3000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'hq') {
      fetchHqMetrics();
      const interval = setInterval(fetchHqMetrics, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`);
      const data = await res.json();
      if (data.success) setMenuItems(data.items);
    } catch (e) {}
  };

  const fetchKdsTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/kds/tickets`);
      const data = await res.json();
      if (data.success) setKdsTickets(data.tickets);
    } catch (e) {}
  };

  const fetchHqMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/hq/metrics`);
      const data = await res.json();
      if (data.success) setHqMetrics(data);
    } catch (e) {}
  };

  // ADD TO CART
  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  // UPDATE CART QTY
  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  // DISPATCH ORDER
  const dispatchOrder = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable,
          waiterId: 'Rahul Sharma',
          items: cart.map(i => ({ menuItemId: i.id, itemName: i.name, quantity: i.qty, unitPrice: i.price, station: i.station })),
          subtotal,
          grandTotal: subtotal * 1.05
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🔥 Order #${data.order.orderNumber} sent to Kitchen KDS!`);
        setCart([]);
      }
    } catch (e) {
      alert('Failed to send order.');
    }
  };

  // BUMP KDS ITEM
  const bumpKdsItem = async (itemId: string) => {
    try {
      const res = await fetch(`${API_BASE}/kds/bump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      if (data.success) fetchKdsTickets();
    } catch (e) {}
  };

  // ADD DISH
  const handleAddDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDish.name, cat: newDish.cat, station: newDish.station, price: Number(newDish.price) })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Dish "${newDish.name}" added to menu!`);
        setShowAddDishModal(false);
        setNewDish({ name: '', cat: 'cat_mains', station: 'GRILL', price: '' });
        fetchMenu();
      }
    } catch (e) {}
  };

  // DELETE DISH
  const deleteDish = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchMenu();
    } catch (e) {}
  };

  const filteredMenuItems = menuItems.filter(i => {
    const matchesCat = selectedCategory === 'ALL' || i.cat === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartTax = cartSubtotal * 0.05;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* REACT GLASSMORPHISM NAVBAR */}
      <header className="glass-card" style={{ margin: '12px 16px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}>RCMS REACT SUITE</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enterprise Restaurant Chain OS</p>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            onClick={() => setActiveTab('pos')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: activeTab === 'pos' ? '#38bdf8' : 'transparent', color: activeTab === 'pos' ? '#000' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
            <UtensilsCrossed size={18} /> POS Waiter
          </button>

          <button 
            onClick={() => setActiveTab('kds')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: activeTab === 'kds' ? '#f59e0b' : 'transparent', color: activeTab === 'kds' ? '#000' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Flame size={18} /> Kitchen KDS
          </button>

          <button 
            onClick={() => setActiveTab('hq')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: activeTab === 'hq' ? '#10b981' : 'transparent', color: activeTab === 'hq' ? '#000' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
            <BarChart3 size={18} /> HQ Analytics
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge-status badge-emerald">🟢 Server Connected</span>
        </div>
      </header>

      {/* POS WAITER TAB */}
      {activeTab === 'pos' && (
        <main style={{ flex: 1, padding: '0 16px 16px 16px', display: 'flex', gap: '16px', height: 'calc(100vh - 100px)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* TOOLBAR */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,23,42,0.6)', padding: '8px 16px', borderRadius: '10px', width: '320px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search dish..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.95rem' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-emerald" onClick={() => setShowAddDishModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={18} /> Add Dish
                </button>
              </div>
            </div>

            {/* DISH GRID */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', paddingRight: '4px' }}>
              {filteredMenuItems.map(item => (
                <div key={item.id} className="glass-card" onClick={() => addToCart(item)} style={{ padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '220px' }}>
                  <div>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }} />
                    ) : (
                      <div style={{ height: '110px', background: 'rgba(15,23,42,0.8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>🍽️</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{item.name}</h3>
                      <button onClick={e => deleteDish(e, item.id, item.name)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399' }}>₹{item.price}</span>
                    <button className="btn-cyan" style={{ padding: '6px 12px', borderRadius: '8px' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CART PANEL */}
          <div className="glass-card" style={{ width: '400px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} color="#38bdf8" /> Active Cart
                </h3>
                <span className="badge-status badge-amber">{selectedTable}</span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                    <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>Cart is empty. Select items to add.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} style={{ background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>₹{item.price} × {item.qty}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ width: '32px', height: '32px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>-</button>
                        <span style={{ fontWeight: 800 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ width: '32px', height: '32px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '12px' }}>
                <span>GST (5%)</span>
                <span>₹{cartTax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '16px' }}>
                <span>Grand Total</span>
                <span style={{ color: '#34d399' }}>₹{(cartSubtotal + cartTax).toFixed(2)}</span>
              </div>

              <button className="btn-emerald" onClick={dispatchOrder} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                🔥 Send Order to Kitchen KDS
              </button>
            </div>
          </div>
        </main>
      )}

      {/* KDS TAB */}
      {activeTab === 'kds' && (
        <main style={{ flex: 1, padding: '0 16px 16px 16px' }}>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['GRILL', 'FRY', 'COLD', 'BAR', 'ALL'].map(st => (
                <button key={st} onClick={() => setKdsStation(st)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: kdsStation === st ? '#f59e0b' : '#1e293b', color: kdsStation === st ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  {st} STATION
                </button>
              ))}
            </div>
            <span className="badge-status badge-amber">🟢 Live Polling Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {kdsTickets.map(t => (
              <div key={t.id} className="glass-card" style={{ padding: '20px', borderLeft: '6px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{t.orderNumber}</h3>
                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>{t.table}</p>
                  </div>
                  <span className="badge-status badge-amber">ACTIVE</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {t.items.filter((i: any) => kdsStation === 'ALL' || i.station === kdsStation).map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{item.quantity || item.qty}x {item.itemName || item.name}</span>
                      <button onClick={() => bumpKdsItem(item.id)} style={{ padding: '6px 14px', background: item.kdsStatus === 'COOKING' ? '#10b981' : '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
                        {item.kdsStatus === 'PENDING' ? '▶️ COOK' : '✓ BUMP'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* HQ TAB */}
      {activeTab === 'hq' && (
        <main style={{ flex: 1, padding: '0 16px 16px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Chain Today's Sales</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399', margin: '8px 0' }}>₹{hqMetrics.totalSales?.toFixed(2)}</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{hqMetrics.totalOrders} Orders Processed</p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Chain Avg Food Cost %</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', margin: '8px 0' }}>{hqMetrics.avgFoodCostPct}%</h2>
              <p style={{ color: '#fb7185', fontWeight: 700, fontSize: '0.9rem' }}>⚠️ Target: 28.00% (+2.42% Leakage)</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '16px' }}>📊 Multi-Outlet Live Performance Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Outlet Name</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Orders</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Sales</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(hqMetrics.outlets || []).map((o: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 800 }}>{o.name}</td>
                    <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{o.location}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 700 }}>{o.orders}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 900, color: '#34d399' }}>₹{Number(o.sales).toFixed(2)}</td>
                    <td style={{ padding: '16px 12px' }}><span className="badge-status badge-emerald">Live</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* ADD DISH MODAL */}
      {showAddDishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-card" style={{ width: '400px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '16px' }}>➕ Create New Menu Dish</h2>
            <form onSubmit={handleAddDishSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Dish Name" required value={newDish.name} onChange={e => setNewDish({ ...newDish, name: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
              <input type="number" placeholder="Price in ₹" required value={newDish.price} onChange={e => setNewDish({ ...newDish, price: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddDishModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#475569', color: '#fff', fontWeight: 700 }}>Cancel</button>
                <button type="submit" className="btn-emerald" style={{ flex: 1 }}>Save Dish</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
