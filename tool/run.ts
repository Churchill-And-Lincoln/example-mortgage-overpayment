import type { Result, ToolCtx, ResultBlock } from "../sdk/types";
import { buildMortgageXlsx } from "./xlsx";

export interface Scenario {
  months: number;
  totalInterest: number;
  yearEndBalances: number[]; // balance at end of each year until payoff
  monthly: { interest: number; balance: number }[]; // cached values for Excel
}

export interface MortgageModel {
  balance: number;
  rate: number; // % annual
  termYears: number;
  overpay: number; // £/month
  lump: number;
  payment: number; // required monthly payment
  baseline: Scenario;
  scenario: Scenario;
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** "£1,234,567" — whole pounds, thousands separators. */
const gbp = (n: number): string =>
  `£${Math.round(n).toLocaleString("en-GB")}`;

const num = (input: Record<string, string>, id: string, fallback = 0): number => {
  const n = Number(input[id]);
  return Number.isFinite(n) ? n : fallback;
};

export const DISCLAIMER_BLOCK: ResultBlock = {
  type: "markdown",
  content: `---

> _This is an illustrative model built from your inputs and the stated
> assumptions — not financial advice. Growth is applied in real (after-
> inflation) terms; actual returns vary year to year, and rates and tax
> rules change. Check anything important with a professional before acting._`,
};


function amortise(start: number, monthlyRate: number, payment: number, maxMonths: number): Scenario {
  let bal = start;
  let totalInterest = 0;
  const yearEndBalances: number[] = [];
  const monthly: Scenario["monthly"] = [];
  let months = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = bal * monthlyRate;
    totalInterest += interest;
    bal = Math.max(0, bal + interest - payment);
    months++;
    monthly.push({ interest, balance: bal });
    if (months % 12 === 0 || bal === 0) yearEndBalances.push(bal);
  }
  return { months, totalInterest, yearEndBalances, monthly };
}

export function computeMortgage(input: Record<string, string>): MortgageModel {
  const balance = num(input, "balance");
  const rate = num(input, "rate");
  const termYears = num(input, "term");
  const overpay = num(input, "overpay");
  const lump = num(input, "lump", 0);

  const r = rate / 100 / 12;
  const n = termYears * 12;
  const payment = r === 0 ? balance / n : (balance * r) / (1 - Math.pow(1 + r, -n));
  const cap = n + 12; // safety margin over the contractual term

  const baseline = amortise(balance, r, payment, cap);
  const scenario = amortise(Math.max(0, balance - lump), r, payment + overpay, cap);
  return { balance, rate, termYears, overpay, lump, payment, baseline, scenario };
}

const yrs = (months: number) =>
  `${Math.floor(months / 12)}y ${months % 12}m`;

export async function run(
  input: Record<string, string>,
  _secrets: Record<string, string>,
  _ctx: ToolCtx,
): Promise<Result> {
  const m = computeMortgage(input);
  const saved = m.baseline.totalInterest - m.scenario.totalInterest;
  const shaved = m.baseline.months - m.scenario.months;
  const nYears = Math.ceil(m.baseline.months / 12);
  const pad = (s: Scenario) =>
    Array.from({ length: nYears }, (_, i) => Math.round(s.yearEndBalances[i] ?? 0));

  const blocks: ResultBlock[] = [
    {
      type: "keyvalues",
      items: [
        { label: "Interest saved", value: gbp(saved) },
        { label: "Time shaved off", value: `${shaved} months (${yrs(shaved)})` },
        { label: "Required monthly payment", value: gbp(m.payment) },
        { label: "Paid off in", value: `${yrs(m.scenario.months)} instead of ${yrs(m.baseline.months)}` },
      ],
    },
    {
      type: "chart",
      kind: "line",
      title: "Balance: baseline vs with overpayment",
      xLabels: Array.from({ length: nYears }, (_, i) => `Y${i + 1}`),
      series: [
        { name: "Baseline", values: pad(m.baseline) },
        { name: "With overpayment", values: pad(m.scenario) },
      ],
      yFormat: "currency",
    },
    {
      type: "table",
      header: ["Year", "Baseline balance", "With overpayment"],
      rows: Array.from({ length: nYears }, (_, i) => [
        String(i + 1),
        gbp(m.baseline.yearEndBalances[i] ?? 0),
        gbp(m.scenario.yearEndBalances[i] ?? 0),
      ]),
    },
    DISCLAIMER_BLOCK,
  ];

  return {
    title: "Your Mortgage Overpayment Analysis",
    summary: `Overpaying ${gbp(m.overpay)}/month saves ${gbp(saved)} in interest and clears the mortgage ${yrs(shaved)} early`,
    blocks,
    attachments: [
      { filename: "mortgage-overpayment.xlsx", mimeType: XLSX_MIME, data: buildMortgageXlsx(m) },
    ],
  };
}
