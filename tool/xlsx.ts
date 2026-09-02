import { buildXlsx, GBP, type Cell } from "./excel";
import type { MortgageModel } from "./run";

export function buildMortgageXlsx(m: MortgageModel): Uint8Array {
  // Inputs: B2 balance, B3 rate %, B4 term years, B5 overpay/mo, B6 lump,
  // B8 monthly rate (formula), B9 required payment (formula).
  const I = "'Inputs & Assumptions'!";
  const inputs: Cell[][] = [
    ["Inputs & Assumptions", ""],
    ["Outstanding balance (£)", { v: m.balance, z: GBP }],
    ["Interest rate % (annual) — editable", m.rate],
    ["Remaining term (years)", m.termYears],
    ["Monthly overpayment (£) — editable", { v: m.overpay, z: GBP }],
    ["One-off lump sum (£) — editable", { v: m.lump, z: GBP }],
    ["", ""],
    ["Monthly rate", { f: "B3/100/12", v: m.rate / 100 / 12 }],
    ["Required monthly payment (£)", { f: "IF(B8=0,B2/(B4*12),B2*B8/(1-(1+B8)^-(B4*12)))", v: m.payment, z: GBP }],
  ];

  // Amortisation sheet, month rows: A month, B baseline interest, C baseline
  // balance, D scenario interest, E scenario balance.
  const rows: Cell[][] = [
    ["Month", "Baseline interest", "Baseline balance", "Overpay interest", "Overpay balance"],
  ];
  const nMonths = m.baseline.months;
  for (let i = 0; i < nMonths; i++) {
    const r = i + 2;
    const basePrev = i === 0 ? `${I}B2` : `C${r - 1}`;
    const scenPrev = i === 0 ? `MAX(0,${I}B2-${I}B6)` : `E${r - 1}`;
    const bm = m.baseline.monthly[i];
    const sm = m.scenario.monthly[i]; // undefined after early payoff
    rows.push([
      i + 1,
      { f: `(${basePrev})*${I}$B$8`, v: bm?.interest ?? 0, z: GBP },
      { f: `MAX(0,(${basePrev})+B${r}-MIN(${I}$B$9,(${basePrev})+B${r}))`, v: bm?.balance ?? 0, z: GBP },
      { f: `(${scenPrev})*${I}$B$8`, v: sm?.interest ?? 0, z: GBP },
      { f: `MAX(0,(${scenPrev})+D${r}-MIN(${I}$B$9+${I}$B$5,(${scenPrev})+D${r}))`, v: sm?.balance ?? 0, z: GBP },
    ]);
  }

  const last = nMonths + 1;
  const saved = m.baseline.totalInterest - m.scenario.totalInterest;
  const summary: Cell[][] = [
    ["Summary", ""],
    ["Baseline total interest (£)", { f: `SUM(Amortisation!B2:B${last})`, v: m.baseline.totalInterest, z: GBP }],
    ["Overpay total interest (£)", { f: `SUM(Amortisation!D2:D${last})`, v: m.scenario.totalInterest, z: GBP }],
    ["Interest saved (£)", { f: "B2-B3", v: saved, z: GBP }],
    ["Baseline payoff (months)", { f: `COUNTIF(Amortisation!C2:C${last},">0")+1`, v: m.baseline.months }],
    ["Overpay payoff (months)", { f: `COUNTIF(Amortisation!E2:E${last},">0")+1`, v: m.scenario.months }],
    ["Months shaved", { f: "B5-B6", v: m.baseline.months - m.scenario.months }],
  ];

  return buildXlsx([
    { name: "Inputs & Assumptions", rows: inputs, colWidths: [36, 16] },
    { name: "Amortisation", rows, colWidths: [8, 18, 18, 18, 18] },
    { name: "Summary", rows: summary, colWidths: [30, 18] },
  ]);
}
