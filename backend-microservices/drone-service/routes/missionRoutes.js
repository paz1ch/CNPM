const express = require('express');
const router = express.Router();
const {
    getMissions,
    getMissionById,
    createMission,
    updateMissionStatus,
    cancelMission,
    getMissionByOrderId
} = require('../controllers/missionController');

router.route('/')
    .get(getMissions)
    .post(createMission);

router.get('/order/:orderId', getMissionByOrderId);

router.route('/:id')
    .get(getMissionById)
    .delete(cancelMission);

router.patch('/:id/status', updateMissionStatus);

module.exports = router;
