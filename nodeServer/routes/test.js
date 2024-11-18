const express = require('express');
const {getAlltests,getTestsForStudent,getStudentsInTest} = require('../controllers/testController')
const router = express.Router();



router.get('/', getAlltests);
router.get('/:id', getTestsForStudent);
router.get('/getTestResult/:id', getStudentsInTest);
module.exports = router;
