const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    // The ID of the order this mission is fulfilling
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // The drone assigned to this mission
    drone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drone',
        required: true
    },
    // The current status of the mission
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'FAILED', 'RETURNED'],
        default: 'PENDING'
    },
    // The starting point of the mission (e.g., restaurant location)
    pickupLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    // The destination point of the mission (e.g., customer address)
    deliveryLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    // The calculated flight path for the drone to follow
    path: [{
        lat: Number,
        lng: Number
    }],
    // A log of status changes and other important events during the mission
    history: [{
        status: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // The estimated time for the mission in minutes
    estimatedTravelTime: {
        type: Number 
    },
    // The actual time taken for the mission in minutes
    actualTravelTime: {
        type: Number
    },
    // The timestamp when the mission was successfully completed
    completedAt: {
        type: Date
    },
    // If the mission failed, this field will contain the reason
    failureReason: {
        type: String
    }
}, { 
    timestamps: true,
    versionKey: false 
});

// Add an initial event to the history when a new mission is created
missionSchema.pre('save', function(next) {
    if (this.isNew) {
        this.history.push({
            status: 'PENDING',
            message: 'Mission created and awaiting drone assignment.'
        });
    }
    next();
});

module.exports = mongoose.model('Mission', missionSchema);
