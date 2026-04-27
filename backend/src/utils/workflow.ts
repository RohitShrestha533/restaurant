export const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'BILLED', 'COMPLETED'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const TABLE_STATUSES = ['AVAILABLE', 'RESERVED', 'OCCUPIED'] as const;
export type TableStatus = typeof TABLE_STATUSES[number];

export const ORDER_ITEM_STATUSES = ['PENDING', 'PREPARING', 'READY', 'SERVED'] as const;
export type OrderItemStatus = typeof ORDER_ITEM_STATUSES[number];

export const DELIVERY_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'] as const;
export type DeliveryStatus = typeof DELIVERY_STATUSES[number];

export const RESERVATION_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;

const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['BILLED'],
  BILLED: ['COMPLETED'],
  COMPLETED: [],
};

const TABLE_TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ['RESERVED', 'OCCUPIED'],
  RESERVED: ['OCCUPIED', 'AVAILABLE'],
  OCCUPIED: ['AVAILABLE'],
};

const ORDER_ITEM_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: [],
};

const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED'],
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [],
};

export function isValidOrderTransition(current: string, next: string): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isValidTableTransition(current: string, next: string): boolean {
  return TABLE_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isValidOrderItemTransition(current: string, next: string): boolean {
  return ORDER_ITEM_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isValidDeliveryTransition(current: string, next: string): boolean {
  return DELIVERY_TRANSITIONS[current]?.includes(next) ?? false;
}
