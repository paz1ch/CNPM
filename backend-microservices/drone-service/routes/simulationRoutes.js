const express = require('express');
const router = express.Router();
const {
    startMissionSimulation,
    stopMissionSimulation
} = require('../controllers/simulationController');

router.post('/start/:missionId', startMissionSimulation);
router.post('/stop/:missionId', stopMissionSimulation);

module.exports = router;
