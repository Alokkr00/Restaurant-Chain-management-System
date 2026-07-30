import { Order } from '@rcms/shared-types';

export class ReceiptFormatterService {
  formatCustomerReceipt(order: Order): string {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('          DELHI SPICE RESTAURANT        ');
    lines.push('      Connaught Place, New Delhi       ');
    lines.push('        GSTIN: 07AAAAA0000A1Z5          ');
    lines.push('----------------------------------------');
    lines.push(`Receipt #: ${order.orderNumber}`);
    lines.push(`Table: ${order.tableId || 'N/A'} | Date: ${new Date(order.createdAt).toLocaleTimeString()}`);
    lines.push('----------------------------------------');

    for (const item of order.items) {
      lines.push(`${item.itemName} x ${item.quantity}`);
      lines.push(`  Price: ₹${item.unitPrice} | Total: ₹${item.subtotal}`);
    }

    lines.push('----------------------------------------');
    lines.push(`Subtotal:         ₹${order.subtotal}`);
    lines.push(`CGST (2.5%):      ₹${(order.totalTax / 2).toFixed(2)}`);
    lines.push(`SGST (2.5%):      ₹${(order.totalTax / 2).toFixed(2)}`);
    lines.push(`Grand Total:      ₹${order.grandTotal}`);
    lines.push('========================================');
    lines.push('       Thank you for dining with us!    ');
    lines.push('========================================');

    return lines.join('\n');
  }
}
