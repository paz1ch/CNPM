const ORDER_MODIFICATION_DEADLINE = process.env.ORDER_MODIFICATION_DEADLINE || 30;

const statusFlow = {
    'user': {
        'Pending': ['Cancelled'],
    },
    'restaurant': {
        'Pending': ['Preparing'],
        'Preparing': ['Ready'],
    },
    'delivery': {
        'Ready': ['Out for Delivery'],
        'Out for Delivery': ['Delivered'],
    }
};

module.exports = {
    ORDER_MODIFICATION_DEADLINE,
    statusFlow,
};