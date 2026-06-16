import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function createPaymentIntent(
  amountCents: number,
  metadata: Record<string, string>
) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function refund(paymentIntentId: string) {
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

export function constructWebhookEvent(
  rawBody: Buffer | string,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  );
}
