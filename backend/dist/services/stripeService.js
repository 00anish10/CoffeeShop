"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.refund = refund;
exports.constructWebhookEvent = constructWebhookEvent;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '');
async function createPaymentIntent(amountCents, metadata) {
    return stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata,
        automatic_payment_methods: { enabled: true },
    });
}
async function refund(paymentIntentId) {
    return stripe.refunds.create({ payment_intent: paymentIntentId });
}
function constructWebhookEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
}
//# sourceMappingURL=stripeService.js.map