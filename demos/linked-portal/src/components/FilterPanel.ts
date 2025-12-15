/**
 * FilterPanel - Interactive filter controls for cohort filtering
 *
 * Features:
 * - Disease type filter (checkboxes)
 * - Stage filter (checkboxes)
 * - Mutation type filter (checkboxes)
 * - Position range slider
 * - Active filter indicators
 * - Clear all filters
 */

import * as d3 from 'd3';
import { CohortStore, type CohortState } from '../state';
import type { FilterState, ConsequenceType } from '../types';
import { MUTATION_COLORS, MUTATION_LABELS, DISEASE_COLORS } from '../types';

export interface FilterPanelConfig {
  width: number;
  collapsed: boolean;
}

const DEFAULT_CONFIG: FilterPanelConfig = {
  width: 280,
  collapsed: false,
};

export class FilterPanel {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: FilterPanelConfig;

  // Filter options (from data)
  private diseaseOptions: string[] = [];
  private stageOptions: string[] = [];
  private mutationTypeOptions: ConsequenceType[] = [];
  private positionRange: [number, number] = [0, 100];

  // Current filter state
  private filters: FilterState = {};
  private collapsed: boolean = false;

  constructor(selector: string, config: Partial<FilterPanelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.collapsed = this.config.collapsed;

    // Clear and create container
    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'filter-panel')
      .style('width', `${this.config.width}px`)
      .style('background', '#f8f9fa')
      .style('border-radius', '8px')
      .style('padding', '16px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.05)');

