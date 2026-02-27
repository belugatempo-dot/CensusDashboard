import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getAllStatesData, getAgeDistribution, getRaceData, getHistoricalPopulation } from './services/censusAPI';
import { useLanguage } from './i18n/useLanguage';

// Industry employment data (static - Census API doesn't provide this directly)
const industryDataKeys = [
  { key: 'healthcare', employment: 22.1, growth: 13.0 },
  { key: 'retail', employment: 15.2, growth: -2.1 },
  { key: 'professional', employment: 14.8, growth: 8.5 },
  { key: 'hospitality', employment: 13.5, growth: 5.2 },
  { key: 'manufacturing', employment: 12.9, growth: -1.5 },
  { key: 'construction', employment: 8.1, growth: 4.3 },
  { key: 'finance', employment: 7.2, growth: 3.8 },
  { key: 'tech', employment: 3.2, growth: 11.2 },
];

// Economic indicators radar chart data
const economicRadarDataKeys = [
  { key: 'gdpGrowth', A: 85, fullMark: 100 },
  { key: 'employment', A: 92, fullMark: 100 },
  { key: 'consumerConfidence', A: 78, fullMark: 100 },
  { key: 'housingMarket', A: 65, fullMark: 100 },
  { key: 'manufacturingPMI', A: 71, fullMark: 100 },
  { key: 'inflationControl', A: 68, fullMark: 100 },
];

// Census Bureau official color palette
const CENSUS_COLORS = ['#4472C4', '#5B9BD5', '#70AD47', '#FFC000', '#C55A11', '#9E480E', '#7030A0', '#ED7D31'];

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (num) => {
  return '$' + num.toLocaleString();
};

