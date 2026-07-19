# BulFi Keeper — Conditional Swap Bot

An autonomous bot that watches real on-chain price data from a BulFi Swap
pool and automatically executes a swap via Circle's App Kit when a price
condition is met — no manual intervention required.

Built for Circle's "Build on Arc" hackathon (DeFi track) to demonstrate
programmable, conditional money flows using Arc's sub-second settlement
and Circle's official Swap SDK.

## How it works

1. Every 30 seconds, the bot reads the live exchange rate directly from a
   deployed [BulFi Swap](../arc-dex) `ArcSwapPool` contract via
   `getAmountOut()` — real on-chain data, not a simulated or external price.
2. If the rate crosses a configured threshold, the bot executes a real
   swap using [Circle's App Kit Swap SDK](https://docs.arc.io/app-kit/swap),
   signed by a dedicated bot wallet.
3. The swap settles on Arc Testnet and the transaction hash + explorer
   link are logged.

## Why this matters

This demonstrates a genuine conditional payment / onchain automation flow:
real price data in, autonomous execution out, with no human clicking a
button in between. It pairs with BulFi Swap's custom AMM contracts to show
both raw Solidity engineering and fluency with Circle's production
infrastructure.

## Setup

```bash
npm install
cp .env.example .env
# fill in ARC_RPC_URL, KIT_KEY, BOT_PRIVATE_KEY
npx tsx swap-bot.ts
```

## Configuration

Edit the constants at the top of `swap-bot.ts`:
- `TRIGGER_RATE_THRESHOLD` — the rate that triggers a swap
- `CHECK_INTERVAL_MS` — how often to check the price
- `SWAP_AMOUNT` — how much to swap when triggered

## Example run
