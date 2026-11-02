export interface BookingPreOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingRequestedStaff {
  role: string;
  roleName: string;
  staffId?: string;
  staffName?: string;
  fee: number;
}

export interface BookingMetadataPayload {
  customNote?: string;
  tableEstimatedPrice?: number;
  preOrderedItems?: BookingPreOrderItem[];
  preOrderedAmount?: number;
  requestedStaff?: BookingRequestedStaff | null;
  staffFee?: number;
}

export const METADATA_START_TAG = '[__BOOKING_METADATA__]';
export const METADATA_END_TAG = '[/__BOOKING_METADATA__]';

export function composeBookingNotes(payload: BookingMetadataPayload, customNotes?: string): string {
  const json = JSON.stringify(payload);
  const tagBlock = `${METADATA_START_TAG}${json}${METADATA_END_TAG}`;
  return customNotes ? `${tagBlock} ${customNotes}`.trim() : tagBlock;
}

export function extractBookingMetadata(notes?: string | null): BookingMetadataPayload | null {
  if (!notes) return null;

  // 1. Thẻ chuẩn mới [__BOOKING_METADATA__]...[/__BOOKING_METADATA__]
  const startIdx = notes.indexOf(METADATA_START_TAG);
  const endIdx = notes.indexOf(METADATA_END_TAG);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const jsonStr = notes.substring(startIdx + METADATA_START_TAG.length, endIdx);
      return JSON.parse(jsonStr);
    } catch {
      // ignore
    }
  }

  // 2. Backward compatibility: [METADATA:...] dùng lastIndexOf(']')
  if (notes.startsWith('[METADATA:')) {
    try {
      const lastBracket = notes.lastIndexOf(']');
      if (lastBracket > 10) {
        const jsonStr = notes.substring(10, lastBracket);
        return JSON.parse(jsonStr);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

