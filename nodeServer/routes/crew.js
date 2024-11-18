const express = require('express');
const {getAllcrewMembers, getCrewMemberById} = require('../controllers/crewController')
const router = express.Router();



router.get('/', getAllcrewMembers);
router.get('/:id', getCrewMemberById);
router.post('/addCrewMember', )
module.exports = router;
