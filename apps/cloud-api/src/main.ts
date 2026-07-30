import * as http from 'http';

export interface CloudSyncBatchPayload {
  outletId: string;
  sentAt: string;
  events: Array<{
    id: string;
    eventType: string;
    payloadJson: string;
    vectorClock: number;
    createdAt: string;
  }>;
}

const cloudReceivedEvents: any[] = [];
const outletMetricsMap: Map<string, { totalSales: number; totalOrders: number }> = new Map();

// Initialize Flagship Outlets
outletMetricsMap.set('outlet_flagship_01', { totalSales: 0, totalOrders: 0 });
outletMetricsMap.set('outlet_gurugram_02', { totalSales: 62000, totalOrders: 98 });
outletMetricsMap.set('outlet_bengaluru_03', { totalSales: 41500, totalOrders: 64 });

async function startCloudApiServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '';

    // ==========================================
    // ☁️ CLOUD SYNC INGESTION ENDPOINT
    // ==========================================
    if (req.method === 'POST' && url === '/api/v1/cloud/sync-ingest') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const batch: CloudSyncBatchPayload = JSON.parse(body);
          const outletId = batch.outletId || 'outlet_flagship_01';
          const processedIds: string[] = [];

          let currentMetrics = outletMetricsMap.get(outletId) || { totalSales: 0, totalOrders: 0 };

          for (const evt of batch.events || []) {
            cloudReceivedEvents.push({ outletId, ...evt });
            processedIds.push(evt.id);

            if (evt.eventType === 'ORDER_PLACED') {
              try {
                const orderData = JSON.parse(evt.payloadJson);
                currentMetrics.totalSales += (orderData.grandTotal || 0);
                currentMetrics.totalOrders += 1;
              } catch (e) {}
            }
          }

          outletMetricsMap.set(outletId, currentMetrics);

          console.log(`[Cloud API Ingest] Received batch of ${batch.events?.length || 0} events from Outlet "${outletId}". Total Outlet Sales: ₹${currentMetrics.totalSales.toFixed(2)}`);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            outletId,
            acknowledgedCount: processedIds.length,
            processedIds,
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    // ==========================================
    // 📊 CLOUD CONSOLIDATED CHAIN METRICS
    // ==========================================
    if (req.method === 'GET' && url === '/api/v1/cloud/chain-metrics') {
      let grandChainSales = 0;
      let grandChainOrders = 0;
      const outletList: any[] = [];

      outletMetricsMap.forEach((metrics, outletId) => {
        grandChainSales += metrics.totalSales;
        grandChainOrders += metrics.totalOrders;
        outletList.push({
          outletId,
          totalSales: metrics.totalSales,
          totalOrders: metrics.totalOrders,
        });
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        grandChainSales,
        grandChainOrders,
        activeOutletsCount: outletMetricsMap.size,
        outlets: outletList,
        totalEventsIngested: cloudReceivedEvents.length
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  const PORT = 4000;
  server.listen(PORT, () => {
    console.log(`\n====================================================`);
    console.log(`☁️ RCMS CENTRAL CLOUD API GATEWAY LIVE ON PORT ${PORT}`);
    console.log(`====================================================`);
    console.log(`📡 Sync Ingest API:  http://localhost:${PORT}/api/v1/cloud/sync-ingest`);
    console.log(`📊 Chain Metrics API: http://localhost:${PORT}/api/v1/cloud/chain-metrics`);
    console.log(`====================================================\n`);
  });
}

startCloudApiServer().catch(err => console.error('[Cloud API] Server start error:', err));
