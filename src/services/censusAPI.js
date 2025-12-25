/**
 * Census Bureau API Integration
 * Documentation: https://www.census.gov/data/developers/guidance/api-user-guide.html
 */

const API_BASE = 'https://api.census.gov/data';
const API_KEY = import.meta.env.VITE_CENSUS_API_KEY || '';

// Helper function to build API URL
const buildURL = (endpoint, params) => {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  if (API_KEY) {
    url.searchParams.append('key', API_KEY);
  }
  return url.toString();
};

// Fetch wrapper with error handling
const fetchAPI = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Census API Error:', error);
    throw error;
  }
};

/**
 * Get state population data from Population Estimates Program (PEP)
 * Uses 2023 vintage data
 */
export const getStatePopulation = async () => {
  const url = buildURL('/2023/pep/population', {
    get: 'POP_2023,NAME',
    for: 'state:*'
  });

  const data = await fetchAPI(url);

  // Transform API response to our format
  // First row is headers, skip it
  const [headers, ...rows] = data;

  return rows.map(row => ({
    state: row[1], // NAME
    population: parseInt(row[0]), // POP_2023
    stateCode: row[2] // state code
  }));
};

/**
 * Get American Community Survey (ACS) 5-Year data
 * Includes income, unemployment, and demographic data
 */
export const getACSData = async (stateCode) => {
  // Get median household income (B19013_001E)
  // Get unemployment rate (DP03_0005PE)
  const url = buildURL('/2022/acs/acs5', {
    get: 'NAME,B19013_001E,DP03_0005PE',
    for: `state:${stateCode}`
  });

  const data = await fetchAPI(url);
  const [headers, ...rows] = data;

  if (rows.length === 0) return null;

  return {
    medianIncome: parseInt(rows[0][1]) || 0,
    unemployment: parseFloat(rows[0][2]) || 0
  };
};

/**
 * Get age and sex distribution
 * Using ACS detailed tables
 */
export const getAgeDistribution = async () => {
  // Get age groups by sex
  // B01001_003E through B01001_025E for males
  // B01001_027E through B01001_049E for females
  const maleVars = [
    'B01001_003E', 'B01001_004E', 'B01001_005E', 'B01001_006E', // 0-4, 5-9, 10-14, 15-17
    'B01001_007E', 'B01001_008E', 'B01001_009E', 'B01001_010E', // 18-19, 20, 21, 22-24
    'B01001_011E', 'B01001_012E', // 25-29, 30-34
    'B01001_013E', 'B01001_014E', // 35-39, 40-44
    'B01001_015E', 'B01001_016E', // 45-49, 50-54
    'B01001_017E', 'B01001_018E', // 55-59, 60-61
    'B01001_019E', 'B01001_020E', 'B01001_021E', // 62-64, 65-66, 67-69
    'B01001_022E', 'B01001_023E', 'B01001_024E', 'B01001_025E' // 70-74, 75-79, 80-84, 85+
  ];

  const femaleVars = [
    'B01001_027E', 'B01001_028E', 'B01001_029E', 'B01001_030E',
    'B01001_031E', 'B01001_032E', 'B01001_033E', 'B01001_034E',
    'B01001_035E', 'B01001_036E',
    'B01001_037E', 'B01001_038E',
    'B01001_039E', 'B01001_040E',
    'B01001_041E', 'B01001_042E',
    'B01001_043E', 'B01001_044E', 'B01001_045E',
    'B01001_046E', 'B01001_047E', 'B01001_048E', 'B01001_049E'
  ];

  const url = buildURL('/2022/acs/acs5', {
    get: `NAME,${[...maleVars, ...femaleVars].join(',')}`,
    for: 'us:1'
  });

  const data = await fetchAPI(url);
  const [headers, row] = data;

  // Aggregate into age groups matching our UI
  const ageGroups = [
    { age: '0-4', maleIdx: [0, 1], femaleIdx: [0, 1] },
    { age: '5-17', maleIdx: [1, 2, 3], femaleIdx: [1, 2, 3] },
    { age: '18-24', maleIdx: [4, 5, 6, 7], femaleIdx: [4, 5, 6, 7] },
    { age: '25-34', maleIdx: [8, 9], femaleIdx: [8, 9] },
    { age: '35-44', maleIdx: [10, 11], femaleIdx: [10, 11] },
    { age: '45-54', maleIdx: [12, 13], femaleIdx: [12, 13] },
    { age: '55-64', maleIdx: [14, 15, 16], femaleIdx: [14, 15, 16] },
    { age: '65-74', maleIdx: [17, 18, 19], femaleIdx: [17, 18, 19] },
    { age: '75+', maleIdx: [20, 21, 22, 23], femaleIdx: [20, 21, 22, 23] }
  ];

  return ageGroups.map(group => {
    const male = group.maleIdx.reduce((sum, idx) =>
      sum + (parseInt(row[idx + 1]) || 0), 0) / 1000000;
    const female = group.femaleIdx.reduce((sum, idx) =>
      sum + (parseInt(row[idx + maleVars.length + 1]) || 0), 0) / 1000000;

    return {
      age: group.age,
      male: parseFloat(male.toFixed(1)),
      female: parseFloat(female.toFixed(1)),
      total: parseFloat((male + female).toFixed(1))
    };
  });
};

