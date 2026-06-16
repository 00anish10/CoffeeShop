"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEstimatedReady = calculateEstimatedReady;
exports.scheduleReadyUpdate = scheduleReadyUpdate;
function calculateEstimatedReady(items) {
    const maxPrepMinutes = Math.max(...items.map((item) => item.product.preparationMinutes));
    const estimated = new Date(Date.now() + maxPrepMinutes * 60 * 1000);
    return estimated;
}
function scheduleReadyUpdate(orderId, ms) {
    return setTimeout(() => {
        // This is intentionally minimal — actual ready status
        // transitions are managed by staff via the PUT status endpoint.
        // The timeout serves as a server-side fallback hint for notifications.
    }, ms);
}
//# sourceMappingURL=brewService.js.map