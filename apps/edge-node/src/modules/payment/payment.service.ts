export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  CASH = 'CASH',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string; // UPI Txn ID or Card Auth Code
  paidAt: string;
}

export class PaymentService {
  private transactions: PaymentTransaction[] = [];

  processPayment(
    orderId: string,
    amount: number,
    method: PaymentMethod,
    referenceNumber?: string,
  ): PaymentTransaction {
    console.log(`[PaymentService] Processing ${method} payment of ₹${amount} for order ${orderId}...`);

    const transaction: PaymentTransaction = {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      amount,
      method,
      status: PaymentStatus.SUCCESS, // Simulated instant settlement
      referenceNumber: referenceNumber || (method === PaymentMethod.UPI ? `UPI${Date.now()}` : `REF${Date.now()}`),
      paidAt: new Date().toISOString(),
    };

    this.transactions.push(transaction);
    console.log(`[PaymentService] Payment SUCCESS (${method}). Ref: ${transaction.referenceNumber}`);
    return transaction;
  }

  getTransactionsForOrder(orderId: string): PaymentTransaction[] {
    return this.transactions.filter((t) => t.orderId === orderId);
  }
}
