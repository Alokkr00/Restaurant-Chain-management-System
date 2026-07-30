import { TaxBreakdown } from '@rcms/shared-types';

export interface GSTConfig {
  isInterState: boolean;
  defaultTaxRate: number; // e.g. 5 for 5% GST (2.5% CGST + 2.5% SGST)
}

/**
 * Calculates Indian GST breakdown for a given taxable amount.
 * Standard restaurant GST rate in India is 5% without ITC (2.5% CGST + 2.5% SGST).
 * Guarantees cgstAmount + sgstAmount === totalTax down to exact paisa.
 */
export function calculateGST(
  taxableAmount: number,
  config: GSTConfig = { isInterState: false, defaultTaxRate: 5 },
): TaxBreakdown {
  const totalTaxRate = config.defaultTaxRate;
  const totalTax = Number(((taxableAmount * totalTaxRate) / 100).toFixed(2));

  if (config.isInterState) {
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: totalTaxRate,
      igstAmount: totalTax,
      totalTax,
    };
  }

  const halfRate = totalTaxRate / 2;
  const cgstAmount = Number((totalTax / 2).toFixed(2));
  const sgstAmount = Number((totalTax - cgstAmount).toFixed(2));

  return {
    cgstRate: halfRate,
    cgstAmount,
    sgstRate: halfRate,
    sgstAmount,
    igstRate: 0,
    igstAmount: 0,
    totalTax,
  };
}
