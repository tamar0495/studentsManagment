const express = require('express');
const {getAllMissions, getParamsForMission, addMission, getScoreForMission, getMaxScoreForMission} = require('../controllers/missionController')
const router = express.Router();



router.get('/', getAllMissions);
router.get('/:id', getParamsForMission);
router.post('/addMission', addMission);
router.get('/getScoreForMission/:studentId/:missionId', getScoreForMission);
router.get('/getMaxScoreForMission/:missionId',getMaxScoreForMission);
module.exports = router;
