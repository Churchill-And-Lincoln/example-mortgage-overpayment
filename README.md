# Mortgage Overpayment Analyser

An example tool built for [ManyUseful.Tools](https://manyuseful.tools), the
pay-per-use tool marketplace. It shows how a complete, sellable tool fits in
three small TypeScript files: a form, a config, and one `run()` function.
The platform handles the storefront, payment, delivery, email and the buyer's
permanent result link. You keep 95% of every sale.

## What the tool does

A buyer enters five numbers about their mortgage:

| Field | Meaning |
|---|---|
| Outstanding balance (£) | What is left to pay |
| Interest rate % (annual) | Their current rate |
| Remaining term (years) | Years left on the contractual term |
| Monthly overpayment (£) | The extra they plan to pay each month |
| One-off lump sum (£, optional) | A single payment made today |

The tool amortises the mortgage twice, once at the required monthly payment
and once with the overpayment (and lump sum) applied, and returns:

- **Headline figures** – interest saved, months shaved off, the required
  monthly payment, and the new payoff time versus the original.
- **A line chart** of the year-end balance for the baseline and the
  overpayment scenario.
- **A year-by-year table** of both balances.
- **A downloadable Excel model** (`mortgage-overpayment.xlsx`) with an
  inputs sheet and a full month-by-month amortisation sheet. The sheet uses
  live formulas, so the buyer can change the rate, overpayment or lump sum
  and watch the numbers update.
- **A disclaimer** noting that it is an illustrative model, not advice.

It is priced flat at £5 and needs no API keys or secrets.

## How it is built

Everything lives in `tool/`:

| File | Role |
|---|---|
| `config.ts` | Slug, name, description, price (£5, flat) |
| `schema.ts` | The five form fields the platform renders for the buyer |
| `run.ts` | Amortisation maths and the result blocks (key-values, chart, table, markdown) |
| `xlsx.ts` | Builds the Excel workbook with formulas from the computed model |
| `excel.ts` | Small helper over the `xlsx` package for writing cells, formulas and formats |

`run(input, secrets, ctx)` receives the validated form answers, calls
`computeMortgage()`, and returns a `Result`: a title, a one-line summary,
content blocks and the spreadsheet attachment. The platform renders it with
the same branding as every other tool on the marketplace.

## Run it locally

```bash
npm install
npm run dev        # → http://localhost:5150
```

The dev server renders the form, runs `run()` and previews the result,
including the Excel download. Other useful scripts:

```bash
npm run check      # validate config and schema against platform rules
npm run typecheck  # tsc --noEmit
```

## Use it as a starting point

1. Make your own repo from this template (green "Use this template" button
   on GitHub, rather than forking).
2. Replace the contents of `tool/` with your own config, schema and `run()`.
3. If your tool needs API keys, list their names in `requiredSecrets` in
   `config.ts` and set the values in the dashboard's Secrets tab.

### Platform rules worth knowing

- **Prices are multiples of £5/$5.** Choose a `flat`, `descent` or `ascent`
  pricing curve in `config.ts`.
- **Throw on failure.** If `run()` throws, the platform retries twice and
  then refunds the buyer. Never return a degraded result for a paid output.
- **Runtime:** TypeScript only, bundled to one file. No filesystem, no native
  modules, HTTP via `ctx.fetch` only, and a couple of minutes of runtime.
- **Attachments:** up to 5 MB per result. Spreadsheets with live formulas,
  like the one here, are far more useful to buyers than static values.

## Publishing

1. Sign in at **app.manyuseful.tools** with GitHub and connect your Stripe
   account. You are the merchant of record and buyers pay you directly.
2. Create your tool, pick a slug (it becomes `your-slug.manyuseful.tools`)
   and copy the deploy token.
3. In your repo add the `CL_DEPLOY_TOKEN` secret under Settings → Secrets
   and variables → Actions.
4. Push to `main`. The included `publish.yml` workflow validates, bundles
   and publishes. The first version gets a quick human review; after that
   every push deploys automatically.

Questions: **support@manyuseful.tools**