// Light theme tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ color: '#333', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '13px' }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 10000
              ? formatNumber(entry.value)
              : entry.value}
            {entry.name?.includes('增长') || entry.name?.includes('率') || entry.name?.toLowerCase().includes('growth') || entry.name?.toLowerCase().includes('rate') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Census Bureau style stat card with left border
const StatCard = ({ title, value, subtitle, difference, differenceLabel, color, trend }) => (
  <div style={{
    background: '#fff',
    borderRadius: '2px',
    borderLeft: `5px solid ${color}`,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    height: '100%',
    transition: 'box-shadow 0.2s ease',
  }}
  className="census-card"
  >
    <div style={{ marginBottom: '8px' }}>
      <p style={{ color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </p>
    </div>
    <div style={{ marginBottom: '8px' }}>
      <h3 style={{
        color: '#000',
        fontSize: '36px',
        fontWeight: '700',
        fontFamily: "'Arial', sans-serif",
        lineHeight: '1.2'
      }}>
        {value}
      </h3>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      {difference !== undefined && (
        <span style={{
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#666',
          fontSize: '16px',
          fontWeight: '700'
        }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'} {difference}
        </span>
      )}
      {differenceLabel && (
        <span style={{ color: '#666', fontSize: '11px', fontWeight: '600' }}>
          {differenceLabel}
        </span>
      )}
    </div>
    <div>
      <p style={{ color: '#888', fontSize: '11px' }}>{subtitle}</p>
    </div>
  </div>
);

// Census-style chart container
const ChartContainer = ({ title, subtitle, children }) => (
  <div style={{
    background: '#fff',
    borderRadius: '2px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    height: '100%',
  }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        color: '#000',
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '4px'
      }}>
        {title}
      </h3>
      {subtitle && <p style={{ color: '#666', fontSize: '12px' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// Main application
export default function CensusDashboard() {
  const { language, toggleLanguage, t } = useLanguage();

  // Translate static data based on current language
  const industryData = industryDataKeys.map(item => ({
    ...item,
    industry: t.industries[item.key]
  }));

  const economicRadarData = economicRadarDataKeys.map(item => ({
    ...item,
    subject: t.economic[item.key]
  }));

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedState, setSelectedState] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  // API data states
  const [statePopulationData, setStatePopulationData] = useState([]);
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [raceData, setRaceData] = useState([]);
  const [populationTrendData, setPopulationTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Translate race data based on current language
  const translatedRaceData = raceData.map(item => ({
    ...item,
    name: t.race[item.key]
  }));

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [activeTab]);

  // Fetch data from Census API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statesData, ageData, raceDataResult, historicalData] = await Promise.all([
          getAllStatesData(),
          getAgeDistribution(),
          getRaceData(),
          getHistoricalPopulation()
        ]);

        setStatePopulationData(statesData);
        setAgeDistributionData(ageData);
        setRaceData(raceDataResult);
        setPopulationTrendData(historicalData);
      } catch (err) {
        console.error('Failed to fetch Census data:', err);
        setError(t.error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', label: t.tabs.overview, icon: '📊' },
    { id: 'population', label: t.tabs.population, icon: '👥' },
    { id: 'economy', label: t.tabs.economy, icon: '💰' },
    { id: 'demographics', label: t.tabs.demographics, icon: '📈' },
  ];

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #ddd',
          borderTop: '4px solid #4472C4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#666', fontSize: '16px' }}>{t.loading}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #fee',
          borderRadius: '4px',
          padding: '32px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>{t.error.title}</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#4472C4',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t.error.reload}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: "'Arial', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#333',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .census-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .tab-button {
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          background: #e8e8e8 !important;
        }

        .data-row:hover {
          background: #f8f9fa !important;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in {
          animation: fadeInUp 0.3s ease forwards;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '3px solid #4472C4',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 12px',
              background: '#003C71',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
            }}>
              U.S. CENSUS BUREAU
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#000',
              }}>
                {t.title}
              </h1>
              <p style={{ color: '#666', fontSize: '11px' }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-button"
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #4472C4' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: activeTab === tab.id ? '#f8f9fa' : 'transparent',
                  color: activeTab === tab.id ? '#4472C4' : '#666',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={toggleLanguage}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #4472C4',
              borderRadius: '3px',
              color: '#4472C4',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }} key={animationKey}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <StatCard
                title={t.statCards.totalPopulation}
                value="336.0M"
                difference="0.5%"
                differenceLabel="vs 2023"
                subtitle={t.statCards.estimate2024}
                color="#4472C4"
                trend="up"
              />
              <StatCard
                title={t.statCards.medianIncome}
                value="$83,730"
                difference="2.1%"
                differenceLabel="vs 2023"
                subtitle={t.statCards.annualData}
                color="#5B9BD5"
                trend="up"
              />
              <StatCard
                title={t.statCards.unemploymentRate}
                value="3.9%"
                difference="0.3%"
                differenceLabel="vs Q3 2024"
                subtitle={t.statCards.quarterlyUpdate}
                color="#70AD47"
                trend="down"
              />
              <StatCard
                title={t.statCards.urbanization}
                value="84%"
                difference="0.8%"
                differenceLabel="vs 2023"
                subtitle={t.statCards.continuousGrowth}
                color="#FFC000"
                trend="up"
              />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <ChartContainer title={t.charts.stateRanking} subtitle={t.charts.censusSource}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={statePopulationData} layout="vertical" margin={{ left: 20, right: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" tickFormatter={formatNumber} stroke="#666" fontSize={11} />
                    <YAxis type="category" dataKey="abbr" stroke="#666" fontSize={11} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="population"
                      name={t.legend.population}
                      radius={[0, 4, 4, 0]}
                      fill="#4472C4"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.raceComposition} subtitle={t.charts.populationPercent}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={translatedRaceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                    >
                      {translatedRaceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CENSUS_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <ChartContainer title={t.charts.populationTrend} subtitle={t.charts.historicalData}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={populationTrendData}>
                    <defs>
                      <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B9BD5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5B9BD5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="population"
                      name={t.legend.populationMillions}
                      stroke="#5B9BD5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPop)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.economicHealth} subtitle={t.charts.fullScore}>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={economicRadarData}>
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="subject" stroke="#666" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" fontSize={10} />
                    <Radar
                      name={t.legend.year2024}
                      dataKey="A"
                      stroke="#70AD47"
                      fill="#70AD47"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Population Tab */}
        {activeTab === 'population' && (
          <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <ChartContainer title={t.charts.ageDistribution} subtitle={t.charts.byGender}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={ageDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="age" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="male" name={t.legend.male} fill="#4472C4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="female" name={t.legend.female} fill="#C55A11" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.urbanizationTrend} subtitle={t.charts.urbanPercent}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={populationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" stroke="#666" fontSize={11} />
                    <YAxis domain={[70, 90]} stroke="#666" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="urban"
                      name={t.legend.urbanizationRate}
                      stroke="#FFC000"
                      strokeWidth={3}
                      dot={{ fill: '#FFC000', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* State Details Table */}
            <ChartContainer title={t.charts.stateDetails} subtitle={t.charts.clickForMore}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#333', fontWeight: '700', fontSize: '12px' }}>{t.table.state}</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#333', fontWeight: '700', fontSize: '12px' }}>{t.table.population}</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#333', fontWeight: '700', fontSize: '12px' }}>{t.table.growthRate}</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#333', fontWeight: '700', fontSize: '12px' }}>{t.table.medianIncome}</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#333', fontWeight: '700', fontSize: '12px' }}>{t.table.unemploymentRate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statePopulationData.map((state, index) => (
                      <tr
                        key={state.abbr}
                        className="data-row"
                        style={{
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              background: CENSUS_COLORS[index % CENSUS_COLORS.length],
                              color: '#fff',
                              borderRadius: '2px',
                              fontWeight: '700',
                              fontSize: '11px'
                            }}>
                              {state.abbr}
                            </span>
                            <span style={{ color: '#333', fontWeight: '500', fontSize: '13px' }}>{state.state}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '13px' }}>
                          {formatNumber(state.population)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                          <span style={{
                            color: state.growth > 0 ? '#10b981' : '#ef4444',
                            fontWeight: '600'
                          }}>
                            {state.growth > 0 ? '+' : ''}{state.growth}%
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '13px' }}>
                          {formatCurrency(state.medianIncome)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '13px' }}>
                          {state.unemployment}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartContainer>
          </div>
        )}

        {/* Economy Tab */}
        {activeTab === 'economy' && (
          <div className="animate-in">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <StatCard
                title="GDP Total"
                value="$27.36T"
                difference="2.5%"
                differenceLabel="Annual Growth"
                subtitle="2024 Estimate"
                color="#4472C4"
                trend="up"
              />
              <StatCard
                title="Labor Force Participation"
                value="62.5%"
                difference="0.2%"
                differenceLabel="vs 2023"
                subtitle="Ages 16+"
                color="#70AD47"
                trend="up"
              />
              <StatCard
                title="CPI Inflation"
                value="2.9%"
                difference="1.2%"
                differenceLabel="vs 2023"
                subtitle="Year-over-Year"
                color="#C55A11"
                trend="down"
              />
              <StatCard
                title="Jobs Created"
                value="175K"
                difference="5.3%"
                differenceLabel="Monthly Avg"
                subtitle="Monthly Data"
                color="#5B9BD5"
                trend="up"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <ChartContainer title={t.charts.industryEmployment} subtitle={t.charts.employmentMillions}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={industryData} layout="vertical" margin={{ left: 70, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" stroke="#666" fontSize={11} />
                    <YAxis type="category" dataKey="industry" stroke="#666" fontSize={11} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="employment"
                      name={t.legend.employmentMillions}
                      radius={[0, 4, 4, 0]}
                    >
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CENSUS_COLORS[index % CENSUS_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.industryGrowth} subtitle={t.charts.next10Years}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={industryData} margin={{ bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="industry" stroke="#666" fontSize={10} angle={-45} textAnchor="end" />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="growth"
                      name={t.legend.forecastGrowth}
                      radius={[4, 4, 0, 0]}
                    >
                      {industryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.growth > 0 ? '#70AD47' : '#C55A11'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <ChartContainer title={t.charts.incomeComparison} subtitle={t.charts.medianIncomeUSD}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statePopulationData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="abbr"
                    stroke="#666"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={11}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="medianIncome"
                    name={t.legend.medianIncome}
                    radius={[4, 4, 0, 0]}
                    fill="#5B9BD5"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Demographics Tab */}
        {activeTab === 'demographics' && (
          <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <ChartContainer title={t.charts.raceDetails} subtitle={t.charts.populationPercent}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={translatedRaceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                    >
                      {translatedRaceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CENSUS_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.agePyramid} subtitle={t.charts.populationStructure}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={ageDistributionData.map(d => ({
                      ...d,
                      maleNeg: -d.male
                    }))}
                    layout="vertical"
                    margin={{ left: 20, right: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      type="number"
                      stroke="#666"
                      fontSize={11}
                      domain={[-30, 30]}
                    />
                    <YAxis
                      type="category"
                      dataKey="age"
                      stroke="#666"
                      fontSize={11}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="maleNeg" name={t.legend.male} fill="#4472C4" />
                    <Bar dataKey="female" name={t.legend.female} fill="#C55A11" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.keyIndicators} subtitle={t.charts.populationData2024}>
                <div style={{ padding: '12px' }}>
                  {[
                    { label: t.demographics.medianAge, value: `38.9 ${t.demographics.years}`, color: '#4472C4' },
                    { label: t.demographics.householdSize, value: `2.51 ${t.demographics.people}`, color: '#5B9BD5' },
                    { label: t.demographics.over65, value: '17.3%', color: '#70AD47' },
                    { label: t.demographics.under18, value: '21.7%', color: '#FFC000' },
                    { label: t.demographics.foreignBorn, value: '14.3%', color: '#C55A11' },
                    { label: t.demographics.collegeEducated, value: '33.7%', color: '#7030A0' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < 5 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '4px',
                          height: '20px',
                          background: item.color
                        }} />
                        <span style={{ color: '#333', fontSize: '13px', fontWeight: '500' }}>{item.label}</span>
                      </div>
                      <span style={{
                        color: '#000',
                        fontWeight: '700',
                        fontSize: '16px'
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <ChartContainer title={t.charts.populationChange} subtitle={t.charts.yearlyNewPop}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={populationTrendData.map((d, i, arr) => ({
                      ...d,
                      change: i > 0 ? (d.population - arr[i-1].population).toFixed(1) : 0
                    })).slice(1)}
                  >
                    <defs>
                      <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7030A0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7030A0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="change"
                      name={t.legend.newPopMillions}
                      stroke="#7030A0"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorChange)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title={t.charts.dataSources} subtitle={t.charts.censusDatasets}>
                <div style={{ padding: '12px' }}>
                  {[
                    { name: 'American Community Survey', year: '2024', color: '#4472C4' },
                    { name: 'Decennial Census', year: '2020', color: '#5B9BD5' },
                    { name: 'Population Estimates', year: '2024', color: '#70AD47' },
                    { name: 'Current Population Survey', year: '2024', color: '#FFC000' },
                    { name: 'County Business Patterns', year: '2023', color: '#C55A11' },
                  ].map((source, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        marginBottom: '6px',
                        background: '#f8f9fa',
                        borderLeft: `4px solid ${source.color}`,
                        borderRadius: '2px'
                      }}
                    >
                      <span style={{ color: '#333', fontSize: '12px', fontWeight: '500' }}>{source.name}</span>
                      <span style={{
                        color: '#666',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {source.year}
                      </span>
                    </div>
                  ))}
                  <a
                    href="https://data.census.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '10px',
                      marginTop: '12px',
                      background: '#4472C4',
                      borderRadius: '2px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    {t.sources.visit} →
                  </a>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #ddd',
        padding: '20px 32px',
        marginTop: '32px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#666'
        }}>
          <p>{t.footer.dataSource}</p>
          <p>{t.footer.builtWith}</p>
        </div>
      </footer>
    </div>
  );
}
