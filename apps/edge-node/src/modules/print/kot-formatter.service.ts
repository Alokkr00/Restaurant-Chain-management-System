import { Order, KitchenStation } from '@rcms/shared-types';

export class KOTFormatterService {
  formatStationKOT(order: Order, station: KitchenStation): string {
    const stationItems = order.items.filter((i) => i.station === station);
    if (stationItems.length === 0) return '';

    const lines: string[] = [];
    lines.push('========================================');
    lines.push(`           KITCHEN TICKET: ${station}   `);
    lines.push('========================================');
    lines.push(`Order #: ${order.orderNumber}`);
    lines.push(`Table: ${order.tableId || 'Takeaway'}`);
    lines.push(`Time: ${new Date().toLocaleTimeString()}`);
    lines.push('----------------------------------------');

    for (const item of stationItems) {
      lines.push(`${item.quantity}x  ${item.itemName}`);
      if (item.notes) lines.push(`    Notes: ${item.notes}`);
    }

    lines.push('----------------------------------------');
    return lines.join('\n');
  }
}
