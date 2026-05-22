import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    TABLEAU_HOST: process.env.TABLEAU_HOST,
    TABLEAU_PAT_NAME: process.env.TABLEAU_PAT_NAME,
    TABLEAU_PAT_SECRET: process.env.TABLEAU_PAT_SECRET,
    TABLEAU_SITE_CONTENT_URL: process.env.TABLEAU_SITE_CONTENT_URL,
    TABLEAU_REPORT_COMPS_VIEW_ID: process.env.TABLEAU_REPORT_COMPS_VIEW_ID,
    TABLEAU_MACHINE_COUNT_VIEW_ID: process.env.TABLEAU_MACHINE_COUNT_VIEW_ID,
    TABLEAU_MAP_VIEW_ID: process.env.TABLEAU_MAP_VIEW_ID,
    EXACTA_API_BASE_URL: process.env.EXACTA_API_BASE_URL,
    EXACTA_API_KEY: process.env.EXACTA_API_KEY,
  },
}

export default nextConfig