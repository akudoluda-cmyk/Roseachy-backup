// Filter-only UI contract. This module knows nothing about financial data.
export const SALES_FILTER_IDS = Object.freeze(['txKindFilter', 'txDivFilter', 'txSearch']);
export const STOCK_FILTER_IDS = Object.freeze(['stockDiv', 'stockSearch', 'stockSort', 'stockLowOnly', 'stockExpiringOnly']);
export const FILTER_IDS = new Set([...SALES_FILTER_IDS, ...STOCK_FILTER_IDS]);

const defaults = Object.freeze({
  txKindFilter: 'all', txDivFilter: 'all', txSearch: '',
  stockDiv: 'all', stockSearch: '', stockSort: 'lowest',
  stockLowOnly: false, stockExpiringOnly: false,
});

export function filterCurrentValue(element) {
  return element?.type === 'checkbox' ? !!element.checked : (element?.value ?? '');
}

export function isFilterActive(id, value) {
  return String(value) !== String(defaults[id]);
}