    this.setupStoreSubscription();
  }

  private setupStoreSubscription(): void {
    CohortStore.subscribe((state: CohortState) => {
      // Get filter options from store
      const options = CohortStore.getFilterOptions();
      this.diseaseOptions = options.diseases;
      this.stageOptions = options.stages;
      this.mutationTypeOptions = options.mutationTypes;
      this.positionRange = options.positionRange;

      // Update filters from store state
      this.filters = state.filters;

      this.render();
    });
  }

  /**
   * Set filter options manually
   */
  setFilterOptions(options: {
    diseases: string[];
    stages: string[];
    mutationTypes: ConsequenceType[];
    positionRange: [number, number];
  }): void {
    this.diseaseOptions = options.diseases;
    this.stageOptions = options.stages;
    this.mutationTypeOptions = options.mutationTypes;
    this.positionRange = options.positionRange;
    this.render();
  }

  render(): void {
    this.container.selectAll('*').remove();

    this.renderHeader();

    if (!this.collapsed) {
      this.renderActiveFilters();
      this.renderDiseaseFilter();
      this.renderStageFilter();
      this.renderMutationTypeFilter();
      this.renderPositionFilter();
      this.renderClearButton();
    }
  }

  private renderHeader(): void {
    const header = this.container
      .append('div')
      .attr('class', 'filter-header')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('margin-bottom', this.collapsed ? '0' : '16px');

    header
      .append('h3')
      .style('margin', '0')
      .style('font-size', '15px')
      .style('font-weight', '600')
      .style('color', '#1a1a2e')
      .style('cursor', 'pointer')
      .text('🔍 Filters')
      .on('click', () => this.toggleCollapse());

    header
      .append('button')
      .style('background', 'none')
      .style('border', 'none')
      .style('cursor', 'pointer')
      .style('font-size', '14px')
      .style('color', '#666')
      .text(this.collapsed ? '▼' : '▲')
      .on('click', () => this.toggleCollapse());
  }

  private renderActiveFilters(): void {
    const activeFilters = this.getActiveFilterCount();

    if (activeFilters === 0) return;

    const activeSection = this.container
      .append('div')
      .attr('class', 'active-filters')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('gap', '6px')
      .style('margin-bottom', '16px')
      .style('padding-bottom', '12px')
      .style('border-bottom', '1px solid #e0e0e0');

    // Disease filters
    this.filters.disease?.forEach((d) => {
      this.addFilterChip(activeSection, d, DISEASE_COLORS[d] || '#999', () => {
        this.removeFilter('disease', d);
      });
    });

    // Stage filters
    this.filters.stage?.forEach((s) => {
      this.addFilterChip(activeSection, `Stage ${s}`, '#666', () => {
        this.removeFilter('stage', s);
      });
    });

    // Mutation type filters
    this.filters.mutationType?.forEach((t) => {
      const type = t as ConsequenceType;
      this.addFilterChip(
        activeSection,
        MUTATION_LABELS[type] || t,
        MUTATION_COLORS[type] || '#999',
        () => {
          this.removeFilter('mutationType', t);
        }
      );
    });

    // Position range
    if (this.filters.positionRange) {
      this.addFilterChip(
        activeSection,
        `Pos: ${this.filters.positionRange[0]}-${this.filters.positionRange[1]}`,
        '#4facfe',
        () => this.removeFilter('positionRange')
      );
    }
  }

  private addFilterChip(
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,
    label: string,
    color: string,
    onRemove: () => void
  ): void {
    const chip = container
      .append('span')
      .style('display', 'inline-flex')
      .style('align-items', 'center')
      .style('gap', '4px')
      .style('padding', '3px 8px')
      .style('background', color + '20')
      .style('border', `1px solid ${color}`)
      .style('border-radius', '12px')
      .style('font-size', '11px')
      .style('color', color);

    chip.append('span').text(label);

    chip
      .append('span')
      .style('cursor', 'pointer')
      .style('font-weight', 'bold')
      .style('margin-left', '2px')
      .text('×')
      .on('click', (event) => {
        event.stopPropagation();
        onRemove();
      });
  }

  private renderDiseaseFilter(): void {
    if (this.diseaseOptions.length === 0) return;

    const section = this.createFilterSection('Disease Type');

    this.diseaseOptions.forEach((disease) => {
      const isChecked = this.filters.disease?.includes(disease) || false;
      const color = DISEASE_COLORS[disease] || '#999';

      this.createCheckbox(section, disease, disease, isChecked, color, () => {
        this.toggleFilter('disease', disease);
      });
    });
  }

  private renderStageFilter(): void {
    if (this.stageOptions.length === 0) return;

    const section = this.createFilterSection('Stage');

    this.stageOptions.forEach((stage) => {
      const isChecked = this.filters.stage?.includes(stage) || false;

      this.createCheckbox(section, stage, `Stage ${stage}`, isChecked, '#666', () => {
        this.toggleFilter('stage', stage);
      });
    });
  }

  private renderMutationTypeFilter(): void {
    if (this.mutationTypeOptions.length === 0) return;

    const section = this.createFilterSection('Mutation Type');

    this.mutationTypeOptions.forEach((type) => {
      const isChecked = this.filters.mutationType?.includes(type) || false;
      const label = MUTATION_LABELS[type] || type;
      const color = MUTATION_COLORS[type];

      this.createCheckbox(section, type, label, isChecked, color, () => {
        this.toggleFilter('mutationType', type);
      });
    });
  }

  private renderPositionFilter(): void {
    if (this.positionRange[1] === 0) return;

    const section = this.createFilterSection('Position Range');

    const currentMin = this.filters.positionRange?.[0] || this.positionRange[0];
    const currentMax = this.filters.positionRange?.[1] || this.positionRange[1];

    const sliderContainer = section.append('div').style('padding', '8px 0');

    // Current range display
    const rangeDisplay = sliderContainer
      .append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('font-size', '12px')
      .style('color', '#666')
      .style('margin-bottom', '8px');

    rangeDisplay.append('span').attr('class', 'min-val').text(currentMin);
    rangeDisplay.append('span').attr('class', 'max-val').text(currentMax);

    // Min slider
    const minSlider = sliderContainer
      .append('input')
      .attr('type', 'range')
      .attr('min', this.positionRange[0])
      .attr('max', this.positionRange[1])
      .attr('value', currentMin)
      .style('width', '100%')
      .style('margin-bottom', '4px')
      .on('input', (event) => {
        const value = parseInt((event.target as HTMLInputElement).value);
        rangeDisplay.select('.min-val').text(value);
      })
      .on('change', (event) => {
        const minVal = parseInt((event.target as HTMLInputElement).value);
        const maxVal = parseInt(maxSlider.property('value'));
        this.setPositionRange([Math.min(minVal, maxVal), Math.max(minVal, maxVal)]);
      });

    // Max slider
    const maxSlider = sliderContainer
      .append('input')
      .attr('type', 'range')
      .attr('min', this.positionRange[0])
      .attr('max', this.positionRange[1])
      .attr('value', currentMax)
      .style('width', '100%')
      .on('input', (event) => {
        const value = parseInt((event.target as HTMLInputElement).value);
        rangeDisplay.select('.max-val').text(value);
      })
      .on('change', (event) => {
        const minVal = parseInt(minSlider.property('value'));
        const maxVal = parseInt((event.target as HTMLInputElement).value);
        this.setPositionRange([Math.min(minVal, maxVal), Math.max(minVal, maxVal)]);
      });
  }

  private renderClearButton(): void {
    const activeCount = this.getActiveFilterCount();

    if (activeCount === 0) return;

    this.container
      .append('button')
      .attr('class', 'clear-all-btn')
      .style('width', '100%')
      .style('padding', '8px')
      .style('margin-top', '16px')
      .style('background', '#fff')
      .style('border', '1px solid #e74c3c')
      .style('border-radius', '6px')
      .style('color', '#e74c3c')
      .style('font-size', '13px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s')
      .text(`Clear All Filters (${activeCount})`)
      .on('click', () => this.clearAllFilters())
      .on('mouseover', function () {
        d3.select(this).style('background', '#e74c3c').style('color', '#fff');
      })
      .on('mouseout', function () {
        d3.select(this).style('background', '#fff').style('color', '#e74c3c');
      });
  }

  private createFilterSection(
    title: string
  ): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
    const section = this.container
      .append('div')
      .attr('class', 'filter-section')
      .style('margin-bottom', '16px');

    section
      .append('label')
      .style('display', 'block')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('color', '#333')
      .style('margin-bottom', '8px')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text(title);

    return section;
  }

  private createCheckbox(
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,
    value: string,
    label: string,
    checked: boolean,
    color: string,
    onChange: () => void
  ): void {
    const item = container
      .append('label')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '8px')
      .style('padding', '4px 0')
      .style('cursor', 'pointer')
      .style('font-size', '13px')
      .style('color', '#444');

    item
      .append('input')
      .attr('type', 'checkbox')
      .attr('value', value)
      .property('checked', checked)
      .style('accent-color', color)
      .on('change', onChange);

    // Color indicator
    item
      .append('span')
      .style('display', 'inline-block')
      .style('width', '10px')
      .style('height', '10px')
      .style('border-radius', '2px')
      .style('background', color);

    item.append('span').text(label);
  }

  private toggleFilter(type: 'disease' | 'stage' | 'mutationType', value: string): void {
    const current = this.filters[type] || [];
    const index = current.indexOf(value as any);

    let newValues: string[];
    if (index >= 0) {
      newValues = current.filter((v: string) => v !== value);
    } else {
      newValues = [...current, value];
    }

    const newFilters: FilterState = {
      ...this.filters,
      [type]: newValues.length > 0 ? newValues : undefined,
    };

    CohortStore.applyFilters(newFilters);
  }

  private removeFilter(type: keyof FilterState, value?: string): void {
    if (type === 'positionRange' || value === undefined) {
      const newFilters = { ...this.filters };
      delete newFilters[type];
      CohortStore.applyFilters(newFilters);
    } else {
      const current = (this.filters[type] as string[]) || [];
      const newValues = current.filter((v) => v !== value);

      const newFilters: FilterState = {
        ...this.filters,
        [type]: newValues.length > 0 ? newValues : undefined,
      };

      CohortStore.applyFilters(newFilters);
    }
  }

  private setPositionRange(range: [number, number]): void {
    const isFullRange = range[0] === this.positionRange[0] && range[1] === this.positionRange[1];

    const newFilters: FilterState = {
      ...this.filters,
      positionRange: isFullRange ? undefined : range,
    };

    CohortStore.applyFilters(newFilters);
  }

  private clearAllFilters(): void {
    CohortStore.clearFilters();
  }

  private toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.render();
  }

  private getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.disease?.length) count += this.filters.disease.length;
    if (this.filters.stage?.length) count += this.filters.stage.length;
    if (this.filters.mutationType?.length) count += this.filters.mutationType.length;
    if (this.filters.positionRange) count += 1;
    return count;
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container.remove();
  }
}
