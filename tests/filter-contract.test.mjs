import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SALES_FILTER_IDS, STOCK_FILTER_IDS, FILTER_IDS,
  filterCurrentValue, isFilterActive,
} from '../src/islands/filter-contract.mjs';

test('sales and stock controls are disjoint and all identified', () => {
  assert.equal(SALES_FILTER_IDS.length, 3);
  assert.equal(STOCK_FILTER_IDS.length, 5);
  assert.equal(FILTER_IDS.size, 8);
  assert.equal(FILTER_IDS.has('stockAddBtn'), false);
  assert.equal(FILTER_IDS.has('saveSale'), false);
});
test('sales record and stock filters recognize inactive defaults', () => {
  const defaultValues = {
    txKindFilter: 'all', txDivFilter: 'all', txSearch: '',
    stockDiv: 'all', stockSearch: '', stockSort: 'lowest',
    stockLowOnly: false, stockExpiringOnly: false,
  };
  for (const [id, val] of Object.entries(defaultValues)) {
    assert.equal(isFilterActive(id,val),false,id);
  }
});
test('filter changes correctly mark search and status active', () => {
  for (const [id, value] of Object.entries({
    txKindFilter: 'pos', txDivFilter: 'essentials', txSearch: '₦600',
    stockDiv: 'pharmacy', stockSearch: 'Coke', stockSort: 'name',
    stockLowOnly: true, stockExpiringOnly: true,
  })) assert.equal(isFilterActive(id,value),true,id);
});
test('snapshot reads live legacy DOM values without storing financial data', () => {
  assert.equal(filterCurrentValue({type:'checkbox',checked:true,value:'ignored'}),true);
  assert.equal(filterCurrentValue({type:'checkbox',checked:false,value:'ignored'}),false);
  assert.equal(filterCurrentValue({type:'search',value:'Aspirin'}),'Aspirin');
  assert.equal(filterCurrentValue({type:'select-one',value:'pharmacy'}),'pharmacy');
  assert.equal(filterCurrentValue(null),'');
});
