import { createEntryController } from './entry-controller.js';
export const stockEntry = createEntryController({rootId:'stockEntryBody', actionIds:['stockAddBtn','stockCancelBtn','stockUseMarkupBtn']});
export const {fields:STOCK_FIELDS,actions:STOCK_ACTIONS,state:stockFormState,element:stockFormElement,dispatch:dispatchStockField,run:runStockAction}=stockEntry;
