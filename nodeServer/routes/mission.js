const express = require('express');
const {getAllMissions, getParamsForMission, addMission} = require('../controllers/missionController')
const router = express.Router();



router.get('/', getAllMissions);
router.get('/:id', getParamsForMission);
router.post('/addMission', addMission);

module.exports = router;
