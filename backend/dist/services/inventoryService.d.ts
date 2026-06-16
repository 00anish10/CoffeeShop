interface StockItem {
    productId: string;
    quantity: number;
}
export declare function checkAvailability(items: StockItem[]): Promise<void>;
export declare function deductStock(items: StockItem[]): Promise<void>;
export declare function restoreStock(items: StockItem[]): Promise<void>;
export {};
//# sourceMappingURL=inventoryService.d.ts.map