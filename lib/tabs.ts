export type TabStatus = 'ready' | 'needs-work' | 'blocked'

export type Tab = {
  slug: string
  icon: string
  title: string
  status: TabStatus
  goal: string
  dataSources: { label: string; value: string }[]
  requirements: { title: string; detail: string }[]
  displayDetails: string
  notes: string
  lastUpdated: string
}

export const tabs: Tab[] = [
  {
    slug: 'machine-counts',
    icon: '📊',
    title: 'Machine Counts',
    status: 'ready',
    goal: 'Machine counts by market.',
    dataSources: [
      { label: 'Primary Source', value: 'Data Warehouse (DW)' },
      { label: 'Availability', value: '✅ Available' },
      { label: 'Owner', value: '—' },
      { label: 'Priority', value: '—' },
    ],
    requirements: [],
    displayDetails: 'Breakdown of machine counts by facility, machine type, or status. Visualization format (table, tiles, chart) TBD.',
    notes: '',
    lastUpdated: '',
  },
  {
    slug: 'exacta-map',
    icon: '🗺️',
    title: 'Exacta Map',
    status: 'ready',
    lastUpdated: '',
    goal: 'Geographic overview of all Exacta properties.',
    dataSources: [{ label: 'Primary Source', value: 'Tableau' }],
    requirements: [],
    displayDetails: 'Facility locations by market with interactive map view.',
    notes: '',
  },
  {
    slug: 'low-pools',
    icon: '⚠️',
    title: 'Low Pools',
    status: 'needs-work',
    goal: 'Games with critically low pool balances.',
    dataSources: [
      { label: 'Primary Source', value: 'Pool Monitor' },
      { label: 'Availability', value: '✅ Available' },
      { label: 'Owner', value: '—' },
      { label: 'Priority', value: '—' },
    ],
    requirements: [
      { title: 'Acknowledgment feature', detail: 'Staff need a way to sign off on a warning so it stops cycling on the broadcast display. Needs a backend to store acknowledgment state.' },
      { title: 'Frequency tuning', detail: 'Configurable re-alert cadence for chronically low pools to avoid alert fatigue (e.g. suppress repeats within a 30-min or 1-hour window).' },
    ],
    displayDetails: 'List of games below the low-pool threshold. Fields: Game Name, Facility, Current Pool Balance, Threshold, Time in Low State, Acknowledged status.',
    notes: '',
    lastUpdated: '',
  },
  {
    slug: 'manual-handicapping-wins',
    icon: '🏆',
    title: 'Manual Handicapping Wins',
    status: 'ready',
    goal: 'Sites with active manual handicapping activity — sorted by payout %.',
    dataSources: [
      { label: 'Primary Source', value: 'Site Transactions Data' },
      { label: 'Availability', value: '✅ Available' },
      { label: 'Owner', value: '—' },
      { label: 'Priority', value: '—' },
    ],
    requirements: [],
    displayDetails: 'Facilities with notable manual handicapping win activity. Fields: Facility Name, Game, Win Amount, Handicap Applied, Date/Time, rolling daily total.',
    notes: '',
    lastUpdated: '',
  },
    {
    slug: 'daily-report-mismatch',
    icon: '🗂️',
    title: 'Mismatch Reports',
    status: 'needs-work',
    goal: 'Facility daily reports where handle variance is inconsistent with the source system.',
    dataSources: [
      { label: 'Primary Source', value: 'To be confirmed ⚠️' },
      { label: 'Availability', value: '⚠️ TBD' },
      { label: 'Owner', value: '—' },
      { label: 'Priority', value: '—' },
    ],
    requirements: [
      { title: 'Data source confirmation', detail: 'Source for facility daily reports not yet confirmed. Candidates: reporting database, file ingestion pipeline, or facility API.' },
      { title: 'Mismatch logic', detail: 'Need agreement on which fields are compared and what constitutes a meaningful mismatch (absolute threshold vs. % delta).' },
    ],
    displayDetails: 'Facilities with report mismatches for the current day. Fields: Facility Name, Report Total, Database Total, Delta, Delta %, Mismatch Type.',
    notes: '',
    lastUpdated: '',
  },
  {
    slug: 'payout-pct-std-deviations',
    icon: '📉',
    title: 'Payout % with Std. Deviations',
    status: 'ready',
    goal: 'Show payout percentage standard deviations for every game and denomination to catch games performing outside expected variance.',
    dataSources: [
      { label: 'Play Data', value: 'Data Warehouse (DW)' },
      { label: 'Variance Data', value: 'MDF Manager' },
      { label: 'Availability', value: '✅ Available' },
      { label: 'Owner', value: '—' },
    ],
    requirements: [],
    displayDetails: 'Ranked list sorted by deviation from expected payout %. Fields: Game, Denomination, Expected Payout %, Actual Payout %, Std. Deviation, sigma indicator.',
    notes: '',
    lastUpdated: '',
  },
  {
    slug: 'dwp-expectation-by-group',
    icon: '🎯',
    title: 'DWP Expectation by Group',
    status: 'needs-work',
    goal: 'Verify that Dynamic Wager Profile games are performing in line with their MDF expectations, broken down by group.',
    dataSources: [
      { label: 'Expectation & Variance', value: 'MDF Manager' },
      { label: 'Group Data', value: 'Wager Audits only ⚠️' },
      { label: 'Availability', value: '⚠️ Partial' },
      { label: 'Owner', value: '—' },
    ],
    requirements: [
      { title: 'Group data source', detail: 'Group data only exists inside Wager Audits and is not reliably queryable. Options: export to DW, create a dedicated API endpoint, or a scheduled extract from Wager Audits.' },
    ],
    displayDetails: 'DWP performance vs. MDF expectation by group. Fields: Group Name, Game, Expected Return %, Actual Return %, Delta, pass/fail indicator.',
    notes: '',
    lastUpdated: '',
  },
  {
    slug: 'prize-downgrades',
    icon: '🔻',
    title: 'Prize Downgrades',
    status: 'blocked',
    goal: 'Alert immediately on any prize downgrade event. High-urgency — staff need to be notified in real time to handle payout discrepancies.',
    dataSources: [
      { label: 'Primary Source', value: 'Not yet available ❌' },
      { label: 'Availability', value: '❌ Blocked' },
      { label: 'Owner', value: '—' },
      { label: 'Priority', value: '—' },
    ],
    requirements: [
      { title: 'Database events not written', detail: 'Prize downgrade events are not currently being written to any database. Dev team needs to instrument the system before this tab can be built.' },
    ],
    displayDetails: 'When unblocked: live alert feed of downgrade events. Fields: Event Time, Facility, Game, Original Prize, Downgraded Prize, Acknowledged status.',
    notes: 'Track the dev ticket for database instrumentation here once created.',
    lastUpdated: '',
  },
]