export type BetTypeRow = {
  site: string;
  wager_name: string;
  bets: number;
  spins: number;
  wagered: number;
  won: number;
  expected: number;
  net_vs_theo: number;
  rtp: number | null;
  theo_rtp: number | null;
  sd: number | null;
  z: number | null;
  p_usd: number | null;
  p_usd_bh: number | null;
  p_usd_bonf: number | null;
  hits: number;
  exp_hits: number;
  hit_rate: number | null;
  theo_hit: number | null;
  hit_z: number | null;
  p_hits: number | null;
  p_hits_bh: number | null;
  p_hits_bonf: number | null;
  thin: boolean;
  tested: boolean;
  mispaid: number;
};

export type WindowKey = '7d' | '30d' | 'all';

export type BetTypePvalues = {
  generated_at: string;
  min_exp_hits: number;
  ranges: Record<WindowKey, Record<string, [string, string]>>;
  windows: Record<WindowKey, BetTypeRow[]>;
};

export async function fetchBetTypePvalues(): Promise<BetTypePvalues | null> {
  try {
    const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/bet-type-pvalues`, {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const body = typeof raw?.body === 'string' ? JSON.parse(raw.body) : raw?.body ?? raw;
    return body?.windows ? (body as BetTypePvalues) : null;
  } catch {
    return null;
  }
}

/** Count of facility x bet type cells significant after Benjamini-Hochberg (either test). */
export function significantCount(data: BetTypePvalues | null, win: WindowKey = '7d'): number {
  if (!data) return 0;
  return data.windows[win].filter(
    (r) => r.tested && ((r.p_usd_bh ?? 1) < 0.05 || (r.p_hits_bh ?? 1) < 0.05),
  ).length;
}