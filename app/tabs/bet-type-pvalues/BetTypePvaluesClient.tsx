'use client';

import { useMemo, useState } from 'react';
import type { BetTypePvalues, BetTypeRow, WindowKey } from '@/lib/fetchBetTypePvalues';

type Metric = 'usd' | 'hits';
type SortKey = 'site' | 'type' | 'dir' | 'bets' | 'wag' | 'rtp' | 'hit' | 'z' | 'p' | 'bh';

const TYPES = ['Straight Up', 'Split', 'Street', 'Trio', 'Corner', 'Basket', 'Line', 'Column', 'Dozen',
  'Low', 'High', 'Evens', 'Odds', 'Reds', 'Black'];
const POCKETS: Record<string, number> = { 'Straight Up': 1, Split: 2, Street: 3, Trio: 3, Corner: 4, Basket: 5,
  Line: 6, Column: 12, Dozen: 12, Low: 18, High: 18, Evens: 18, Odds: 18, Reds: 18, Black: 18 };
const WINDOWS: [WindowKey, string][] = [['7d', 'Past 7 days'], ['30d', 'Past 30 days'], ['all', 'All time']];
const METRICS: [Metric, string][] = [['usd', 'Dollar outcome'], ['hits', 'Hit rate']];

const HOT = 'rgba(251, 113, 133, 0.38)';   // rose-400: players ahead
const COLD = 'rgba(56, 189, 248, 0.32)';   // sky-400: house ahead
const MID = '#1e2136';

const siteLabel = (s: string) =>
  s === 'ALL SITES' ? 'All facilities' : s.replace(/^ky_cdi_/, 'CDI ').replace(/^ky_/, '').replace(/_/g, ' ').toUpperCase();
