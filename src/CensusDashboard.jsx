import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getAllStatesData, getAgeDistribution, getRaceData } from './services/censusAPI';
import { useLanguage } from './i18n/useLanguage';

// 行业就业数据 (保持静态数据 - Census API 没有直接提供此数据)
const industryData = [
  { industry: '医疗保健', employment: 22.1, growth: 13.0 },
  { industry: '零售贸易', employment: 15.2, growth: -2.1 },
  { industry: '专业服务', employment: 14.8, growth: 8.5 },
  { industry: '住宿餐饮', employment: 13.5, growth: 5.2 },
  { industry: '制造业', employment: 12.9, growth: -1.5 },
  { industry: '建筑业', employment: 8.1, growth: 4.3 },
  { industry: '金融保险', employment: 7.2, growth: 3.8 },
  { industry: '信息技术', employment: 3.2, growth: 11.2 },
];

// 历史人口趋势 (保持静态数据 - 历史数据)
const populationTrendData = [
  { year: '1950', population: 151.3, urban: 64 },
  { year: '1960', population: 179.3, urban: 70 },
  { year: '1970', population: 203.2, urban: 74 },
  { year: '1980', population: 226.5, urban: 74 },
  { year: '1990', population: 248.7, urban: 75 },
  { year: '2000', population: 281.4, urban: 79 },
  { year: '2010', population: 308.7, urban: 81 },
  { year: '2020', population: 331.4, urban: 83 },
  { year: '2024', population: 336.0, urban: 84 },
];

