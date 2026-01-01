/**
 * Tests for PDF Export functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { collectReportData, generateReportHTML } from './pdf-export';
import { getDb } from './db';
import { improvementScores, referralTracking, analyticsEvents } from '../drizzle/schema';

describe('PDF Export', () => {
  beforeAll(async () => {
    // Ensure test data exists
    const db = await getDb();
    if (!db) throw new Error('Database not available');
  });

  it('should collect report data with all required fields', async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await collectReportData(startDate, endDate);

    expect(data).toBeDefined();
    expect(data.dateRange).toBeDefined();
    expect(data.dateRange.startDate).toBe(startDate);
    expect(data.dateRange.endDate).toBe(endDate);
    
    expect(data.summary).toBeDefined();
    expect(data.summary.dayCount).toBeGreaterThan(0);
    
    expect(data.costAvoidance).toBeDefined();
    expect(data.costAvoidance.totalAvoidedCost).toBeGreaterThanOrEqual(0);
    
    expect(data.escalationPrevention).toBeDefined();
    expect(data.escalationPrevention.preventionRate).toBeGreaterThanOrEqual(0);
    expect(data.escalationPrevention.preventionRate).toBeLessThanOrEqual(100);
    
    expect(data.improvementStats).toBeDefined();
    expect(data.improvementStats.averageImprovement).toBeGreaterThanOrEqual(0);
    
    expect(data.roi).toBeDefined();
    expect(data.roi.operatingCost).toBeGreaterThanOrEqual(0);
    expect(data.roi.savings).toBeGreaterThanOrEqual(0);
  });

  it('should generate valid HTML for PDF', async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await collectReportData(startDate, endDate);
    const html = generateReportHTML(data);

    expect(html).toBeDefined();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="nl">');
    expect(html).toContain('Impact Rapport');
    expect(html).toContain('Matti & Opvoedmaatje');
    expect(html).toContain('Executive Summary');
    expect(html).toContain('Return on Investment');
    expect(html).toContain('Vermeden Kosten');
    expect(html).toContain('</html>');
  });

  it('should include all key metrics in HTML', async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await collectReportData(startDate, endDate);
    const html = generateReportHTML(data);

    // Check for key metrics
    expect(html).toContain('Vermeden Kosten');
    expect(html).toContain('Escalatie Voorkomen');
    expect(html).toContain('Verbetering');
    expect(html).toContain('Snelheid');
    expect(html).toContain('ROI');
    
    // Check for sections
    expect(html).toContain('Vermeden Kosten per Zorgtype');
    expect(html).toContain('Belangrijkste Inzichten');
    expect(html).toContain('Aanbevelingen');
  });

  it('should format currency values correctly', async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await collectReportData(startDate, endDate);
    const html = generateReportHTML(data);

    // Check for euro symbol
    expect(html).toContain('€');
    
    // Check that large numbers are formatted (should contain 'k' for thousands)
    expect(html).toMatch(/€\d+k/);
  });

  it('should include date range in HTML', async () => {
    const endDate = new Date('2026-01-01').toISOString();
    const startDate = new Date('2025-10-03').toISOString();

    const data = await collectReportData(startDate, endDate);
    const html = generateReportHTML(data);

    // Check that dates are included
    expect(html).toContain('Periode:');
    // Dutch date format is flexible, just check that dates exist
    expect(html).toMatch(/\d{1,2}-\d{1,2}-\d{4}/);
  });

  it('should calculate ROI correctly', async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await collectReportData(startDate, endDate);

    // ROI should be (savings - cost) / cost * 100
    const expectedROI = ((data.roi.savings - data.roi.operatingCost) / data.roi.operatingCost) * 100;
    
    expect(data.roi.roiPercentage).toBeCloseTo(expectedROI, 2);
  });

  it('should handle empty data gracefully', async () => {
    // Test with a date range that has no data
    const endDate = new Date('2020-01-01').toISOString();
    const startDate = new Date('2020-01-01').toISOString();

    const data = await collectReportData(startDate, endDate);
    const html = generateReportHTML(data);

    // Should still generate valid HTML even with no data
    expect(html).toBeDefined();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });
});
