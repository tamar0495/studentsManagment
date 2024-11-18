const express = require('express');
const multer = require('multer');
const { getAllStudents, getStudentById, fillDropDowns, addStudent, editStudent, deleteStudent} = require('../controllers/studentController');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', getAllStudents);
router.get('/fillDropdowns', fillDropDowns);
router.get('/:id', getStudentById);
router.post('/addStudent', upload.single('image'), addStudent);
router.put('/editStudent', editStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
