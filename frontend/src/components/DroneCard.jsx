import React from 'react';
import { motion } from 'framer-motion';
import OrderStatusBadge from './OrderStatusBadge';

const DroneCard = ({ drone }) => {
    const batteryColor = () => {
        if (drone.battery >= 70) return 'bg-green-500';
        if (drone.battery >= 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-premium p-6 hover:shadow-premium-lg transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-secondary mb-1">
                        {drone.name}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {drone._id?.slice(-8)}</p>
                </div>
                <div className="text-4xl animate-float">
                    🚁
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Battery</span>
                        <span className="text-sm font-bold text-secondary">{drone.battery}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${drone.battery}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${batteryColor()} rounded-full`}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <OrderStatusBadge status={drone.status} />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Location</span>
                    <span className="text-xs text-gray-500">
                        {drone.location?.lat.toFixed(4)}, {drone.location?.lng.toFixed(4)}
                    </span>
                </div>

                {drone.currentOrderId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Current Order</span>
                            <span className="text-sm font-mono text-primary">{drone.currentOrderId}</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DroneCard;
