# TokenLens AI

A hackathon MVP that accepts a tokenomics CSV, writes an analysis script to a CreateOS sandbox, executes it with Python, and presents the results in a React dashboard.

## What works
- CSV upload in the web UI.
- Python analysis runs inside the existing CreateOS sandbox through the `createos` CLI.
- Allocation shares, top-three share, concentration heuristics, and optional future unlock parsing.
- Report export as JSON.
- If `OPENAI_API_KEY` is configured, the agent asks the model to generate a Python analyzer from the CSV structure, applies basic safety checks, compiles it, and runs it in the isolated sandbox. Without the key, it uses the built-in Python analyzer and transparent rule-based explanation.

## Setup
1. Keep your existing Stripe Projects `.env` private. Do not paste it into chat or commit it.
2. Unzip/copy these files into your existing `tokenlens-ai` project folder, replacing the Vite starter files when prompted.
3. Run:
   ```bash
   npm install
   ```
4. Create a local `.env` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Keep the Stripe Projects variables already present in your existing `.env`; do not replace that file blindly. Add/update only `SANDBOX_NAME`, `SANDBOX_ID`, `PORT`, and optionally `OPENAI_API_KEY` / `OPENAI_MODEL`.
5. Check CreateOS login:
   ```bash
   createos whoami
   createos sandbox get tokenlens-sandbox
   ```
6. Start the app:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:5173`.

## Required CSV
Minimum columns:
```csv
category,tokens
Community,25000000
Team,20000000
Treasury,30000000
```

Optional unlock columns:
```csv
unlock_date,unlock_amount
2026-12-01,5000000
```
For unlock rows to be interpreted together with categories, include these alongside `category,tokens`.

## Important
- `OPENAI_API_KEY` is optional, but needed for model-written explanations. It is not included in this project. Use your own API key if you have one; API usage may cost money.
- This MVP does not make investment recommendations and does not prove a token is safe or unsafe.
- With an OpenAI API key, the model generates the Python analyzer itself. Generated code is restricted to standard-library imports and blocked from common network/process execution APIs, then syntax-checked in the sandbox before execution. These are basic safeguards, not a formal security guarantee. Without a key, the app uses the built-in analyzer.
- The app invokes the locally authenticated CreateOS CLI, so keep the server local and never expose it publicly without authentication.
