function getNextFulfillmentDate(fulfillmentDates, allowedProductsData, productId) {
    const today = new Date("2025-12-17");

    for (let i = 0; i < fulfillmentDates.length; i++) {
        const current = new Date(fulfillmentDates[i].date);
        console.log("c",current,"  :  ","t",today)
        if (current > today) {
            let index, type, lastOrder = false;

            const isLast = (i + 1) >= fulfillmentDates.length;
            const isPreOrder = allowedProductsData[i + 1]?.variantId === productId;

            if (isLast) {
                index = i;
                type = "Reject";
                lastOrder = true;
            } else if (isPreOrder) {
                index = i + 2;
                type = "Pre-order";
            } else {
                index = i + 1;
                type = "Normal";
            }

            const period = fulfillmentDates[index];
            const date = new Date(period.date).toISOString().split("T")[0];

            return {
                index,
                label: period.label,
                date,
                lastOrder,
                type
            };
        }
        
    }
    return {
        index: null,
        label: "Past last Date",
        date: null,
        lastOrder: false,
        type: "Reject"
    };
}


const ALLOWED_PRODUCTS_DATA = [
    { "variantId": "50458331808055", "productType": "Numi Steep Club - Spring", "productTitle": "Seasonal Discovery Box" },
    { "variantId": "50458477166903", "productType": "Numi Steep Club - Summer", "productTitle": "Seasonal Discovery Box" },
    { "variantId": "50458477461815", "productType": "Numi Steep Club - Fall", "productTitle": "Seasonal Discovery Box" },
    { "variantId": "50458477723959", "productType": "Numi Steep Club - Winter", "productTitle": "Seasonal Discovery Box" }
]
const FULFILLMENT_DATES = [
    { "label": "Spring", "date": "2025-03-15" },
    { "label": "Summer", "date": "2025-06-15" },
    { "label": "Fall", "date": "2025-09-16" },
    { "label": "Winter", "date": "2025-12-15" }
]


console.log(getNextFulfillmentDate(FULFILLMENT_DATES, ALLOWED_PRODUCTS_DATA, "50458477461815"))