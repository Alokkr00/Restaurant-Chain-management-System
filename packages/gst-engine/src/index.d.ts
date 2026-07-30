import { TaxBreakdown } from '@rcms/shared-types';
export interface GSTConfig {
    isInterState: boolean;
    defaultTaxRate: number;
}
/**
 * Calculates Indian GST breakdown for a given taxable amount.
 * Standard restaurant GST rate in India is 5% without ITC (2.5% CGST + 2.5% SGST).
 * Guarantees cgstAmount + sgstAmount === totalTax down to exact paisa.
 */
export declare function calculateGST(taxableAmount: number, config?: GSTConfig): TaxBreakdown;
//# sourceMappingURL=index.d.ts.map