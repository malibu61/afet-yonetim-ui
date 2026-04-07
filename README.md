# README — Web UI (`afet-yonetim-ui`)

This is the “AFETWATCH” map-focused frontend, built with React 19 and Next.js 16 (App Router under `src/app`). The home page loads earthquake data from the .NET API (`GET api/Deprem`) with refresh/retry on error. Mapbox GL is loaded on the client only with `dynamic(..., { ssr: false })` because it is heavy. `MapViewTabs` switches between two views: recent earthquakes on the map, and a Turkey province risk map fed by API coordinates and risk data (`RiskHaritasi` and related fetches, including AI-assisted summary when used). The API base URL is in `src/constants/api.js` as `NEXT_PUBLIC_API_BASE_URL`; if unset, it defaults to **https://localhost:7232** to match the .NET HTTPS dev port.

Install with `npm install`, dev server with `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`). Open [http://localhost:3000](http://localhost:3000). Production: `npm run build` then `npm run start`. Lint: `npm run lint`. Put `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env.local`; the token is visible in the browser, so use a restricted public token. The backend must run separately (.NET on 7232 / 5108). Opening only the UI will not fill data unless Kafka, consumers, and optionally Python jobs are running too.

In short: this app shows earthquakes and risks on a map; it talks to the .NET API and needs Mapbox env vars.
