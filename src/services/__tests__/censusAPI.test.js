import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStatePopulation,
  getACSData,
  getAgeDistribution,
  getRaceData,
  getAllStatesData
} from '../censusAPI';

// Mock fetch globally
global.fetch = vi.fn();

describe('Census API Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('getStatePopulation', () => {
    it('should fetch and transform state population data', async () => {
      const mockResponse = [
        ['POP_2023', 'NAME', 'state'],
        ['39538223', 'California', '06'],
        ['29145505', 'Texas', '48']
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getStatePopulation();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        state: 'California',
        population: 39538223,
        stateCode: '06'
      });
      expect(result[1]).toEqual({
        state: 'Texas',
        population: 29145505,
        stateCode: '48'
      });
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(getStatePopulation()).rejects.toThrow('API Error: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getStatePopulation()).rejects.toThrow('Network error');
    });
  });

  describe('getACSData', () => {
    it('should fetch ACS data for a specific state', async () => {
      const mockResponse = [
        ['NAME', 'B19013_001E', 'DP03_0005PE', 'state'],
        ['California', '91905', '4.8', '06']
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getACSData('06');

      expect(result).toEqual({
        medianIncome: 91905,
        unemployment: 4.8
      });
    });

    it('should return null if no data available', async () => {
      const mockResponse = [
        ['NAME', 'B19013_001E', 'DP03_0005PE', 'state']
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getACSData('99');

      expect(result).toBeNull();
    });

    it('should handle missing values gracefully', async () => {
      const mockResponse = [
        ['NAME', 'B19013_001E', 'DP03_0005PE', 'state'],
        ['Unknown', null, null, '99']
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getACSData('99');

      expect(result).toEqual({
        medianIncome: 0,
        unemployment: 0
      });
    });
  });

  describe('getRaceData', () => {
    it('should fetch and transform race data', async () => {
      const mockResponse = [
        ['NAME', 'DP05_0077PE', 'DP05_0071PE', 'DP05_0078PE', 'DP05_0080PE'],
        ['United States', '19.1', '57.8', '12.4', '6.2']
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getRaceData();

      expect(result).toHaveLength(5);
      expect(result[0].key).toBe('white');
      expect(result[0].value).toBe(57.8);
      expect(result[1].key).toBe('hispanic');
      expect(result[1].value).toBe(19.1);

      // Check that percentages sum to 100
      const total = result.reduce((sum, item) => sum + item.value, 0);
      expect(total).toBeCloseTo(100, 1);
    });
  });

  describe('getAgeDistribution', () => {
    it('should fetch and aggregate age distribution data', async () => {
      // Mock response with age data
      const mockData = Array(48).fill('1000000'); // Simplified mock data
      const mockResponse = [
        ['NAME', ...mockData],
        ['United States', ...mockData]
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getAgeDistribution();

      expect(result).toHaveLength(9); // 9 age groups
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('male');
      expect(result[0]).toHaveProperty('female');
      expect(result[0]).toHaveProperty('total');
    });
  });

  describe('getAllStatesData', () => {
    it('should combine population and ACS data', async () => {
      const mockPopResponse = [
        ['POP_2023', 'NAME', 'state'],
        ['39538223', 'California', '06'],
        ['29145505', 'Texas', '48']
      ];

      const mockACSResponse = [
        ['NAME', 'B19013_001E', 'DP03_0005PE', 'state'],
        ['California', '91905', '4.8', '06']
      ];

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPopResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockACSResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockACSResponse
        });

      const result = await getAllStatesData();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('state');
      expect(result[0]).toHaveProperty('population');
      expect(result[0]).toHaveProperty('medianIncome');
      expect(result[0]).toHaveProperty('unemployment');
    });

    it('should handle ACS fetch errors gracefully', async () => {
      const mockPopResponse = [
        ['POP_2023', 'NAME', 'state'],
        ['39538223', 'California', '06']
      ];

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPopResponse
        })
        .mockRejectedValueOnce(new Error('ACS API Error'));

      const result = await getAllStatesData();

      // Should still return data with default values
      expect(result[0]).toHaveProperty('state', 'California');
      expect(result[0]).toHaveProperty('medianIncome', 0);
      expect(result[0]).toHaveProperty('unemployment', 0);
    });
  });

  describe('API URL construction', () => {
    it('should construct proper API URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [['POP_2023', 'NAME', 'state']]
      });

      await getStatePopulation();

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('https://api.census.gov/data');
      expect(callUrl).toContain('POP_2023');
      expect(callUrl).toContain('NAME');
    });

    it('should make valid API request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [['POP_2023', 'NAME', 'state']]
      });

      await getStatePopulation();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch.mock.calls[0][0]).toContain('/data/2023/pep/population');
    });
  });
});
