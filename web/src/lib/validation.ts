import { z } from "zod";

export const customerEditSchema = z.object({
  name: z.string().min(2, "Name too short"),
  phone: z
    .string()
    .min(5, "Phone too short")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type CustomerEditInput = z.infer<typeof customerEditSchema>;

export const transactionEditSchema = z.object({
  title: z.string().min(2, "Title too short"),
  amount: z.coerce.number().positive("Amount must be positive"),
});
export type TransactionEditInput = z.infer<typeof transactionEditSchema>;

export const paymentEditSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});
export type PaymentEditInput = z.infer<typeof paymentEditSchema>;
