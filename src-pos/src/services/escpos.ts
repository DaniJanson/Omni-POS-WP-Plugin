/**
 * ESC/POS Thermal Receipt Generator
 * Generates raw standard ESC/POS bytecode for 80mm and 58mm thermal printers.
 */

import type { ReceiptData, StoreInfo } from '../types';

export class EscPosBuilder {
  private buffer: string = '';

  // ESC/POS Commands
  private static ESC = '\x1B';
  private static GS = '\x1D';
  private static FS = '\x1C';

  constructor() {
    this.init();
  }

  public init(): this {
    this.buffer += EscPosBuilder.ESC + '@'; // Initialize printer
    return this;
  }

  public alignCenter(): this {
    this.buffer += EscPosBuilder.ESC + 'a\x01';
    return this;
  }

  public alignLeft(): this {
    this.buffer += EscPosBuilder.ESC + 'a\x00';
    return this;
  }

  public alignRight(): this {
    this.buffer += EscPosBuilder.ESC + 'a\x02';
    return this;
  }

  public bold(enable: boolean = true): this {
    this.buffer += EscPosBuilder.ESC + 'E' + (enable ? '\x01' : '\x00');
    return this;
  }

  public doubleSize(enable: boolean = true): this {
    this.buffer += EscPosBuilder.GS + '!' + (enable ? '\x11' : '\x00');
    return this;
  }

  public text(str: string): this {
    this.buffer += str;
    return this;
  }

  public line(str: string = ''): this {
    this.buffer += str + '\n';
    return this;
  }

  public feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer += '\n';
    }
    return this;
  }

  public divider(char: string = '-', width: number = 42): this {
    this.buffer += char.repeat(width) + '\n';
    return this;
  }

  public twoColumn(left: string, right: string, width: number = 42): this {
    const space = Math.max(1, width - left.length - right.length);
    this.buffer += left + ' '.repeat(space) + right + '\n';
    return this;
  }

  public kickDrawer(): this {
    // ESC p 0 25 250 (pin 2) & ESC p 1 25 250 (pin 5)
    this.buffer += EscPosBuilder.ESC + 'p\x00\x19\xFA' + EscPosBuilder.ESC + 'p\x01\x19\xFA';
    return this;
  }

  public cut(): this {
    this.feed(3);
    this.buffer += EscPosBuilder.GS + 'V\x00'; // Full cut
    return this;
  }

  public getRaw(): string {
    return this.buffer;
  }

  /**
   * Build complete thermal receipt from ReceiptData
   */
  public static buildReceipt(
    order: ReceiptData,
    store?: StoreInfo,
    options: {
      kickDrawer?: boolean;
      autoCut?: boolean;
      receiptHeader?: string;
      receiptFooter?: string;
    } = {}
  ): string {
    const builder = new EscPosBuilder();

    // 1. Kick Cash Drawer (if cash sale or explicitly enabled)
    if (options.kickDrawer) {
      builder.kickDrawer();
    }

    // 2. Header
    builder.alignCenter();
    builder.doubleSize(true).bold(true);
    builder.line(store?.name || 'OMNI POS');
    builder.doubleSize(false).bold(false);

    if (store?.description) {
      builder.line(store.description);
    }
    if (store?.address?.address_1) {
      builder.line(store.address.address_1);
    }
    if (store?.phone) {
      builder.line(`Tel: ${store.phone}`);
    }
    if (store?.tax_number) {
      builder.line(`Tax ID / საიდენტ.: ${store.tax_number}`);
    }

    if (options.receiptHeader) {
      builder.feed(1);
      builder.line(options.receiptHeader);
    }

    builder.divider('=', 42);

    // 3. Order Info
    builder.alignLeft();
    builder.twoColumn(`Receipt #: ${order.order_number}`, order.date || new Date().toLocaleTimeString(), 42);
    if (order.cashier) {
      builder.line(`Cashier: ${order.cashier}`);
    }
    if (order.customer_name) {
      builder.line(`Customer: ${order.customer_name}`);
    }

    builder.divider('-', 42);

    // 4. Column Header
    builder.bold(true);
    builder.twoColumn('ITEM / QTY x PRICE', 'TOTAL', 42);
    builder.bold(false);
    builder.divider('-', 42);

    // 5. Order Items
    const currency = store?.currency_symbol || '₾';
    for (const item of order.items) {
      builder.bold(true);
      builder.line(item.name);
      builder.bold(false);

      const qty = item.qty || (item as any).quantity || 1;
      const qtyPrice = `  ${qty} x ${currency}${item.price.toFixed(2)}`;
      const lineTotal = `${currency}${item.total.toFixed(2)}`;
      builder.twoColumn(qtyPrice, lineTotal, 42);
    }

    builder.divider('-', 42);

    // 6. Totals
    builder.twoColumn('Subtotal:', `${currency}${order.subtotal.toFixed(2)}`, 42);

    if (order.discount && order.discount > 0) {
      builder.twoColumn('Discount:', `-${currency}${order.discount.toFixed(2)}`, 42);
    }

    if (order.tax && order.tax > 0) {
      builder.twoColumn('Tax (VAT):', `${currency}${order.tax.toFixed(2)}`, 42);
    }

    builder.divider('=', 42);
    builder.bold(true).doubleSize(true);
    builder.twoColumn('TOTAL:', `${currency}${order.total.toFixed(2)}`, 21);
    builder.doubleSize(false).bold(false);
    builder.divider('=', 42);

    // 7. Payment Info
    builder.twoColumn(`Payment (${(order.payment_method || 'CASH').toUpperCase()}):`, `${currency}${order.total.toFixed(2)}`, 42);
    if (order.change && order.change > 0) {
      builder.twoColumn('Cash Received:', `${currency}${order.tendered.toFixed(2)}`, 42);
      builder.bold(true);
      builder.twoColumn('Change Due:', `${currency}${order.change.toFixed(2)}`, 42);
      builder.bold(false);
    }

    builder.divider('-', 42);

    // 8. Footer
    builder.alignCenter();
    if (options.receiptFooter) {
      builder.line(options.receiptFooter);
    } else {
      builder.line('Thank you for your visit!');
      builder.line('გმადლობთ მობრძანებისთვის!');
    }

    // 9. Cut Paper
    if (options.autoCut !== false) {
      builder.cut();
    }

    return builder.getRaw();
  }

  /**
   * Build test receipt for hardware diagnostics
   */
  public static buildTestReceipt(store?: StoreInfo): string {
    const builder = new EscPosBuilder();
    builder.kickDrawer();
    builder.alignCenter();
    builder.doubleSize(true).bold(true);
    builder.line(store?.name || 'OMNI POS');
    builder.line('TEST RECEIPT');
    builder.doubleSize(false).bold(false);
    builder.divider('=', 42);
    builder.alignLeft();
    builder.line(`Date: ${new Date().toLocaleString()}`);
    builder.line('Printer: Thermal ESC/POS Compatible');
    builder.line('Status: Connected & Operational');
    builder.divider('-', 42);
    builder.alignCenter();
    builder.bold(true);
    builder.line('✓ Hardware Test Passed Successfully!');
    builder.line('✓ ტესტური ბეჭდვა წარმატებით შესრულდა!');
    builder.bold(false);
    builder.divider('=', 42);
    builder.cut();
    return builder.getRaw();
  }
}
