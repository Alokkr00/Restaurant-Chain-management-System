// KDS Station Controller Logic
const state = {
  currentStation: 'GRILL',
  tickets: [
    {
      id: 'kot_1001',
      orderNumber: 'KOT-1001',
      table: 'Table 2',
      placedMinutesAgo: 3,
      items: [
        { name: 'Butter Chicken', qty: 2, station: 'GRILL', notes: 'Extra Spicy, Butter Naan' },
        { name: 'Paneer Tikka', qty: 1, station: 'GRILL', notes: 'No Onion' },
      ],
      status: 'PENDING'
    },
    {
      id: 'kot_1002',
      orderNumber: 'KOT-1002',
      table: 'Table 4',
      placedMinutesAgo: 7,
      items: [
        { name: 'Chicken Tikka', qty: 2, station: 'GRILL', notes: 'Well Done' },
        { name: 'Dal Makhani', qty: 1, station: 'FRY', notes: '' },
      ],
      status: 'COOKING'
    },
    {
      id: 'kot_1003',
      orderNumber: 'KOT-1003',
      table: 'Table 6',
      placedMinutesAgo: 14,
      items: [
        { name: 'Mutton Seekh Kebab', qty: 3, station: 'GRILL', notes: 'URGENT — VIP TABLE' },
      ],
      status: 'PENDING'
    },
    {
      id: 'kot_1004',
      orderNumber: 'KOT-1004',
      table: 'Table 1',
      placedMinutesAgo: 2,
      items: [
        { name: 'French Fries', qty: 2, station: 'FRY', notes: 'Extra Salt' },
      ],
      status: 'PENDING'
    }
  ]
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  renderTickets();
});

// CLOCK
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toTimeString().split(' ')[0];
  }, 1000);
}

// STATION SWITCHING
function switchStation(station) {
  state.currentStation = station;
  document.querySelectorAll('.station-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderTickets();
}

// RENDER TICKETS
function renderTickets() {
  const grid = document.getElementById('kds-ticket-grid');
  
  // Filter tickets by active station
  const filtered = state.tickets.filter(ticket => {
    if (ticket.status === 'BUMPED') return false;
    if (state.currentStation === 'ALL') return true;
    return ticket.items.some(i => i.station === state.currentStation);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#a1a1aa;">
        <span style="font-size:4rem; margin-bottom:16px;">✅</span>
        <h2 style="font-size:2rem; font-weight:900;">ALL CLEAR FOR ${state.currentStation} STATION!</h2>
        <p>No active kitchen tickets for this station right now.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(t => {
    let timerClass = 'green';
    if (t.placedMinutesAgo >= 10) timerClass = 'red';
    else if (t.placedMinutesAgo >= 5) timerClass = 'yellow';

    // Filter items for current station if not ALL
    const stationItems = state.currentStation === 'ALL'
      ? t.items
      : t.items.filter(i => i.station === state.currentStation);

    return `
      <div class="kds-card timer-${timerClass}">
        <div class="card-header">
          <div>
            <div class="ticket-num">${t.orderNumber}</div>
            <div class="table-tag">${t.table}</div>
          </div>
          <div class="timer-badge ${timerClass}">${t.placedMinutesAgo} MIN</div>
        </div>

        <div class="card-items">
          ${stationItems.map(item => `
            <div class="item-row">
              <div class="item-main">
                <span class="item-qty">${item.qty}x</span>
                <span class="item-name">${item.name}</span>
              </div>
              ${item.notes ? `<div class="item-notes">⚠️ ${item.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="card-footer">
          <button class="btn-bump ${t.status === 'COOKING' ? 'cooking' : ''}" onclick="bumpTicket('${t.id}')">
            ${t.status === 'PENDING' ? '▶️ START COOKING' : '✓ BUMP TICKET'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// BUMP ACTION
function bumpTicket(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  if (ticket.status === 'PENDING') {
    ticket.status = 'COOKING';
  } else if (ticket.status === 'COOKING') {
    ticket.status = 'BUMPED';
  }

  renderTickets();
}
