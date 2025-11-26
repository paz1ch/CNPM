import React from 'react';
import { motion } from 'framer-motion';

const TrackingMap = ({ droneLocation }) => {
    // Calculate drone position as percentage
    const droneX = ((droneLocation.lng - 10) / 80) * 100;
    const droneY = ((droneLocation.lat - 10) / 80) * 100;

    return (
        <div className="w-full h-[500px] bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl relative overflow-hidden border-4 border-white shadow-premium-lg">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-10 grid-rows-10 h-full">
                    {[...Array(100)].map((_, i) => (
                        <div key={i} className="border border-gray-300" />
                    ))}
                </div>
            </div>

            {/* Decorative elements to simulate map */}
            <div className="absolute top-0 left-0 right-0 bottom-0">
                {/* Roads */}
                <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-300" />
                <div className="absolute top-2/3 left-0 right-0 h-2 bg-gray-300" />
                <div className="absolute left-1/3 top-0 bottom-0 w-2 bg-gray-300" />
                <div className="absolute left-2/3 top-0 bottom-0 w-2 bg-gray-300" />
            </div>

            {/* Title overlay */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg z-10">
                <p className="text-gray-700 font-bold text-sm">Live Tracking</p>
            </div>

            {/* Restaurant */}
            <div className="absolute top-[10%] left-[10%] z-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl shadow-premium transform hover:scale-110 transition-transform">
                        🏪
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-white px-3 py-1 rounded-lg shadow-md border border-blue-200">
                            <p className="text-xs font-bold text-blue-900">Restaurant</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Customer */}
            <div className="absolute bottom-[10%] right-[10%] z-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="relative"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl shadow-premium transform hover:scale-110 transition-transform">
                        🏠
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-white px-3 py-1 rounded-lg shadow-md border border-green-200">
                            <p className="text-xs font-bold text-green-900">Your Location</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Delivery Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <motion.line
                    x1="10%"
                    y1="10%"
                    x2={`${droneX}%`}
                    y2={`${droneY}%`}
                    stroke="#FF6B35"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    opacity="0.5"
                />
                <motion.line
                    x1={`${droneX}%`}
                    y1={`${droneY}%`}
                    x2="90%"
                    y2="90%"
                    stroke="#CCCCCC"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                    opacity="0.3"
                />
            </svg>

            {/* Drone */}
            <motion.div
                className="absolute z-30"
                initial={{ left: '10%', top: '10%' }}
                animate={{
                    left: `${droneX}%`,
                    top: `${droneY}%`,
                }}
                transition={{
                    duration: 1,
                    ease: "easeInOut",
                }}
                style={{
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <motion.div
                    animate={{
                        y: [0, -8, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative"
                >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-5xl shadow-premium-lg border-4 border-primary">
                        🚁
                    </div>

                    {/* Drone info popup */}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 border-primary">
                            <p className="text-xs font-bold text-primary">En Route</p>
                        </div>
                    </div>

                    {/* Animated propeller effect */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-400 rounded-full opacity-30"
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default TrackingMap;