const fmt$ = (v: number | null) => (v == null ? '-' : (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString());
const fmtN = (v: number | null) => (v == null ? '-' : Math.round(v).toLocaleString());
const fmtPct = (v: number | null) => (v == null ? '-' : (v * 100).toFixed(2) + '%');
const fmtZ = (v: number | null) => (v == null || !isFinite(v) ? '-' : (v > 0 ? '+' : '') + v.toFixed(2));
const fmtPCell = (v: number | null) => (v == null ? '-' : v < 0.01 ? '<.01' : v.toFixed(2).replace(/^0/, ''));
const fmtP = (v: number | null) => (v == null ? '-' : v < 0.0001 ? v.toExponential(1) : v.toFixed(4));
const zOf = (r: BetTypeRow, m: Metric) => (m === 'usd' ? r.z : r.hit_z);
const pOf = (r: BetTypeRow, m: Metric) => (m === 'usd' ? r.p_usd : r.p_hits);
const bhOf = (r: BetTypeRow, m: Metric) => (m === 'usd' ? r.p_usd_bh : r.p_hits_bh);
const colour = (z: number | null) => (z == null || !isFinite(z) || Math.abs(z) < 2 ? MID : z > 0 ? HOT : COLD);
const toCdt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-700">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={v === value}
          className={`px-3 py-1.5 text-sm ${v === value ? 'bg-orange-400 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function BetTypePvaluesClient({ data }: { data: BetTypePvalues }) {
  const [win, setWin] = useState<WindowKey>('7d');
  const [met, setMet] = useState<Metric>('usd');
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('p');
  const [sortDir, setSortDir] = useState(1);

  const rows = data.windows[win];
  const idx = useMemo(() => new Map(rows.map((r) => [`${r.site}|${r.wager_name}`, r])), [rows]);
  const sites = useMemo(
    () => [...new Set(data.windows.all.map((r) => r.site))].filter((s) => s !== 'ALL SITES').sort(),
    [data],
  );

  const rangeText = useMemo(() => {
    const rng = Object.values(data.ranges[win] ?? {});
    if (!rng.length) return '';
    if (win === 'all') {
      const firsts = rng.map((x) => x[0]).sort();
      const lasts = rng.map((x) => x[1]).sort();
      return `${firsts[0].slice(0, 10)} to ${lasts[lasts.length - 1].slice(0, 10)} (all data on file)`;
    }
    const ends = rng.map((x) => x[1].slice(0, 10)).sort();
    const days = win === '7d' ? 7 : 30;
    return ends[0] === ends[ends.length - 1]
      ? `Last ${days} days ending ${ends[0]}`
      : `Last ${days} days ending at each facility's last wager (${ends[0]} to ${ends[ends.length - 1]})`;
  }, [data, win]);

  const tested = rows.filter((r) => r.tested && pOf(r, met) != null);
  const flagged = useMemo(() => {
    const val: Record<SortKey, (r: BetTypeRow) => number | string> = {
      site: (r) => r.site, type: (r) => r.wager_name, dir: (r) => zOf(r, met) ?? 0, bets: (r) => r.bets,
      wag: (r) => r.wagered, rtp: (r) => (r.rtp ?? 0) - (r.theo_rtp ?? 0), hit: (r) => (r.hit_rate ?? 0) - (r.theo_hit ?? 0),
      z: (r) => Math.abs(zOf(r, met) ?? 0), p: (r) => pOf(r, met) ?? 1, bh: (r) => bhOf(r, met) ?? 1,
    };
    return rows
      .filter((r) => r.tested && (pOf(r, met) ?? 1) < 0.05)
      .sort((a, b) => {
        const x = val[sortKey](a), y = val[sortKey](b);
        return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
      });
  }, [rows, met, sortKey, sortDir]);
  const nBh = flagged.filter((r) => (bhOf(r, met) ?? 1) < 0.05).length;

  const activeKey = pinned ?? hover;
  const active = activeKey ? idx.get(activeKey) : undefined;

  const cell = (s: string, t: string) => {
    const k = `${s}|${t}`;
    const r = idx.get(k);
    if (!r) return <td key={k} className="h-9 w-12 text-center text-xs text-slate-600">.</td>;
    if (r.thin)
      return (
        <td key={k} onMouseEnter={() => setHover(k)} onClick={() => setPinned(pinned === k ? null : k)}
          className="h-9 w-12 cursor-pointer rounded text-center font-mono text-[11px] text-slate-600"
          style={{ background: 'repeating-linear-gradient(135deg, #1a1c30 0 4px, #13152a 4px 7px)' }}
          title={`${siteLabel(s)} ${t}: too little play`}>
          {fmtN(r.bets)}
        </td>
      );
    const z = zOf(r, met), p = pOf(r, met), bh = bhOf(r, met);
    const sig = bh != null && bh < 0.05;
    return (
      <td key={k} tabIndex={0} onMouseEnter={() => setHover(k)} onFocus={() => setHover(k)}
        onClick={() => setPinned(pinned === k ? null : k)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPinned(pinned === k ? null : k); } }}
        className={`relative h-9 w-12 cursor-pointer rounded text-center font-mono text-[11px] text-slate-100
          ${sig ? 'ring-2 ring-inset ring-orange-400' : ''} ${activeKey === k ? 'outline outline-2 outline-emerald-400' : ''}`}
        style={{ background: colour(z) }}
        aria-label={`${siteLabel(s)} ${t}: z ${fmtZ(z)}, p ${fmtP(p)}`}>
        {fmtPCell(p)}
        {p != null && p < 0.05 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-slate-100" />}
      </td>
    );
  };

  const row = (s: string) => (
    <tr key={s}>
      <th scope="row" title={s} className="whitespace-nowrap pr-3 text-right font-mono text-xs font-medium text-slate-300">
        {siteLabel(s)}
      </th>
      {TYPES.map((t) => cell(s, t))}
      <td className="w-2" />
      {cell(s, 'ALL')}
    </tr>
  );

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir(-sortDir);
    else { setSortKey(k); setSortDir(1); }
  };
  const cols: [SortKey, string][] = [['site', 'Facility'], ['type', 'Bet type'], ['dir', 'Direction'], ['bets', 'Bets'],
    ['wag', 'Wagered'], ['rtp', 'RTP vs theo'], ['hit', 'Hit rate vs theo'], ['z', 'z'], ['p', 'p raw'], ['bh', 'p BH']];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold text-slate-100">Roulette bet type p-values</h1>
          <p className="max-w-3xl text-sm text-slate-400">
            IBG IB_Roulette00_A (double-zero wheel) at 10 Kentucky facilities. Each cell is the two-sided p-value for
            what players won on one bet type versus the paytable. Rose means players ahead, blue means house ahead
            (|z| of 2 or more).
          </p>
        </div>
        <span className="group relative rounded-full border border-slate-700 bg-[#13152a] px-3 py-1 text-xs text-slate-300">
          Updated {toCdt(data.generated_at)}
          <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-72 rounded-lg border border-slate-700 bg-[#13152a] p-3 text-xs text-slate-400 shadow-xl group-hover:block">
            Rebuilt daily from clientwagers and roulettegamehistory on the Nxt server. Each window ends at the
            facility&apos;s latest wager.
          </span>
        </span>
      </header>

      <details className="group rounded-lg border border-slate-800 bg-[#13152a] px-5 py-3 text-sm text-slate-300">
        <summary className="cursor-pointer select-none font-semibold text-slate-200 list-none flex items-center gap-2">
          <span className="text-slate-500 group-open:rotate-90 transition-transform">▶</span>
          How to read this page
        </summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-200">What this page checks</p>
            <p>Every roulette bet type (red/black, a single number, a dozen, and so on) is designed to pay back a set percentage over time. This page checks, for each facility and bet type, whether players are winning noticeably <span className="font-semibold">more or less than the game is designed to pay</span>.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">How to read the grid</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Each square is one facility and one bet type.</li>
              <li><span className="text-rose-400 font-semibold">Rose</span>: players are ahead of what the game should pay.</li>
              <li><span className="text-sky-400 font-semibold">Blue</span>: the house is ahead of what it should be.</li>
              <li>Faint or no color: results are in the normal range.</li>
              <li><span className="text-orange-400 font-semibold">Orange ring</span>: the difference is big enough that it's very unlikely to be luck. These are the ones that matter.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Why some colored squares don&apos;t matter</p>
            <p>Roulette is random, so with this many squares, a few will always look unusual just by chance. The page accounts for that, and only squares with an <span className="text-orange-400 font-semibold">orange ring</span> hold up after that check. Those are what count toward the dashboard alert and Slack.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">The toggles</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">7d / 30d / All time</span>: how far back to look. Alerts use the last 7 days.</li>
              <li><span className="font-semibold">Dollar test</span>: compares money won to what should have been won.</li>
              <li><span className="font-semibold">Hit-rate test</span>: compares how often a bet wins to how often it should.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-200">What to do</p>
            <p>If a square has an orange ring, click it for details and flag the facility and bet type for review, since it may point to a wheel, paytable, or game setting issue. Gray squares had too little play to test yet.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">How often it updates</p>
            <p>Once a day. The "Updated" time at the top shows the last refresh.</p>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Seg value={win} options={WINDOWS} onChange={(v) => { setWin(v); setPinned(null); }} />
        <Seg value={met} options={METRICS} onChange={setMet} />
        <span className="font-mono text-xs text-slate-400">{rangeText}</span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-xl border border-slate-800 bg-[#13152a] p-4">
          <div className="overflow-x-auto" onMouseLeave={() => setHover(null)}>
            <table className="border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th />
                  {[...TYPES, '', 'All types'].map((t, i) =>
                    t === '' ? <td key={i} className="w-2" /> : (
                      <th key={t} scope="col" className="h-24 align-bottom pb-1.5 text-xs font-semibold text-slate-400">
                        <span className="inline-block rotate-180 whitespace-nowrap text-left [writing-mode:vertical-rl]">
                          {t}
                          {POCKETS[t] && <small className="block font-mono text-[10px] font-normal text-slate-500">{POCKETS[t]} pkt</small>}
                        </span>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {sites.map(row)}
                <tr><td colSpan={TYPES.length + 3} className="h-1.5" /></tr>
                {row('ALL SITES')}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-5 rounded-sm" style={{ background: COLD }} />House ahead</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-5 rounded-sm" style={{ background: MID }} />|z| under 2</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-5 rounded-sm" style={{ background: HOT }} />Players ahead</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-3.5 w-5 rounded-sm ring-2 ring-inset ring-orange-400" />Significant after Benjamini-Hochberg</span>
            <span>Dot: raw p under 0.05. Striped: under {data.min_exp_hits} expected hits, not tested.</span>
          </div>
        </section>

        <aside className="rounded-xl border border-slate-800 bg-[#13152a] p-4 text-sm" aria-live="polite">
          {active ? <Detail r={active} met={met} range={rangeText} minHits={data.min_exp_hits} nTests={tested.length} />
            : (
              <>
                <h2 className="mb-1 text-lg font-semibold text-slate-100">Cell detail</h2>
                <p className="text-slate-400">Hover or tap a cell to see bets, money, RTP and hit rate versus theory, and the raw
                  and adjusted p-values. Click a cell to pin it.</p>
              </>
            )}
        </aside>
      </div>

      <section className="rounded-xl border border-slate-800 bg-[#13152a] p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-100">
          Cells under p &lt; 0.05: {flagged.length} of {tested.length} tested ({(tested.length * 0.05).toFixed(1)} expected by
          chance), <span className={nBh ? 'text-orange-400' : 'text-emerald-400'}>{nBh} after Benjamini-Hochberg</span>
        </h3>
        {flagged.length === 0 ? (
          <p className="text-slate-500">No tested cell is under p &lt; 0.05 in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {cols.map(([k, l], i) => (
                    <th key={k} onClick={() => sortBy(k)} scope="col"
                      aria-sort={sortKey === k ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'}
                      className={`cursor-pointer select-none whitespace-nowrap border-b border-slate-800 px-2 py-2 font-semibold uppercase tracking-wide text-slate-500 ${i < 3 ? 'text-left' : 'text-right'}`}>
                      {l}{sortKey === k ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map((r) => {
                  const z = zOf(r, met) ?? 0;
                  return (
                    <tr key={`${r.site}|${r.wager_name}`} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="px-2 py-1.5">{siteLabel(r.site)}</td>
                      <td className="px-2 py-1.5">{r.wager_name}</td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${z > 0 ? 'bg-rose-400/20 text-rose-300' : 'bg-sky-400/20 text-sky-300'}`}>
                          {z > 0 ? 'Players ahead' : 'House ahead'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtN(r.bets)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt$(r.wagered)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtPct(r.rtp)} / {fmtPct(r.theo_rtp)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtPct(r.hit_rate)} / {fmtPct(r.theo_hit)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtZ(z)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtP(pOf(r, met))}</td>
                      <td className={`px-2 py-1.5 text-right font-mono ${(bhOf(r, met) ?? 1) < 0.05 ? 'text-orange-400' : ''}`}>{fmtP(bhOf(r, met))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid max-w-4xl gap-2 text-xs text-slate-500">
        <p><span className="font-semibold text-slate-400">Method.</span> Dollar test: per spin and bet type, the 38-pocket payout
          vector of all bets of that type gives the spin variance at 1/38 per pocket; variances add across spins, and z is
          (won minus expected) over the square root. Hit-rate test: exact two-sided binomial at k/38 (not run for mixed rows).</p>
        <p><span className="font-semibold text-slate-400">Multiple testing.</span> Benjamini-Hochberg across all tested facility
          by bet type cells in the selected window and test. Totals are context only.</p>
        <p><span className="font-semibold text-slate-400">Data.</span> clientwagers joined to roulettegamehistory on game_id.
          Money is credits times denomination. Unsettled bets (no credits_won) are excluded.</p>
      </section>
    </div>
  );
}

function Detail({ r, met, range, minHits, nTests }: { r: BetTypeRow; met: Metric; range: string; minHits: number; nTests: number }) {
  const p = pOf(r, met), bh = bhOf(r, met), z = zOf(r, met);
  let verdict: string;
  if (r.thin) verdict = `Too little play to test: ${r.exp_hits.toFixed(1)} expected hits (minimum ${minHits}).`;
  else if (!r.tested) verdict = 'Context row, not included in the multiple-testing adjustment.';
  else if (bh != null && bh < 0.05) verdict = `Significant after Benjamini-Hochberg (adjusted p ${fmtP(bh)}).`;
  else if (p != null && p < 0.05) verdict = `Raw p under 0.05, but not significant after adjusting for ${nTests} tests.`;
  else verdict = 'Consistent with the paytable.';
  const dir = (z ?? 0) > 0 ? 'players ahead' : (z ?? 0) < 0 ? 'house ahead' : 'on expectation';
  const items: [string, string][] = [
    ['Bets', fmtN(r.bets)], ['Spins', fmtN(r.spins)], ['Wagered', fmt$(r.wagered)], ['Won', fmt$(r.won)],
    ['Expected won', fmt$(r.expected)], ['Won vs expected', fmt$(r.net_vs_theo)], ['', ''],
    ['RTP', `${fmtPct(r.rtp)} vs ${fmtPct(r.theo_rtp)}`], ['Hit rate', `${fmtPct(r.hit_rate)} vs ${fmtPct(r.theo_hit)}`],
    ['Hits', `${fmtN(r.hits)} vs ${r.exp_hits.toFixed(1)}`], ['Mispaid bets', fmtN(r.mispaid)], ['', ''],
    ['Dollar z', fmtZ(r.z)], ['Dollar p (raw)', fmtP(r.p_usd)], ['Dollar p (BH)', fmtP(r.p_usd_bh)],
    ['Hit z', fmtZ(r.hit_z)], ['Hit p (raw)', fmtP(r.p_hits)], ['Hit p (BH)', fmtP(r.p_hits_bh)],
  ];
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-100">{r.wager_name === 'ALL' ? 'All bet types' : r.wager_name}</h2>
      <p className="mb-3 text-xs text-slate-400">{siteLabel(r.site)} &middot; {range}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {items.map(([k, v], i) =>
          k === '' ? <hr key={i} className="col-span-2 my-1 border-slate-800" /> : (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-mono text-xs text-slate-200">{v}</dd>
            </div>
          ))}
      </dl>
      <div className="mt-3 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
        {met === 'usd' ? 'Dollar outcome' : 'Hit rate'}: {dir}. {verdict}
      </div>
    </>
  );
}