import type { ToolConfig } from "../sdk/types";

export const config: ToolConfig = {
  slug: "mortgage",
  name: "Mortgage Overpayment Analyser",
  description:
    "What a monthly overpayment actually buys you: payoff dates, interest saved, months shaved — with a chart, both amortisation tables, and a downloadable Excel model with live formulas.",
  pricePence: 500,
  currency: "gbp",
  pricing: { model: "flat" },
};