const express = require('express');
const {getValidatoinForStudent, getValidatoinForStudentInMission, addValidation, getValidationForMission, getValidationForParam} = require('../controllers/validationController')
const router = express.Router();



router.get('/getValidatoinForStudent/:id', getValidatoinForStudent);
router.get('/getValidatoinForStudentInMission/:id/:missionId', getValidatoinForStudentInMission);
router.post('/addValidation', addValidation);
router.get('getValidationForMission/:id',getValidationForMission);
router.get('getValidationForParam/:id',getValidationForParam);

module.exports = router;
