interface OrderItemInput {
    product: {
        preparationMinutes: number;
    };
    quantity: number;
}
export declare function calculateEstimatedReady(items: OrderItemInput[]): Date;
export declare function scheduleReadyUpdate(orderId: string, ms: number): NodeJS.Timeout;
export {};
//# sourceMappingURL=brewService.d.ts.map