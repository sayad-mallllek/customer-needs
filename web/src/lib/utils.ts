export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const TRANSACTION_TYPES = [
  "phoneline_charging",
  "phoneline_payment",
  "shahid_subscription",
  "netflix_subscription",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ["whish", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
