const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    drone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drone'
    },
    status: {
        type: String,
        enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    pickupLocation: {
        lat: Number,
        lng: Number
    },
    deliveryLocation: {
        lat: Number,
        lng: Number
    },
    startTime: Date,
    endTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Mission', missionSchema);