/**
 * Get race and ethnicity data
 * Using ACS demographic profile
 */
export const getRaceData = async () => {
  const url = buildURL('/2022/acs/acs5/profile', {
    get: 'NAME,DP05_0077PE,DP05_0071PE,DP05_0078PE,DP05_0080PE',
    for: 'us:1'
  });

  const data = await fetchAPI(url);
  const [headers, row] = data;

  const hispanicPct = parseFloat(row[1]) || 0;
  const whitePct = parseFloat(row[2]) || 0;
  const blackPct = parseFloat(row[3]) || 0;
  const asianPct = parseFloat(row[4]) || 0;
  const otherPct = 100 - (hispanicPct + whitePct + blackPct + asianPct);

  return [
    { name: '白人', value: parseFloat(whitePct.toFixed(1)), color: '#3b82f6' },
    { name: '拉丁裔', value: parseFloat(hispanicPct.toFixed(1)), color: '#f59e0b' },
    { name: '非裔', value: parseFloat(blackPct.toFixed(1)), color: '#10b981' },
    { name: '亚裔', value: parseFloat(asianPct.toFixed(1)), color: '#ef4444' },
    { name: '其他', value: parseFloat(otherPct.toFixed(1)), color: '#8b5cf6' }
  ];
};

/**
 * Get all state data with combined information
 * This combines population estimates with ACS data
 */
export const getAllStatesData = async () => {
  const popData = await getStatePopulation();

  // Get top 10 states by population
  const top10 = popData
    .sort((a, b) => b.population - a.population)
    .slice(0, 10);

  // Enrich with ACS data
  const enriched = await Promise.all(
    top10.map(async (state) => {
      try {
        const acsData = await getACSData(state.stateCode);

        // State abbreviations mapping
        const abbrs = {
          'California': 'CA', 'Texas': 'TX', 'Florida': 'FL',
          'New York': 'NY', 'Pennsylvania': 'PA', 'Illinois': 'IL',
          'Ohio': 'OH', 'Georgia': 'GA', 'North Carolina': 'NC',
          'Michigan': 'MI', 'New Jersey': 'NJ', 'Virginia': 'VA',
          'Washington': 'WA', 'Arizona': 'AZ', 'Massachusetts': 'MA',
          'Tennessee': 'TN', 'Indiana': 'IN', 'Maryland': 'MD',
          'Missouri': 'MO', 'Wisconsin': 'WI'
        };

        return {
          state: state.state,
          abbr: abbrs[state.state] || state.state.substring(0, 2).toUpperCase(),
          population: state.population,
          growth: 0.5, // Note: Growth calculation would need historical data
          medianIncome: acsData?.medianIncome || 0,
          unemployment: acsData?.unemployment || 0
        };
      } catch (error) {
        console.error(`Error fetching ACS data for ${state.state}:`, error);
        return {
          state: state.state,
          abbr: state.state.substring(0, 2).toUpperCase(),
          population: state.population,
          growth: 0,
          medianIncome: 0,
          unemployment: 0
        };
      }
    })
  );

  return enriched;
};
