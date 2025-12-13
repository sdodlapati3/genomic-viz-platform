/**
 * Survival Service
 * 
 * Business logic for survival analysis data
 */

import { sampleSurvivalData } from '../data/sampleData.js';

export class SurvivalService {
  constructor() {
    this.survivalData = [...sampleSurvivalData];
  }

  /**
   * Get survival data with optional filtering
   */
  async getSurvivalData(filters = {}) {
    let filtered = [...this.survivalData];

    if (filters.cancerType) {
      filtered = filtered.filter(d => d.cancerType === filters.cancerType);
    }

    if (filters.mutation) {
      filtered = filtered.filter(d => d[`${filters.mutation}Mutation`]);
    }

    return filtered;
  }

  /**
   * Calculate Kaplan-Meier curve
   */
  calculateKaplanMeier(data) {
    const sorted = [...data].sort((a, b) => a.time - b.time);
    
    let nAtRisk = sorted.length;
    let currentSurvival = 1;
    const steps = [{ time: 0, survival: 1, nAtRisk: sorted.length }];
    
    sorted.forEach(d => {
      if (d.event === 1) {
        currentSurvival = currentSurvival * ((nAtRisk - 1) / nAtRisk);
        steps.push({
          time: d.time,
          survival: currentSurvival,
          nAtRisk: nAtRisk - 1
        });
      }
      nAtRisk--;
    });
    
    return steps;
  }

  /**
   * Get Kaplan-Meier curves grouped by variable
   */
  async getKaplanMeierCurves(groupBy = 'all') {
    const curves = {};

    if (groupBy === 'all' || !groupBy) {
      curves['All Patients'] = this.calculateKaplanMeier(this.survivalData);
    } else if (groupBy === 'cancerType') {
      const cancerTypes = [...new Set(this.survivalData.map(d => d.cancerType))];
      
      cancerTypes.forEach(type => {
        const typeData = this.survivalData.filter(d => d.cancerType === type);
        curves[type] = this.calculateKaplanMeier(typeData);
      });
    } else if (groupBy === 'tp53') {
      curves['TP53 Mutant'] = this.calculateKaplanMeier(
        this.survivalData.filter(d => d.tp53Mutation)
      );
      curves['TP53 Wild Type'] = this.calculateKaplanMeier(
        this.survivalData.filter(d => !d.tp53Mutation)
      );
    }

    return curves;
  }

  /**
   * Get summary statistics
   */
  async getSummaryStatistics() {
    const events = this.survivalData.filter(d => d.event === 1).length;
    const censored = this.survivalData.filter(d => d.event === 0).length;
    const times = this.survivalData.map(d => d.time);
    
    const medianTime = this.calculateMedian(times);
    const km = this.calculateKaplanMeier(this.survivalData);
    const medianSurvival = this.calculateMedianSurvival(km);

    return {
      totalPatients: this.survivalData.length,
      events,
      censored,
      eventRate: (events / this.survivalData.length * 100).toFixed(1),
      medianFollowUp: medianTime,
      medianSurvival: medianSurvival || 'Not reached'
    };
  }

  /**
   * Get hazard ratios (mock data)
   */
  async getHazardRatios() {
    return [
      { variable: 'TP53 Mutation', hr: 2.1, lower: 1.4, upper: 3.2, pValue: 0.001 },
      { variable: 'Age > 10', hr: 1.5, lower: 0.9, upper: 2.4, pValue: 0.12 },
      { variable: 'Stage IV', hr: 1.8, lower: 1.2, upper: 2.7, pValue: 0.005 }
    ];
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateMedianSurvival(km) {
    const belowMedian = km.find(d => d.survival < 0.5);
    return belowMedian ? belowMedian.time : null;
  }
}
