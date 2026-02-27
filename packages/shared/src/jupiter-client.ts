import { JUPITER_QUOTE_API, BPOLY_MINT, SOL_MINT, BPOLY_DECIMALS } from "./constants";

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50
): Promise<JupiterQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
  });
  const res = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getSwapTransaction(
  quote: JupiterQuote,
  userPublicKey: string
): Promise<JupiterSwapResponse> {
  const res = await fetch(`${JUPITER_QUOTE_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap failed: ${res.status} ${text}`);
  }
  return res.json();
}

export function quoteSolToBpoly(lamports: string, slippageBps = 50) {
  return getQuote(SOL_MINT, BPOLY_MINT, lamports, slippageBps);
}

export function quoteBpolyToSol(microBpoly: string, slippageBps = 50) {
  return getQuote(BPOLY_MINT, SOL_MINT, microBpoly, slippageBps);
}

export function formatBpoly(microBpoly: string | number): string {
  return (Number(microBpoly) / 10 ** BPOLY_DECIMALS).toFixed(2);
}

export function formatSol(lamports: string | number): string {
  return (Number(lamports) / 1e9).toFixed(4);
}
