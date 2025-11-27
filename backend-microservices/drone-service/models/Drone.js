const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
    // A unique, human-readable name for the drone
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // The specific model of the drone (e.g., "DJI Matrice 300 RTK")
    model: {
        type: String,
        required: true,
        default: 'Generic Delivery Drone'
    },
    // The current battery level as a percentage (0-100)
    batteryLevel: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    // The drone's current geographical location
    currentLocation: {
        lat: { type: Number, default: 0.0 },
        lng: { type: Number, default: 0.0 }
    },
    // The current operational status of the drone
    status: {
        type: String,
        enum: ['IDLE', 'DELIVERING', 'RETURNING', 'CHARGING', 'MAINTENANCE'],
        default: 'IDLE'
    },
    // The active mission the drone is assigned to. Null if idle.
    mission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission',
        default: null
    },
    // The maximum speed of the drone in km/h
    maxSpeed: {
        type: Number,
        default: 70 // km/h
    },
    // The maximum weight the drone can carry in kilograms
    payloadCapacity: {
        type: Number,
        default: 2.5 // kg
    }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = mongoose.model('Drone', droneSchema);
