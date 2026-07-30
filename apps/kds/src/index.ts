import { KDSService } from './modules/kds.service';

console.log('----------------------------------------------------');
console.log('📺 RCMS Kitchen Display System (KDS) Scaffolding');
console.log('----------------------------------------------------');

const kdsService = new KDSService();

kdsService.loadItemsFromOrder('ord_7001', 'KOT-7001', 'Table 3', [
  {
    id: 'kds_item_1',
    orderId: 'ord_7001',
    menuItemId: 'item_butter_chicken',
    itemName: 'Butter Chicken',
    unitPrice: 350,
    quantity: 2,
    subtotal: 700,
    taxBreakdown: { cgstRate: 2.5, cgstAmount: 17.5, sgstRate: 2.5, sgstAmount: 17.5, igstRate: 0, igstAmount: 0, totalTax: 35 },
    totalPrice: 735,
    station: 'GRILL' as any,
    kdsStatus: 'PENDING' as any,
    notes: 'Extra Spicy',
  },
]);

const grillTickets = kdsService.getTicketsForStation('GRILL' as any);
console.log(`[KDS] Station Display Initialized. Active Grill Tickets: ${grillTickets.length}`);
