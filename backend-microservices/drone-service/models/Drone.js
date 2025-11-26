const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  battery: {
    type: Number,
    default: 100
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['IDLE', 'BUSY', 'CHARGING', 'RETURNING'],
    default: 'IDLE'
  },
  currentOrderId: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Drone', droneSchema);
