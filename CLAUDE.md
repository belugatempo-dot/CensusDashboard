# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a U.S. Census data visualization dashboard built with React and Recharts. The application integrates with the Census Bureau API to display real-time demographic, population, and economic data through interactive charts and visualizations.

## Architecture

### Component Structure

- **src/CensusDashboard.jsx**: Main dashboard component with tab navigation and chart rendering
- **src/services/censusAPI.js**: Census Bureau API integration layer
- **src/main.jsx**: React application entry point

### API Integration

The application fetches real-time data from the U.S. Census Bureau API:

**Endpoints Used**:
- Population Estimates Program (PEP) 2023: State population data
- American Community Survey (ACS) 2022: Income, unemployment, demographics
- Detailed Tables (B01001): Age and sex distribution
- Demographic Profile (DP05): Race and ethnicity data

**API Functions** (`src/services/censusAPI.js`):
- `getStatePopulation()`: Fetch all state population data
- `getACSData(stateCode)`: Get ACS data for specific state
- `getAgeDistribution()`: Retrieve age/sex distribution
- `getRaceData()`: Get race and ethnicity percentages
- `getAllStatesData()`: Combined state data with enrichment

### Data Flow

1. Component mounts → triggers `useEffect` in CensusDashboard.jsx
2. API functions called via `Promise.all` for parallel fetching
3. Data stored in component state (statePopulationData, ageDistributionData, raceData)
4. Loading/error states managed with dedicated UI
5. Charts render using state data

### State Management

React useState hooks manage:
- `activeTab`: Current navigation tab (Overview, Population, Economy, Demographics)
- `statePopulationData`: Top 10 states from API
- `ageDistributionData`: Age distribution from API
- `raceData`: Race composition from API
- `loading`: Boolean for loading state
- `error`: Error message string
- `selectedState`: Selected state from table
- `animationKey`: Triggers re-animation on tab changes

**Static Data** (not from API):
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

## Environment Configuration

**Required**: Create `.env` file for Census API key:

1. Copy `.env.example` to `.env`
2. Get API key from https://api.census.gov/data/key_signup.html
3. Add to `.env`: `VITE_CENSUS_API_KEY=your_key_here`

**Note**: App works without API key but has request limits (500/day per IP).

## Styling

- Uses inline styles exclusively (no CSS files)
- Implements a dark theme with gradient backgrounds
- Includes embedded `<style>` tag for:
  - Global resets
  - Hover animations
  - Keyframe animations (fadeInUp, pulse)
  - Custom scrollbar styling
- Google Fonts: Inter (UI) and JetBrains Mono (monospace numbers)

## Key Technical Details

- **Color Palette**: Defined in COLORS array, used cyclically for charts
- **Number Formatting**: Custom formatters for large numbers (K/M suffix) and currency
- **Responsive Charts**: All charts use ResponsiveContainer from Recharts
- **Chinese Language**: UI labels are in Chinese (中文)
- **Chart Library**: Recharts v2.x API (XAxis, YAxis, Tooltip, Legend, etc.)

## Future Considerations

- No external data source integration (all data is static)
- No routing (tab switching is state-based)
- No API calls or backend
- Table row clicks set `selectedState` but don't trigger any UI changes
- Could benefit from:
  - Build configuration (package.json, vite.config.js)
  - Component file splitting
  - Separate data files
  - TypeScript for type safety
  - External CSS or CSS modules
