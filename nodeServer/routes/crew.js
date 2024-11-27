const express = require('express');
const {getAllcrewMembers, getCrewMemberById, addCrewMember, fillDropDowns} = require('../controllers/crewController')
const router = express.Router();



router.get('/', getAllcrewMembers);
router.get('/fillDropdowns', fillDropDowns);
router.get('/:id', getCrewMemberById);
router.post('/addCrewMember', addCrewMember)
module.exports = router;
