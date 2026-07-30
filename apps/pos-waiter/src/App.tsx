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
  Search,
  Printer,
  Grid,
  Volume2,
  Zap,
  PackageCheck,
  RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/v1';
const WS_URL = 'ws://localhost:3001';

export function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'hq'>('pos');
  const [wsConnected, setWsConnected] = useState(false);
  
  // STAFF AUTH PIN STATE
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({ name: 'Rahul Sharma', role: 'ROLE_WAITER' });

  // POS STATE
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('Table 2');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showTableModal, setShowTableModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastOrderReceipt, setLastOrderReceipt] = useState<any>(null);
  const [newDish, setNewDish] = useState({ name: '', cat: 'cat_mains', station: 'GRILL', price: '' });

  // KDS STATE
  const [kdsStation, setKdsStation] = useState('GRILL');
  const [kdsTickets, setKdsTickets] = useState<any[]>([]);

  // HQ, INVENTORY & SYNC QUEUE STATE
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [hqMetrics, setHqMetrics] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    avgFoodCostPct: 0,
    outlets: []
  });

  // TABLE FLOOR GRID
  const tablesList = [
    { id: 'Table 1', status: 'AVAILABLE', seats: 2 },
    { id: 'Table 2', status: 'OCCUPIED', seats: 4 },
    { id: 'Table 3', status: 'AVAILABLE', seats: 4 },
    { id: 'Table 4', status: 'OCCUPIED', seats: 6 },
    { id: 'Table 5', status: 'AVAILABLE', seats: 2 },
    { id: 'Table 6', status: 'AVAILABLE', seats: 4 },
    { id: 'Table 7', status: 'RESERVED', seats: 4 },
    { id: 'Table 8', status: 'AVAILABLE', seats: 8 },
    { id: 'Table 9', status: 'AVAILABLE', seats: 2 },
    { id: 'Table 10', status: 'OCCUPIED', seats: 4 },
    { id: 'Table 11', status: 'AVAILABLE', seats: 4 },
    { id: 'Table 12', status: 'AVAILABLE', seats: 6 },
  ];

  // FETCH INITIAL DATA
  useEffect(() => {
    fetchMenu();
    fetchKdsTickets();
    fetchHqMetrics();
    fetchInventory();
    fetchSyncQueue();
  }, []);

  // WEBSOCKET REAL-TIME STREAMING CONNECTION
  useEffect(() => {
    let ws: WebSocket;

    const connectWs = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected to live Edge Node stream.');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS Packet Received]:', data.type);

          if (data.type === 'ORDER_PLACED') {
            playKdsChime();
            fetchKdsTickets();
            fetchHqMetrics();
            fetchInventory();
            fetchSyncQueue();
          } else if (data.type === 'ITEM_BUMPED') {
            fetchKdsTickets();
            fetchSyncQueue();
          } else if (data.type === 'MENU_UPDATED') {
            fetchMenu();
            fetchSyncQueue();
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // SERVER-SIDE PIN AUTH VERIFICATION
  const handlePinKeyPress = async (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);

      if (newPin.length === 4) {
        try {
          const res = await fetch(`${API_BASE}/auth/pin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: newPin })
          });
          const data = await res.json();
          if (data.success) {
            setCurrentUser(data.user);
            setIsLocked(false);
            setPinInput('');
            setPinError(false);
          } else {
            setPinError(true);
            setTimeout(() => {
              setPinInput('');
              setPinError(false);
            }, 600);
          }
        } catch (e) {
          setPinError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  // WEB AUDIO KDS CHIME
  const playKdsChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

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

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      const data = await res.json();
      if (data.success) setInventoryList(data.inventory);
    } catch (e) {}
  };

  const fetchSyncQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/sync/queue`);
      const data = await res.json();
      if (data.success) setPendingSyncCount(data.count);
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
          waiterId: currentUser.name,
          items: cart.map(i => ({ menuItemId: i.id, itemName: i.name, quantity: i.qty, unitPrice: i.price, station: i.station })),
          subtotal,
          grandTotal: subtotal * 1.05
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastOrderReceipt(data.order);
        setShowReceiptModal(true);
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
      
      {/* STAFF PIN LOCK SCREEN */}
      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,13,22,0.96)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '360px', padding: '32px', textAlign: 'center', border: pinError ? '2px solid #f43f5e' : '1px solid var(--glass-border)' }}>
            <div style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Lock size={32} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Server-Side Staff PIN Auth</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '6px 0 20px 0' }}>Enter PIN: Waiter (1234), Chef (5678), Mgr (9999)</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              {[0, 1, 2, 3].map(idx => (
                <div key={idx} style={{ width: '16px', height: '16px', borderRadius: '50%', background: pinInput.length > idx ? '#38bdf8' : '#334155', transition: 'all 0.2s' }} />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {['1','2','3','4','5','6','7','8','9','C','0','←'].map(key => (
                <button 
                  key={key} 
                  onClick={() => {
                    if (key === 'C') setPinInput('');
                    else if (key === '←') setPinInput(pinInput.slice(0, -1));
                    else handlePinKeyPress(key);
                  }}
                  className="touch-control-btn" style={{ width: '100%', height: '56px', fontSize: '1.4rem' }}>
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REACT GLASSMORPHISM NAVBAR */}
      <header className="glass-card" style={{ margin: '12px 16px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}>RCMS ENTERPRISE SUITE</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.name} ({currentUser.role})</p>
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
          <span className="badge-status badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Vector Queue: {pendingSyncCount} Pending
          </span>
          <span className={`badge-status ${wsConnected ? 'badge-emerald' : 'badge-rose'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} /> {wsConnected ? 'WebSocket Live' : 'WS Reconnecting'}
          </span>
          <button onClick={() => setIsLocked(true)} style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} /> Lock
          </button>
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
                <button onClick={() => setShowTableModal(true)} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Grid size={18} color="#38bdf8" /> {selectedTable}
                </button>

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
                    <button className="touch-control-btn" style={{ background: '#38bdf8', color: '#000' }}>+</button>
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
                        <button onClick={() => updateQty(item.id, -1)} className="touch-control-btn">-</button>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="touch-control-btn">+</button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={playKdsChime} style={{ background: '#334155', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={16} /> Test Chime
              </button>
              <span className="badge-status badge-emerald">⚡ 0ms WebSocket Sync</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {kdsTickets.map(t => (
              <div key={t.id} className="glass-card" style={{ padding: '20px', borderLeft: '6px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{t.orderNumber}</h3>
                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>{t.table}</p>
                  </div>
                  <span className="badge-status badge-emerald">🟢 02m Elapsed</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {t.items.filter((i: any) => kdsStation === 'ALL' || i.station === kdsStation).map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.quantity || item.qty}x {item.itemName || item.name}</span>
                      <button onClick={() => bumpKdsItem(item.id)} className="touch-control-btn" style={{ width: 'auto', padding: '0 16px', background: item.kdsStatus === 'COOKING' ? '#10b981' : '#f59e0b', color: '#000', fontSize: '0.9rem' }}>
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

      {/* HQ & LIVE INVENTORY TAB */}
      {activeTab === 'hq' && (
        <main style={{ flex: 1, padding: '0 16px 16px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Chain Today's Sales (Pure SQL)</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399', margin: '8px 0' }}>₹{hqMetrics.totalSales?.toFixed(2)}</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{hqMetrics.totalOrders} Orders Processed</p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Chain Avg Food Cost %</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', margin: '8px 0' }}>{hqMetrics.avgFoodCostPct}%</h2>
              <p style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>Target: 29.85% (BOM Yield Enforced)</p>
            </div>
          </div>

          {/* 🥩 LIVE INVENTORY STOCK & BOM DEPLETION GRID */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={22} color="#38bdf8" /> Live Raw Ingredient Stock & BOM Depletion
              </h3>
              <span className="badge-status badge-emerald">SQLite WAL Database</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {inventoryList.map(inv => (
                <div key={inv.code} style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: inv.availableQty <= inv.reorderLevel ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>{inv.code}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', margin: '4px 0' }}>{inv.name}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: inv.availableQty <= inv.reorderLevel ? '#fb7185' : '#34d399' }}>
                    {inv.availableQty} {inv.unit}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Reorder Level: {inv.reorderLevel} {inv.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MULTI-OUTLET COMPARISON */}
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

      {/* TABLE SELECTOR MODAL */}
      {showTableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-card" style={{ width: '500px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '16px' }}>🪑 Select Dining Floor Table</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {tablesList.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setSelectedTable(t.id); setShowTableModal(false); }}
                  style={{ padding: '16px', borderRadius: '12px', border: selectedTable === t.id ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: t.status === 'OCCUPIED' ? 'rgba(245,158,11,0.2)' : 'rgba(15,23,42,0.6)', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{t.id}</div>
                  <div style={{ fontSize: '0.75rem', color: t.status === 'OCCUPIED' ? '#fbbf24' : '#34d399', marginTop: '4px' }}>{t.status}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTableModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#334155', color: '#fff', fontWeight: 700 }}>Close</button>
          </div>
        </div>
      )}

      {/* THERMAL ESC/POS RECEIPT PRINT MODAL */}
      {showReceiptModal && lastOrderReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="thermal-receipt">
              <h2>RCMS RESTAURANT</h2>
              <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>Connaught Place Flagship #01</p>
              <div className="receipt-line" />
              <p><strong>Order #:</strong> {lastOrderReceipt.orderNumber}</p>
              <p><strong>Table:</strong> {lastOrderReceipt.tableId}</p>
              <p><strong>Waiter:</strong> {lastOrderReceipt.waiterId}</p>
              <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
              <div className="receipt-line" />
              {(lastOrderReceipt.items || []).map((i: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{i.quantity}x {i.itemName}</span>
                  <span>₹{i.subtotal}</span>
                </div>
              ))}
              <div className="receipt-line" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{lastOrderReceipt.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (5%):</span>
                <span>₹{lastOrderReceipt.totalTax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '6px' }}>
                <span>TOTAL:</span>
                <span>₹{lastOrderReceipt.grandTotal}</span>
              </div>
              <div className="receipt-line" />
              <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>Thank you! Visit again.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-emerald" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} /> Print Receipt
              </button>
              <button onClick={() => setShowReceiptModal(false)} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#334155', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
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
