import axios from 'axios'; // Import axios

// Function to fetch charge by charge ID


const headers = {
    // 'X-Recharge-Version': '2021-11',
    'X-Recharge-Access-Token': "sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a",
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
async function fetchCharge(chargeId) {
    const url = `https://api.rechargeapps.com/charges/${chargeId}`;  // Endpoint to fetch the charge by ID

    try {
        const response = await axios.get(url, {
            headers: headers
        });

        if (response.status === 200) {
            const chargeData = response.data;
            console.log('Charge Data:', chargeData.charge.line_items);
            return chargeData; // Return the charge data to be used for fetching subscription ID
        } else {
            console.error('Failed to fetch charge data. Status:', response.status);
        }
    } catch (error) {
        console.error('Error fetching charge data:', error);
    }
}

// Call the function with the charge ID
fetchCharge(1365431987).then(chargeData => {
    if (chargeData) {
        // Now extract the required information (e.g., external_order_id) from the charge data
        const externalOrderId = chargeData.charge.line_items[0].subscription_id;
        console.log('External Order ID:', externalOrderId);

        // Now fetch the subscription based on the external order ID
        fetchSubscriptionByOrderId(externalOrderId); // Pass the extracted external order ID to fetch the subscription
    }
});

// Function to fetch subscription by external order ID
async function fetchSubscriptionByOrderId(orderId) {
    const apiKey = 'YOUR_RECHARGE_API_KEY';  // Replace with your actual ReCharge API key
    const url = `https://api.rechargeapps.com/subscriptions/${orderId}`;  // Endpoint to fetch subscription by order ID

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Recharge-Version': '2021-11',        
                'X-Recharge-Access-Token': "sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a",  // Authentication header
            },
        });

        if (response.status === 200) {
            const subscriptionData = response.data;
            console.log('Subscription Data:', subscriptionData);
            return subscriptionData;  // Return the subscription data
        } else {
            console.error('Failed to fetch subscription. Status:', response.status);
        }
    } catch (error) {
        console.error('Error fetching subscription data:', error);
    }
}
