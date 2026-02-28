# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a U.S. Census data visualization dashboard built with React and Recharts. The application integrates with the Census Bureau API to display real-time demographic, population, and economic data through interactive charts and visualizations. It features bilingual support (English/Chinese) with a language toggle.

## Architecture

### Component Structure

- **src/CensusDashboard.jsx**: Main dashboard component with tab navigation, chart rendering, and bilingual UI
- **src/services/censusAPI.js**: Census Bureau API integration layer with all data fetching functions
- **src/i18n/translations.js**: Bilingual translations for all UI text (English and Chinese)
- **src/i18n/useLanguage.js**: Custom React hook for language switching with localStorage persistence
- **src/main.jsx**: React application entry point

### Internationalization (i18n) System

The application uses a custom i18n implementation:

- **Language Hook**: `useLanguage()` hook provides `language`, `setLanguage()`, `toggleLanguage()`, and `t` (translations object)
- **Persistence**: Language preference is stored in localStorage
- **Supported Languages**: English (`en`) and Chinese (`zh`)
- **Usage Pattern**: Components access translations via `const { language, toggleLanguage, t } = useLanguage()`
- **Translation Structure**: Organized by sections (header, tabs, statCards, charts, table, race, industries, economic, demographics, sources, footer, loading, error, axis)

### API Integration

The application fetches real-time data from the U.S. Census Bureau API using **ACS 1-year estimates (2024)**:

**Key API Functions** (`src/services/censusAPI.js`):
- `getStatePopulation()`: Fetch all state population data from ACS 2024
- `getACSData(stateCode)`: Get ACS data (median income) for specific state
- `getAgeDistribution()`: Retrieve age/sex distribution using detailed table B01001
- `getRaceData()`: Get race and ethnicity percentages from demographic profile DP05
- `getAllStatesData()`: Combined state data with enrichment (population + ACS data)

**API Design Patterns**:
- `buildURL(endpoint, params)`: Helper to construct Census API URLs with automatic API key injection
- `fetchAPI(url)`: Wrapper with error handling and JSON parsing
- All API responses transform from Census format `[headers, ...rows]` to JavaScript objects

**Data Sources**:
- ACS 1-Year Estimates 2024 (`/data/2024/acs/acs1`): Primary data source for population and income
- Detailed Tables (B01001): Age and sex distribution
- Demographic Profile (DP05): Race and ethnicity data

### Data Flow

1. Component mounts → `useEffect` in CensusDashboard.jsx triggers
2. API functions called via `Promise.all` for parallel data fetching
3. Data transformed and stored in component state
4. Loading/error states managed with dedicated UI (bilingual error messages)
5. Charts render using state data with language-aware labels

### State Management

React `useState` hooks manage:
- `language`: Current UI language (en/zh) via `useLanguage` hook
- `activeTab`: Current navigation tab (Overview, Population, Economy, Demographics)
- `statePopulationData`: Top 10 states from Census API
- `ageDistributionData`: Age distribution from API
- `raceData`: Race composition from API
- `loading`: Boolean for loading state
- `error`: Error message string
- `selectedState`: Selected state from table (currently unused)
- `animationKey`: Triggers re-animation on tab changes

**Static Data** (not from Census API):
- `industryData`: Employment by industry (Census API doesn't provide directly)
- `populationTrendData`: Historical population 1950-2024
- `economicRadarData`: Economic health indicators

## Development Commands

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```
Server starts at `http://localhost:3000` and auto-opens browser.

### Build for production
```bash
npm run build
```
Output to `dist/` directory.

### Preview production build
```bash
npm run preview
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

**Test Files**:
- `src/services/__tests__/censusAPI.test.js`: API integration tests (data fetching, transformations, error handling, URL building)
- `src/__tests__/CensusDashboard.test.jsx`: Component tests (loading states, error states, data rendering, tab switching, accessibility)

**Test Configuration**:
- Framework: Vitest with happy-dom environment
- Setup file: `src/test/setup.js` (configures Testing Library and global test utilities)
- Coverage provider: v8 with text, JSON, and HTML reporters

## Environment Configuration

**Optional**: Create `.env.local` file for Census API key:

1. Copy `.env.example` to `.env.local`
2. Get API key from https://api.census.gov/data/key_signup.html
3. Add to `.env.local`: `VITE_CENSUS_API_KEY=your_key_here`

**Note**: App works without API key but has rate limits (500 requests/day per IP). With API key, unlimited requests with rate limiting. The app uses `.env.local` (gitignored) instead of `.env` to avoid committing credentials.

## Styling Approach

- Uses inline styles exclusively (no separate CSS files)
- Dark theme with gradient backgrounds
- Embedded `<style>` tag in main component for:
  - Global resets
  - Hover animations (table rows, cards, nav items)
  - Keyframe animations (fadeInUp, pulse)
  - Custom scrollbar styling
- Typography: Google Fonts Inter (UI) and JetBrains Mono (monospace numbers)

## Key Technical Details

- **Color Palette**: COLORS array defined in CensusDashboard.jsx, used cyclically for charts
- **Number Formatting**: Custom formatters for large numbers (K/M suffix) and currency
- **Responsive Charts**: All charts use ResponsiveContainer from Recharts
- **Bilingual UI**: Complete English/Chinese support with language toggle button in header
- **Chart Library**: Recharts v2.x API (XAxis, YAxis, Tooltip, Legend, CartesianGrid, etc.)
- **Build Tool**: Vite 6 with React plugin
- **Server Config**: Dev server runs on port 3000 with auto-open enabled (see vite.config.js)

## Census API Notes

- API uses 2024 ACS 1-year estimates (most recent available)
- API responses follow pattern: `[[headers], [row1], [row2], ...]`
- All data must be transformed from Census format to application format
- Some data (unemployment rate, industry employment) uses fallback/static values when not available in 1-year estimates
- Rate limits: 500/day without key, unlimited with key (but rate-limited per second)
