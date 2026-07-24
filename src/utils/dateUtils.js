import { FULFILLMENT_TYPES } from '../constants/index.js';

export function getNextFulfillmentDate(fulfillmentDates, allowedProductsData, productId) {
  const today = new Date();

  for (let i = 0; i < fulfillmentDates.length; i++) {
    const current = new Date(fulfillmentDates[i].date);

    if (current > today) {
      const isLast = i + 1 >= fulfillmentDates.length;
      const isPreOrder =
        productId != null &&
        allowedProductsData[i + 1]?.variantId === productId;

      let index;
      let type;
      let lastOrder = false;

      if (isLast) {
        index = i;
        type = FULFILLMENT_TYPES.REJECT;
        lastOrder = true;
      } else if (isPreOrder) {
        index = i + 2;
        type = FULFILLMENT_TYPES.PRE_ORDER;
      } else {
        index = i + 1;
        type = FULFILLMENT_TYPES.NORMAL;
      }

      const period = fulfillmentDates[index];
      const date = new Date(period.date).toISOString().split('T')[0];

      return { index, label: period.label, date, lastOrder, type };
    }
  }

  return {
    index: null,
    label: 'Past last Date',
    date: null,
    lastOrder: false,
    type: FULFILLMENT_TYPES.REJECT,
  };
}