// 经济指标雷达图数据
const economicRadarData = [
  { subject: 'GDP增长', A: 85, fullMark: 100 },
  { subject: '就业率', A: 92, fullMark: 100 },
  { subject: '消费信心', A: 78, fullMark: 100 },
  { subject: '房产市场', A: 65, fullMark: 100 },
  { subject: '制造业PMI', A: 71, fullMark: 100 },
  { subject: '通胀控制', A: 68, fullMark: 100 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (num) => {
  return '$' + num.toLocaleString();
};

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '14px' }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 10000 
              ? formatNumber(entry.value) 
              : entry.value}
            {entry.name?.includes('增长') || entry.name?.includes('率') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 统计卡片组件
const StatCard = ({ title, value, subtitle, trend, icon }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  }}
  className="stat-card"
  >
    <div style={{
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '100px',
      height: '100px',
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      borderRadius: '50%',
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {title}
        </p>
        <h3 style={{ 
          color: '#f1f5f9', 
          fontSize: '32px', 
          fontWeight: '700', 
          marginBottom: '4px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {value}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {trend && (
            <span style={{ 
              color: trend > 0 ? '#10b981' : '#ef4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: '13px' }}>{subtitle}</span>
        </div>
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
    </div>
  </div>
);

// 图表容器组件
const ChartContainer = ({ title, children, subtitle }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    height: '100%',
  }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ 
        color: '#f1f5f9', 
        fontSize: '18px', 
        fontWeight: '600',
        marginBottom: '4px'
      }}>
        {title}
      </h3>
      {subtitle && <p style={{ color: '#64748b', fontSize: '13px' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// 主应用
export default function CensusDashboard() {
  // Language support
  const { language, toggleLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedState, setSelectedState] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  // API data states
  const [statePopulationData, setStatePopulationData] = useState([]);
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [raceData, setRaceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [activeTab]);

  // Fetch data from Census API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statesData, ageData, raceDataResult] = await Promise.all([
          getAllStatesData(),
          getAgeDistribution(),
          getRaceData()
        ]);

        setStatePopulationData(statesData);
        setAgeDistributionData(ageData);
        setRaceData(raceDataResult);
      } catch (err) {
        console.error('Failed to fetch Census data:', err);
        setError('无法加载 Census 数据。请检查 API 密钥配置或稍后重试。');
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>{t.loading}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>{t.error.title}</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>{t.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e2e8f0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15);
        }
        
        .tab-button {
          transition: all 0.3s ease;
        }
        
        .tab-button:hover {
          background: rgba(59, 130, 246, 0.15) !important;
        }
        
        .data-row:hover {
          background: rgba(59, 130, 246, 0.1) !important;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-in {
          animation: fadeInUp 0.5s ease forwards;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
            }}>
              🇺🇸
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(90deg, #f1f5f9 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {t.title}
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.5)', padding: '6px', borderRadius: '12px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-button"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#94a3b8',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              style={{
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              }}
            >
              {language === 'en' ? '中文' : 'English'}
            </button>

            <span style={{
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              {t.realTimeData}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }} key={animationKey}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard 
                title="美国总人口" 
                value="336.0M" 
                subtitle="2024年估计"
                trend={0.5}
                icon="👥"
              />
              <StatCard 
                title="家庭收入中位数" 
                value="$83,730" 
                subtitle="年度数据"
                trend={2.1}
                icon="💵"
              />
              <StatCard 
                title="失业率" 
                value="3.9%" 
                subtitle="季度更新"
                trend={-0.3}
                icon="📉"
              />
              <StatCard 
                title="城镇化率" 
                value="84%" 
                subtitle="持续增长"
                trend={0.8}
                icon="🏙️"
              />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <ChartContainer title="各州人口排名 (Top 10)" subtitle="数据来源: Census Bureau Population Estimates">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={statePopulationData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis type="number" tickFormatter={formatNumber} stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="abbr" stroke="#64748b" fontSize={12} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="population" 
                      name="人口"
                      radius={[0, 6, 6, 0]}
                      fill="url(#blueGradient)"
                    />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="种族构成" subtitle="2024年人口比例">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={raceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                      labelLine={{ stroke: '#64748b' }}
                    >
                      {raceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <ChartContainer title="人口历史趋势" subtitle="1950-2024 (百万)">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={populationTrendData}>
                    <defs>
                      <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="population" 
                      name="人口(百万)"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPop)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="经济健康指数" subtitle="综合评估 (满分100)">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={economicRadarData}>
                    <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
                    <Radar 
                      name="2024年" 
                      dataKey="A" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <ChartContainer title="年龄分布" subtitle="按性别划分 (百万)">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={ageDistributionData} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="age" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="male" name="男性" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="female" name="女性" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="城镇化趋势" subtitle="城市人口占比 (%)">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={populationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[60, 90]} stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="urban" 
                      name="城镇化率"
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* State Details Table */}
            <ChartContainer title="各州详细数据" subtitle="点击行查看更多信息">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>州</th>
                      <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>人口</th>
                      <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>增长率</th>
                      <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>收入中位数</th>
                      <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>失业率</th>
                      <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statePopulationData.map((state, index) => (
                      <tr 
                        key={state.abbr}
                        className="data-row"
                        style={{ 
                          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => setSelectedState(state)}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ 
                              width: '32px', 
                              height: '32px', 
                              background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]} 0%, ${COLORS[(index + 1) % COLORS.length]} 100%)`,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}>
                              {state.abbr}
                            </span>
                            <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{state.state}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatNumber(state.population)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <span style={{ 
                            color: state.growth > 0 ? '#10b981' : state.growth < 0 ? '#ef4444' : '#94a3b8',
                            fontWeight: '600'
                          }}>
                            {state.growth > 0 ? '+' : ''}{state.growth}%
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatCurrency(state.medianIncome)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', color: '#e2e8f0' }}>
                          {state.unemployment}%
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: state.growth > 1 ? 'rgba(16, 185, 129, 0.2)' : state.growth > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: state.growth > 1 ? '#10b981' : state.growth > 0 ? '#f59e0b' : '#ef4444',
                          }}>
                            {state.growth > 1 ? '快速增长' : state.growth > 0 ? '缓慢增长' : '人口流失'}
                          </span>
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
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard 
                title="GDP总量" 
                value="$27.36T" 
                subtitle="2024年估计"
                trend={2.5}
                icon="💹"
              />
              <StatCard 
                title="劳动参与率" 
                value="62.5%" 
                subtitle="16岁以上"
                trend={0.2}
                icon="👷"
              />
              <StatCard 
                title="CPI通胀率" 
                value="2.9%" 
                subtitle="年同比"
                trend={-1.2}
                icon="📊"
              />
              <StatCard 
                title="新增就业" 
                value="175K" 
                subtitle="月度数据"
                trend={5.3}
                icon="📈"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <ChartContainer title="行业就业分布" subtitle="各行业就业人数 (百万)">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={industryData} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="industry" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="employment" 
                      name="就业人数(百万)"
                      radius={[0, 6, 6, 0]}
                    >
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="行业增长预测" subtitle="未来10年增长率 (%)">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={industryData} margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="industry" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="growth" 
                      name="预测增长率"
                      radius={[6, 6, 0, 0]}
                    >
                      {industryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.growth > 0 ? '#10b981' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <ChartContainer title="各州收入对比" subtitle="家庭收入中位数 (美元)">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statePopulationData} margin={{ bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="abbr" 
                    stroke="#64748b" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar 
                    dataKey="medianIncome" 
                    name="收入中位数"
                    radius={[6, 6, 0, 0]}
                    fill="url(#incomeGradient)"
                  />
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Demographics Tab */}
        {activeTab === 'demographics' && (
          <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <ChartContainer title="种族构成详情" subtitle="2024年人口占比">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={raceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${value}%`}
                    >
                      {raceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="年龄金字塔" subtitle="人口年龄结构">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={ageDistributionData.map(d => ({
                      ...d,
                      maleNeg: -d.male
                    }))}
                    layout="vertical"
                    margin={{ left: 20, right: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={12}
                      domain={[-30, 30]}
                      label={{ value: '人口 (百万)', position: 'bottom', style: { fill: '#94a3b8', fontSize: 13 } }}
                    />
                    <YAxis
                      type="category"
                      dataKey="age"
                      stroke="#64748b"
                      fontSize={11}
                      label={{ value: '年龄组', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 13 } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="maleNeg" name="男性" fill="#3b82f6" radius={[6, 0, 0, 6]} />
                    <Bar dataKey="female" name="女性" fill="#ec4899" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="关键人口指标" subtitle="2024年数据">
                <div style={{ padding: '20px' }}>
                  {[
                    { label: '中位年龄', value: '38.9 岁', icon: '🎂' },
                    { label: '家庭平均规模', value: '2.51 人', icon: '👨‍👩‍👧' },
                    { label: '65岁以上', value: '17.3%', icon: '👴' },
                    { label: '18岁以下', value: '21.7%', icon: '👶' },
                    { label: '外国出生', value: '14.3%', icon: '✈️' },
                    { label: '大学学历', value: '33.7%', icon: '🎓' },
                  ].map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: index < 5 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.label}</span>
                      </div>
                      <span style={{ 
                        color: '#f1f5f9', 
                        fontWeight: '600',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '16px'
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <ChartContainer title="人口总量年度变化" subtitle="各年新增人口 (百万)">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={populationTrendData.map((d, i, arr) => ({
                      ...d,
                      change: i > 0 ? (d.population - arr[i-1].population).toFixed(1) : 0
                    })).slice(1)}
                  >
                    <defs>
                      <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="change" 
                      name="新增人口(百万)"
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorChange)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="数据来源" subtitle="Census Bureau 公开数据集">
                <div style={{ padding: '16px' }}>
                  {[
                    { name: 'American Community Survey', year: '2024' },
                    { name: 'Decennial Census', year: '2020' },
                    { name: 'Population Estimates', year: '2024' },
                    { name: 'Current Population Survey', year: '2024' },
                    { name: 'County Business Patterns', year: '2023' },
                  ].map((source, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        marginBottom: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{source.name}</span>
                      <span style={{ 
                        color: '#3b82f6', 
                        fontSize: '12px',
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
                      padding: '12px',
                      marginTop: '16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '8px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    访问 data.census.gov →
                  </a>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(15, 23, 42, 0.8)',
        borderTop: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '24px 32px',
        marginTop: '48px'
      }}>
        <div style={{ 
          maxWidth: '1600px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            数据来源: U.S. Census Bureau | 仅供参考，非官方数据
          </p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Built with React & Recharts · 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
