import React from 'react';

const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Confirmed': 'bg-blue-100 text-blue-800',
    'Preparing': 'bg-purple-100 text-purple-800',
    'Ready': 'bg-green-100 text-green-800',
    'DELIVERING': 'bg-orange-100 text-orange-800',
    'DELIVERED': 'bg-emerald-100 text-emerald-800',
    'Delivered': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'IDLE': 'bg-gray-100 text-gray-800',
    'BUSY': 'bg-orange-100 text-orange-800',
    'CHARGING': 'bg-blue-100 text-blue-800',
};

const OrderStatusBadge = ({ status }) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></span>
            {status}
        </span>
    );
};

export default OrderStatusBadge;
