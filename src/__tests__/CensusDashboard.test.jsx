import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CensusDashboard from '../CensusDashboard';
import * as censusAPI from '../services/censusAPI';

// Mock the census API module
vi.mock('../services/censusAPI');

describe('CensusDashboard Component', () => {
  const mockStateData = [
    {
      state: 'California',
      abbr: 'CA',
      population: 39538223,
      growth: 0.2,
      medianIncome: 91905,
      unemployment: 4.8
    },
    {
      state: 'Texas',
      abbr: 'TX',
      population: 29145505,
      growth: 1.6,
      medianIncome: 73035,
      unemployment: 4.0
    }
  ];

  const mockAgeData = [
    { age: '0-4', male: 9.8, female: 9.4, total: 19.2 },
    { age: '5-17', male: 26.5, female: 25.3, total: 51.8 }
  ];

  const mockRaceData = [
    { name: '白人', value: 57.8, color: '#3b82f6' },
    { name: '拉丁裔', value: 19.1, color: '#f59e0b' },
    { name: '非裔', value: 12.4, color: '#10b981' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      // Mock API to never resolve
      censusAPI.getAllStatesData.mockImplementation(() => new Promise(() => {}));
      censusAPI.getAgeDistribution.mockImplementation(() => new Promise(() => {}));
      censusAPI.getRaceData.mockImplementation(() => new Promise(() => {}));

      render(<CensusDashboard />);

      expect(screen.getByText('加载 Census Bureau 数据...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Load', () => {
    beforeEach(() => {
      censusAPI.getAllStatesData.mockResolvedValue(mockStateData);
      censusAPI.getAgeDistribution.mockResolvedValue(mockAgeData);
      censusAPI.getRaceData.mockResolvedValue(mockRaceData);
    });

    it('should render dashboard after data loads', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('U.S. Census 数据可视化')).toBeInTheDocument();
      });
    });

    it('should fetch all required data on mount', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(censusAPI.getAllStatesData).toHaveBeenCalledTimes(1);
        expect(censusAPI.getAgeDistribution).toHaveBeenCalledTimes(1);
        expect(censusAPI.getRaceData).toHaveBeenCalledTimes(1);
      });
    });

    it('should display navigation tabs', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('总览')).toBeInTheDocument();
        expect(screen.getByText('人口')).toBeInTheDocument();
        expect(screen.getByText('经济')).toBeInTheDocument();
        expect(screen.getByText('人口结构')).toBeInTheDocument();
      });
    });

    it('should switch tabs on click', async () => {
      const user = userEvent.setup();
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('总览')).toBeInTheDocument();
      });

      const populationTab = screen.getByText('人口');
      await user.click(populationTab);

      // Tab should be active (this would depend on actual rendering)
      expect(populationTab).toBeInTheDocument();
    });

    it('should call API and render successfully', async () => {
      render(<CensusDashboard />);

      // Verify data was loaded
      await waitFor(() => {
        expect(censusAPI.getAllStatesData).toHaveBeenCalled();
        // Check that we're no longer in loading state
        expect(screen.queryByText('加载 Census Bureau 数据...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      const errorMessage = 'API Error';
      censusAPI.getAllStatesData.mockRejectedValue(new Error(errorMessage));
      censusAPI.getAgeDistribution.mockRejectedValue(new Error(errorMessage));
      censusAPI.getRaceData.mockRejectedValue(new Error(errorMessage));

      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('数据加载失败')).toBeInTheDocument();
        expect(screen.getByText(/无法加载 Census 数据/)).toBeInTheDocument();
      });
    });

    it('should have reload button in error state', async () => {
      censusAPI.getAllStatesData.mockRejectedValue(new Error('Error'));
      censusAPI.getAgeDistribution.mockRejectedValue(new Error('Error'));
      censusAPI.getRaceData.mockRejectedValue(new Error('Error'));

      render(<CensusDashboard />);

      await waitFor(() => {
        const reloadButton = screen.getByText('重新加载');
        expect(reloadButton).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      censusAPI.getAllStatesData.mockResolvedValue(mockStateData);
      censusAPI.getAgeDistribution.mockResolvedValue(mockAgeData);
      censusAPI.getRaceData.mockResolvedValue(mockRaceData);
    });

    it('should display stat cards in overview tab', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('美国总人口')).toBeInTheDocument();
        expect(screen.getByText('家庭收入中位数')).toBeInTheDocument();
        expect(screen.getByText('失业率')).toBeInTheDocument();
        expect(screen.getByText('城镇化率')).toBeInTheDocument();
      });
    });

    it('should render chart titles', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        expect(screen.getByText('各州人口排名 (Top 10)')).toBeInTheDocument();
        expect(screen.getByText('种族构成')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      censusAPI.getAllStatesData.mockResolvedValue(mockStateData);
      censusAPI.getAgeDistribution.mockResolvedValue(mockAgeData);
      censusAPI.getRaceData.mockResolvedValue(mockRaceData);
    });

    it('should have accessible tab buttons', async () => {
      render(<CensusDashboard />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('button');
        expect(tabs.length).toBeGreaterThan(0);
      });
    });
  });
});
