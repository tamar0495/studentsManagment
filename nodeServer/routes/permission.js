const express = require('express');
const {getAllpermissions,editPermissionForCrewMember} = require('../controllers/permissionController') 
const router = express.Router();



router.get('/', getAllpermissions);
router.put('/editPermissionForCrewMember', editPermissionForCrewMember);


module.exports = router;
