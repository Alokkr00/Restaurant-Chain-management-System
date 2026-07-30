import { Order, OrderItem, KitchenStation } from '../../../../packages/shared-types/src/index';

export interface FormattedKOTPrintJob {
  jobId: string;
  orderId: string;
  orderNumber: string;
  tableId?: string;
  station: KitchenStation;
  formattedText: string;
  targetPrinterIp: string;
  fallbackPrinterIp: string;
}

export class KOTFormatterService {
  // Station thermal printer mapping (static LAN IPs)
  private stationPrinterMap: Record<KitchenStation, { primary: string; fallback: string }> = {
    GRILL: { primary: '192.168.1.21', fallback: '192.168.1.20' }, // Backup to Pantry
    FRY: { primary: '192.168.1.22', fallback: '192.168.1.20' },
    COLD: { primary: '192.168.1.20', fallback: '192.168.1.21' },
    BAR: { primary: '192.168.1.23', fallback: '192.168.1.20' },
  };

  formatKOTForStation(order: Order, station: KitchenStation): FormattedKOTPrintJob | null {
    const stationItems = order.items.filter((i) => i.station === station);
    if (stationItems.length === 0) return null;

    const printerConfig = this.stationPrinterMap[station] || { primary: '192.168.1.20', fallback: '192.168.1.21' };

    let text = `========================================\n`;
    text += `          KITCHEN ORDER TICKET          \n`;
    text += `========================================\n`;
    text += `Order #: ${order.orderNumber}\n`;
    text += `Table: ${order.tableId || 'N/A'} | Type: ${order.orderType}\n`;
    text += `Station: ${station}\n`;
    text += `Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN')}\n`;
    text += `----------------------------------------\n`;

    for (const item of stationItems) {
      text += `${item.quantity}x  ${item.itemName.toUpperCase()}\n`;
      if (item.notes) {
        text += `    >> NOTE: ${item.notes}\n`;
      }
    }

    text += `----------------------------------------\n`;
    text += `[ESC/POS FULL CUT COMMAND ENQUEUED]\n`;
    text += `========================================\n`;

    return {
      jobId: `print_kot_${station}_${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      station,
      formattedText: text,
      targetPrinterIp: printerConfig.primary,
      fallbackPrinterIp: printerConfig.fallback,
    };
  }
}
