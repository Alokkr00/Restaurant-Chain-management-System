import { Order } from '../../../../packages/shared-types/src/index';
import { PaymentTransaction } from '../payment/payment.service';

export interface FormattedReceiptPrintJob {
  jobId: string;
  orderId: string;
  orderNumber: string;
  formattedText: string;
  targetPrinterIp: string;
}

export class ReceiptFormatterService {
  formatReceipt(order: Order, transaction: PaymentTransaction): FormattedReceiptPrintJob {
    let text = `========================================\n`;
    text += `         ROYAL SPICE RESTAURANT         \n`;
    text += `   Flagship Branch, Connaught Place     \n`;
    text += `      GSTIN: 07AAAAA0000A1Z5           \n`;
    text += `      FSSAI Lic: 11122333000444        \n`;
    text += `========================================\n`;
    text += `Invoice #: INV-${order.orderNumber}\n`;
    text += `Table: ${order.tableId || 'Takeaway'} | Type: ${order.orderType}\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleString('en-IN')}\n`;
    text += `----------------------------------------\n`;
    text += `Item                Qty   Price   Total \n`;
    text += `----------------------------------------\n`;

    for (const item of order.items) {
      const namePadded = item.itemName.padEnd(18).substring(0, 18);
      const qtyPadded = item.quantity.toString().padStart(3);
      const pricePadded = item.unitPrice.toString().padStart(6);
      const totalPadded = item.subtotal.toString().padStart(7);
      text += `${namePadded} ${qtyPadded} ${pricePadded} ${totalPadded}\n`;
    }

    text += `----------------------------------------\n`;
    text += `Subtotal:                     ₹${order.subtotal.toFixed(2).padStart(8)}\n`;
    
    // Tax Breakdown
    const firstItemTax = order.items[0]?.taxBreakdown;
    if (firstItemTax) {
      text += `CGST (${firstItemTax.cgstRate}%):               ₹${order.items.reduce((s, i) => s + i.taxBreakdown.cgstAmount, 0).toFixed(2).padStart(8)}\n`;
      text += `SGST (${firstItemTax.sgstRate}%):               ₹${order.items.reduce((s, i) => s + i.taxBreakdown.sgstAmount, 0).toFixed(2).padStart(8)}\n`;
    }
    
    text += `----------------------------------------\n`;
    text += `GRAND TOTAL:                  ₹${order.grandTotal.toFixed(2).padStart(8)}\n`;
    text += `========================================\n`;
    text += `Payment Method: ${transaction.method}\n`;
    text += `Txn Ref: ${transaction.referenceNumber}\n`;
    text += `Paid Status: SUCCESS\n`;
    text += `========================================\n`;
    text += `     Thank You! Please Visit Again!     \n`;
    text += `[ESC/POS FULL CUT COMMAND ENQUEUED]\n`;

    return {
      jobId: `print_receipt_${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      formattedText: text,
      targetPrinterIp: '192.168.1.25', // Dedicated Billing Counter Thermal Printer
    };
  }
}
