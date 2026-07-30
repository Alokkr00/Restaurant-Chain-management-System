/**
 * 🖨️ NATIVE ESC/POS BINARY COMMAND BUILDER
 * Generates raw ESC/POS byte buffers for Epson & Star 80mm thermal receipt printers.
 */
export class ESCPOSBuilder {
  private buffer: Buffer;

  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  private append(bytes: number[] | Buffer): this {
    const newBuf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    this.buffer = Buffer.concat([this.buffer, newBuf]);
    return this;
  }

  /** Initialize Printer: ESC @ */
  public initialize(): this {
    return this.append([0x1b, 0x40]);
  }

  /** Select Justification: ESC a n (0: Left, 1: Center, 2: Right) */
  public setAlign(align: 'left' | 'center' | 'right'): this {
    const val = align === 'left' ? 0 : align === 'center' ? 1 : 2;
    return this.append([0x1b, 0x61, val]);
  }

  /** Set Text Size: GS ! n (0: Normal, 17: Double Height/Width) */
  public setTextSize(widthMultiplier: number = 1, heightMultiplier: number = 1): this {
    const n = ((widthMultiplier - 1) << 4) | (heightMultiplier - 1);
    return this.append([0x1d, 0x21, n]);
  }

  /** Set Emphasized / Bold: ESC E n (1: On, 0: Off) */
  public setBold(enabled: boolean): this {
    return this.append([0x1b, 0x45, enabled ? 1 : 0]);
  }

  /** Print Text String */
  public text(str: string): this {
    return this.append(Buffer.from(str, 'utf8'));
  }

  /** Print Text Line with Newline */
  public textLine(str: string): this {
    return this.append(Buffer.from(str + '\n', 'utf8'));
  }

  /** Print Horizontal Separator Line (48 chars for 80mm paper) */
  public separator(char: string = '-'): this {
    return this.textLine(char.repeat(48));
  }

  /** Print 2-Column Row (e.g. Item Name and Price) */
  public row2Column(leftStr: string, rightStr: string, colWidth: number = 48): this {
    const maxLeftWidth = colWidth - rightStr.length - 1;
    let truncatedLeft = leftStr;
    if (leftStr.length > maxLeftWidth) {
      truncatedLeft = leftStr.substring(0, maxLeftWidth - 2) + '..';
    }
    const spacesNeeded = colWidth - truncatedLeft.length - rightStr.length;
    const line = truncatedLeft + ' '.repeat(Math.max(1, spacesNeeded)) + rightStr;
    return this.textLine(line);
  }

  /** Feed Paper Lines: ESC d n */
  public feed(lines: number = 3): this {
    return this.append([0x1b, 0x64, lines]);
  }

  /** Full Paper Cut: GS V 0 */
  public cut(): this {
    return this.append([0x1d, 0x56, 0x00]);
  }

  /** Open Cash Drawer: ESC p 0 25 250 */
  public openCashDrawer(): this {
    return this.append([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  }

  /** Export Complete ESC/POS Byte Buffer */
  public build(): Buffer {
    return this.buffer;
  }
}

/**
 * GENERATE FORMATED THERMAL RECEIPT ESC/POS BINARY BUFFER
 */
export function buildThermalReceiptBuffer(order: {
  orderNumber: string;
  tableId: string;
  waiterId: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number; subtotal: number }>;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  storeName?: string;
}): Buffer {
  const builder = new ESCPOSBuilder();

  builder
    .initialize()
    .setAlign('center')
    .setBold(true)
    .setTextSize(2, 2)
    .textLine(order.storeName || 'RCMS RESTAURANT')
    .setTextSize(1, 1)
    .setBold(false)
    .textLine('Connaught Place Flagship #01')
    .textLine('GSTIN: 07AAAAA0000A1Z5 | FSSAI: 10020011000123')
    .separator('=')
    .setAlign('left')
    .row2Column(`Order #: ${order.orderNumber}`, `Table: ${order.tableId}`)
    .row2Column(`Waiter: ${order.waiterId}`, `Date: ${new Date().toLocaleDateString()}`)
    .row2Column(`Time: ${new Date().toLocaleTimeString()}`, `Type: DINE_IN`)
    .separator('-');

  // HEADER
  builder.row2Column('QTY ITEM DESCRIPTION', 'AMOUNT (INR)');
  builder.separator('-');

  // LINE ITEMS
  for (const item of order.items) {
    const lineStr = `${item.quantity}x ${item.itemName}`;
    const priceStr = `Rs.${item.subtotal.toFixed(2)}`;
    builder.row2Column(lineStr, priceStr);
  }

  builder
    .separator('-')
    .row2Column('Subtotal:', `Rs.${order.subtotal.toFixed(2)}`)
    .row2Column('CGST (2.5%):', `Rs.${(order.totalTax / 2).toFixed(2)}`)
    .row2Column('SGST (2.5%):', `Rs.${(order.totalTax / 2).toFixed(2)}`)
    .separator('=')
    .setBold(true)
    .setTextSize(1, 2)
    .row2Column('GRAND TOTAL:', `Rs.${order.grandTotal.toFixed(2)}`)
    .setTextSize(1, 1)
    .setBold(false)
    .separator('=')
    .setAlign('center')
    .textLine('Thank you for dining with us!')
    .textLine('Please visit again.')
    .feed(4)
    .cut();

  return builder.build();
}
