# Architecture Overview

OmniSales Regional Analytics is an executive sales intelligence platform designed to ingest raw sales transaction datasets, automatically detect and resolve human input errors (such as inconsistent regional naming and formatting defects), and transform complex order records into intuitive quarter-over-quarter revenue comparisons across geographic territories. Commercial leaders and analysts can filter metrics dynamically by sales channel and product category, inspect visual revenue bar charts and detailed audit tables, review automated data-cleaning logs, and generate concise, mathematically grounded three-sentence executive summaries identifying the primary regional revenue drivers between Q2 and Q3.

## File Registry

| File Path | Description |
| :--- | :--- |
| `.env.example` | Documents required environment variables including the server port and optional Gemini API credentials for executive summary generation. |
| `.gitignore` | Prevents local development artifacts, build bundles, dependency folders, and temporary files from being tracked in version control. |
| `ARCHITECTURE.md` | Provides a high-level executive overview of the platform's commercial purpose and an exhaustive single-sentence inventory of every file in the project. |
| `index.html` | Defines the root HTML entry point, browser viewport metadata, and OpenGraph social preview tags that host the single-page application. |
| `metadata.json` | Configures the application identity, description, and server-side Gemini AI capability permissions for the hosting runtime environment. |
| `package.json` | Declares all third-party dependencies, project metadata, and lifecycle commands used to develop, build, start, and lint the application. |
| `public/assets/aistudio/Lab_1_-_Regional_Sales_de1de499.csv` | Serves as the preloaded benchmark regional sales order CSV dataset for immediate analysis upon application launch. |
| `server.ts` | Implements an Express backend that mounts Vite middlewares in development, serves static assets in production, and provides the `/api/summarize-q2-q3` AI executive summary endpoint with deterministic calculation fallbacks. |
| `src/App.tsx` | Functions as the master frontend orchestrator by managing dataset state, active filters, data cleaning toggles, calculation pipelines, and core layout views. |
| `src/components/AiSummaryCard.tsx` | Renders the executive three-sentence Q2-to-Q3 performance summary alongside verified financial metrics, confidence indicators, and re-generation controls. |
| `src/components/CsvUploader.tsx` | Provides an interactive drag-and-drop file upload zone enabling users to load custom sales order spreadsheets or switch to bundled sample datasets. |
| `src/components/DataCleaningModal.tsx` | Displays an audit dialog revealing which erroneous records were normalized, detailing human typo corrections and merged regional names. |
| `src/components/RawDataDrawer.tsx` | Offers an expandable slide-out data inspector allowing analysts to search, paginate, and audit raw transaction rows and field values. |
| `src/components/RevenueChart.tsx` | Renders comparative horizontal revenue bar charts illustrating quarter-over-quarter dollar performance and percentage changes across all regions. |
| `src/components/RevenueTable.tsx` | Presents a sortable financial ledger displaying Q2 and Q3 revenue, unit counts, dollar variations, percentage growth, and top product drivers per territory. |
| `src/index.css` | Imports Tailwind CSS to establish global responsive typography, utility classes, and styling themes across the user interface. |
| `src/main.tsx` | Mounts the root React component tree into the browser Document Object Model. |
| `src/types.ts` | Defines TypeScript interfaces and data models for sales orders, calculation payloads, regional metrics, filter criteria, and AI summary structures. |
| `src/utils/calculations.ts` | Implements rigorous financial mathematics to aggregate regional quarterly revenue, compute percentage shifts, identify top product and channel drivers, and format currency. |
| `src/utils/csvParser.ts` | Parses raw CSV text into structured sales order objects while validating schemas, detecting delimiters, and applying optional automated data cleansing. |
| `src/utils/dataCleaner.ts` | Inspects incoming rows for casing inconsistencies, whitespace issues, and regional synonyms to standardize entries into verified geographical territories. |
| `src/utils/sampleData.ts` | Supplies fallback enterprise technology sales records and fetches the default Lab 1 CSV asset for instant demonstration. |
| `tsconfig.json` | Configures TypeScript compiler settings, path aliases, type resolution rules, and strict syntax validation parameters. |
| `vite.config.ts` | Defines Vite build rules, React and Tailwind plugins, path alias mappings, and development server execution flags. |
