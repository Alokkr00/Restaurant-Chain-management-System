import { SyncEventEnvelope } from '@rcms/shared-types';

export enum EventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_REMOVED = 'ITEM_REMOVED',
  TABLE_STATUS_CHANGED = 'TABLE_STATUS_CHANGED',
  ORDER_PAID = 'ORDER_PAID',
  WASTAGE_LOGGED = 'WASTAGE_LOGGED',
}

export interface SyncBatchRequest {
  outletId: string;
  lastAcknowledgedSequence: number;
  events: SyncEventEnvelope[];
}

export interface SyncBatchResponse {
  success: boolean;
  acknowledgedSequence: number;
  processedCount: number;
  serverTimestamp: number;
}
