interface OrderItemInput {
  product: { preparationMinutes: number };
  quantity: number;
}

export function calculateEstimatedReady(items: OrderItemInput[]): Date {
  const maxPrepMinutes = Math.max(...items.map((item) => item.product.preparationMinutes));
  const estimated = new Date(Date.now() + maxPrepMinutes * 60 * 1000);
  return estimated;
}

export function scheduleReadyUpdate(orderId: string, ms: number): NodeJS.Timeout {
  return setTimeout(() => {
    // This is intentionally minimal — actual ready status
    // transitions are managed by staff via the PUT status endpoint.
    // The timeout serves as a server-side fallback hint for notifications.
  }, ms);
}
