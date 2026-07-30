import { CartStore } from './store/cart.store';
import { TableService, TableStatus } from './modules/table/table.service';
import { Order, OrderType, OrderStatus } from '@rcms/shared-types';

console.log('----------------------------------------------------');
console.log('📱 RCMS POS Waiter PWA Scaffolding');
console.log('----------------------------------------------------');

const tableService = new TableService();
const cartStore = new CartStore();

const tables = tableService.getTables();
const selectedTable = tables[1];
tableService.updateTableStatus(selectedTable.id, TableStatus.OCCUPIED, undefined, 'usr_waiter_01');

cartStore.setTable(selectedTable.id);
cartStore.setWaiter('usr_waiter_01');

cartStore.addItem({
  menuItemId: 'item_butter_chicken',
  itemName: 'Butter Chicken',
  unitPrice: 350,
  quantity: 2,
  station: 'GRILL' as any,
  selectedModifiers: [{ id: 'mod_extra_butter', name: 'Extra Butter', priceDelta: 30 }],
  notes: 'Serve hot with butter naan',
});

const totals = cartStore.getTotals();
console.log(`[POS Waiter] Cart Module Initialized. Total Items: ${totals.itemCount}, Grand Total: ₹${totals.grandTotal}`);
