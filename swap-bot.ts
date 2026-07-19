import "dotenv/config"
import { SwapKit } from "@circle-fin/swap-kit"
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2"
import { createPublicClient, http, parseUnits, formatUnits } from "viem"
import { defineChain } from "viem"

// ---- Arc Testnet config ----
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.ARC_RPC_URL as string] } },
})

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_RPC_URL),
})

// ---- Your deployed contracts ----
const USDC_EURC_POOL = "0xDC319d3A75057C27B060070E1e40129b30FD87Ab"
const POOL_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "getAmountOut",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "aToB", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

// ---- Trigger configuration ----
// Watching: how much EURC you get per 1 USDC, from your real pool reserves.
// Trigger fires when EURC output drops below this threshold (meaning USDC
// has gotten relatively stronger against EURC).
const TRIGGER_RATE_THRESHOLD = 0.98 // trigger if 1 USDC buys < 0.98 EURC
const CHECK_INTERVAL_MS = 30_000
const SWAP_AMOUNT = "1.00"

let hasTriggered = false

async function getRealPoolRate(): Promise<number> {
  const amountIn = parseUnits("1", 18) // 1 USDC, 18 decimals (matches your MockToken)
  const amountOut = await publicClient.readContract({
    address: USDC_EURC_POOL,
    abi: POOL_ABI,
    functionName: "getAmountOut",
    args: [amountIn, true], // true = USDC -> EURC direction
  })
  return Number(formatUnits(amountOut as bigint, 18))
}

async function checkAndSwap() {
  const rate = await getRealPoolRate()
  console.log(`[${new Date().toISOString()}] Pool rate: 1 USDC = ${rate.toFixed(6)} EURC`)

  if (rate < TRIGGER_RATE_THRESHOLD && !hasTriggered) {
    hasTriggered = true
    console.log(`Trigger hit! Rate ${rate.toFixed(6)} < ${TRIGGER_RATE_THRESHOLD}. Executing swap...`)

    try {
      const kit = new SwapKit()
      const adapter = createViemAdapterFromPrivateKey({
        privateKey: process.env.BOT_PRIVATE_KEY as `0x${string}`,
      })

      const result = await kit.swap({
        from: { adapter, chain: "Arc_Testnet" },
        tokenIn: "USDC",
        tokenOut: "EURC",
        amountIn: SWAP_AMOUNT,
        config: { kitKey: process.env.KIT_KEY as string },
      })

      console.log("Swap executed successfully:", result)
    } catch (err) {
      console.error("Swap failed:", err)
      hasTriggered = false
    }
  }
}

console.log(`Starting BulFi conditional swap bot. Watching real pool rate for trigger < ${TRIGGER_RATE_THRESHOLD}...`)
setInterval(checkAndSwap, CHECK_INTERVAL_MS)
checkAndSwap()
