export interface OutletPerformanceReport {
  outletId: string;
  outletName: string;
  totalOrders: number;
  totalSales: number;
  totalTaxCollected: number;
  foodCostAmount: number;
  foodCostPercentage: number;
}

export class HQReportingService {
  private outletData: OutletPerformanceReport[] = [
    {
      outletId: 'outlet_flagship_01',
      outletName: 'Connaught Place (Flagship)',
      totalOrders: 142,
      totalSales: 84500,
      totalTaxCollected: 4225,
      foodCostAmount: 25350,
      foodCostPercentage: 30.0,
    },
    {
      outletId: 'outlet_cyberhub_02',
      outletName: 'Gurugram CyberHub',
      totalOrders: 98,
      totalSales: 62000,
      totalTaxCollected: 3100,
      foodCostAmount: 19220,
      foodCostPercentage: 31.0,
    },
  ];

  getMultiOutletSummary(): {
    chainTotalSales: number;
    chainTotalOrders: number;
    chainAvgFoodCostPct: number;
    outlets: OutletPerformanceReport[];
  } {
    const chainTotalSales = this.outletData.reduce((sum, o) => sum + o.totalSales, 0);
    const chainTotalOrders = this.outletData.reduce((sum, o) => sum + o.totalOrders, 0);
    const chainTotalFoodCost = this.outletData.reduce((sum, o) => sum + o.foodCostAmount, 0);
    const chainAvgFoodCostPct = Number(((chainTotalFoodCost / chainTotalSales) * 100).toFixed(2));

    return {
      chainTotalSales,
      chainTotalOrders,
      chainAvgFoodCostPct,
      outlets: this.outletData,
    };
  }
}
