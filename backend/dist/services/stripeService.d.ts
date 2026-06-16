export declare function createPaymentIntent(amountCents: number, metadata: Record<string, string>): Promise<import("stripe/cjs/lib").Response<import("stripe/cjs/resources/PaymentIntents").PaymentIntent>>;
export declare function refund(paymentIntentId: string): Promise<import("stripe/cjs/lib").Response<import("stripe/cjs/resources/Refunds").Refund>>;
export declare function constructWebhookEvent(rawBody: Buffer | string, signature: string): import("stripe/cjs/resources/Events").Event;
//# sourceMappingURL=stripeService.d.ts.map