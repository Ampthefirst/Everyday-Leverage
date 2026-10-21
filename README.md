# Everyday Leverage

A web app that turns a described task and a few measurements into a custom-fit, strength-checked
aid that lowers the force a daily task needs — ready to 3D print, with drawings and a 1:1 fit-check template.

- Product spec: [`docs/everyday-leverage-guide.md`](docs/everyday-leverage-guide.md)
- v1 build plan: [`PLAN.md`](PLAN.md)
- Current status: [`STATUS.md`](STATUS.md)

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck, lint, unit tests, build
npm run e2e        # browser smoke tests
```

Optional Gemini features need `GEMINI_API_KEY` and `GEMINI_MODEL` set as Vercel environment
variables (see `.env.example`). Everything else works without them, offline.

Not a medical device. Strength numbers are estimates until calibrated to your printer.
