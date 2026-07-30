// RCMS POS Waiter PWA Controller Logic
const state = {
  activeUser: { name: 'Rahul Sharma', role: 'WAITER', pin: '4321' },
  selectedTable: 'Table 2',
  selectedCategory: 'ALL',
  pinInput: '',
  cart: [],
  tables: [
    { id: 'Table 1', status: 'avail', cap: '2 Seats' },
    { id: 'Table 2', status: 'occ', cap: '4 Seats' },
    { id: 'Table 3', status: 'occ', cap: '6 Seats' },
    { id: 'Table 4', status: 'avail', cap: '4 Seats' },
    { id: 'Table 5', status: 'res', cap: '8 Seats' },
    { id: 'Table 6', status: 'bill', cap: '2 Seats' },
  ],
  menuItems: [
    { id: 'item_butter_chicken', cat: 'cat_mains', name: 'Butter Chicken', price: 350, station: 'GRILL' },
    { id: 'item_paneer_tikka', cat: 'cat_starters', name: 'Paneer Tikka', price: 280, station: 'GRILL' },
    { id: 'item_dal_makhani', cat: 'cat_mains', name: 'Dal Makhani', price: 260, station: 'FRY' },
    { id: 'item_butter_naan', cat: 'cat_mains', name: 'Butter Naan', price: 60, station: 'GRILL' },
    { id: 'item_masala_coke', cat: 'cat_beverages', name: 'Masala Coke', price: 90, station: 'BAR' },
    { id: 'item_sweet_lassi', cat: 'cat_beverages', name: 'Sweet Lassi', price: 110, station: 'BAR' },
  ]
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderTables();
  renderMenu();
  renderCart();
  closePinModal();
});

// PIN MODAL LOGIC
function openPinModal() {
  document.getElementById('pin-modal').style.display = 'flex';
  state.pinInput = '';
  updatePinDots();
}

function closePinModal() {
  document.getElementById('pin-modal').style.display = 'none';
}

function pressPin(digit) {
  if (state.pinInput.length < 4) {
    state.pinInput += digit;
    updatePinDots();
    if (state.pinInput.length === 4) {
      setTimeout(submitPin, 150);
    }
  }
}

function clearPin() {
  state.pinInput = '';
  updatePinDots();
}

function updatePinDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (i <= state.pinInput.length) dot.classList.add('filled');
    else dot.classList.remove('filled');
  }
}

function submitPin() {
  if (state.pinInput === '4321') {
    state.activeUser = { name: 'Rahul Sharma', role: 'WAITER' };
    document.getElementById('active-waiter-name').innerText = 'Rahul Sharma (Waiter)';
    closePinModal();
  } else if (state.pinInput === '1234') {
    state.activeUser = { name: 'Outlet Manager', role: 'ADMIN' };
    document.getElementById('active-waiter-name').innerText = 'Outlet Manager (Admin)';
    closePinModal();
  } else {
    alert('Invalid Staff PIN! Try 4321 (Waiter) or 1234 (Manager)');
    clearPin();
  }
}

function quickLogin(pin) {
  state.pinInput = pin;
  updatePinDots();
  submitPin();
}

// RENDER TABLES
function renderTables() {
  const grid = document.getElementById('table-grid');
  grid.innerHTML = state.tables.map(t => `
    <div class="table-card ${t.status} ${t.id === state.selectedTable ? 'selected' : ''}" onclick="selectTable('${t.id}')">
      <span class="table-num">${t.id}</span>
      <span class="table-cap">${t.cap}</span>
    </div>
  `).join('');
}

function selectTable(tableId) {
  state.selectedTable = tableId;
  document.getElementById('selected-table-label').innerText = tableId;
  renderTables();
}

// RENDER MENU
function filterCategory(cat) {
  state.selectedCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const filtered = state.selectedCategory === 'ALL' 
    ? state.menuItems 
    : state.menuItems.filter(i => i.cat === state.selectedCategory);

  grid.innerHTML = filtered.map(item => `
    <div class="menu-card" onclick="addToCart('${item.id}')">
      <div class="menu-name">${item.name}</div>
      <div class="menu-footer">
        <span class="menu-price">₹${item.price}</span>
        <button class="btn-add">+</button>
      </div>
    </div>
  `).join('');
}

// CART LOGIC
function addToCart(itemId) {
  const item = state.menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = state.cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...item, qty: 1, notes: item.id === 'item_butter_chicken' ? 'Extra Butter (+₹30)' : '' });
  }
  renderCart();
}

function updateQty(itemId, delta) {
  const item = state.cart.find(c => c.id === itemId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c.id !== itemId);
  }
  renderCart();
}

function clearCart() {
  state.cart = [];
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cart-items-list');

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="empty-cart">
        <span class="empty-icon">🍽️</span>
        <p>Cart is empty. Tap menu items to add to order.</p>
      </div>
    `;
  } else {
    list.innerHTML = state.cart.map(item => `
      <div class="cart-row">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          ${item.notes ? `<span class="cart-item-notes">📝 ${item.notes}</span>` : ''}
          <span style="font-size:0.85rem; color:#94a3b8;">₹${item.price} x ${item.qty} = ₹${item.price * item.qty}</span>
        </div>
        <div class="cart-qty-ctrl">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
          <span style="font-weight:700;">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `).join('');
  }

  // CALCULATE SUMMARY
  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const grandTotal = subtotal + cgst + sgst;

  document.getElementById('cart-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
  document.getElementById('cart-cgst').innerText = `₹${cgst.toFixed(2)}`;
  document.getElementById('cart-sgst').innerText = `₹${sgst.toFixed(2)}`;
  document.getElementById('cart-grand-total').innerText = `₹${grandTotal.toFixed(2)}`;
}

function sendOrderToKitchen() {
  if (state.cart.length === 0) {
    alert('Cart is empty! Select items before submitting to kitchen.');
    return;
  }

  const orderNum = `KOT-${Math.floor(1000 + Math.random() * 9000)}`;
  alert(`🔥 ORDER DISPATCHED TO KDS!\n\nOrder #: ${orderNum}\nTable: ${state.selectedTable}\nStaff: ${state.activeUser.name}\nTotal: ₹${document.getElementById('cart-grand-total').innerText}`);
  
  // Mark table as occupied
  const table = state.tables.find(t => t.id === state.selectedTable);
  if (table) table.status = 'occ';
  
  state.cart = [];
  renderTables();
  renderCart();
}
