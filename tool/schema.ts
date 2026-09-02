import type { ToolSchema } from "../sdk/types";

export const schema: ToolSchema = {
  fields: [
    { kind: "number", id: "balance", label: "Outstanding balance (£)", min: 1, max: 100_000_000, required: true },
    { kind: "number", id: "rate", label: "Interest rate % (annual)", min: 0.1, max: 25, required: true },
    { kind: "number", id: "term", label: "Remaining term (years)", min: 1, max: 40, required: true },
    { kind: "number", id: "overpay", label: "Monthly overpayment (£)", min: 0, max: 1_000_000, required: true },
    { kind: "number", id: "lump", label: "One-off lump sum now (£, optional)", min: 0, max: 100_000_000 },
  ],
};
