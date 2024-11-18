const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getValidatoinForStudent = async (req, res) => {
    const studentId = req.params.id;
    try{
        const request = new sql.Request();
        const result = await request.input('studentId', sql.Int, studentId)
        .query(`SELECT 
                v.validationId, v.studentId, v.missionId, v.paramId,
                v.bonusDone, v.date
                FROM 
                    validation v
                WHERE 
                v.studentId = @studentId;`)
        res.status(200).json(result.recordset);
    }
    catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
}

exports.getValidatoinForStudentInMission = async (req, res) => {
    const studentId = req.params.id;
    const missionId = req.params.id;

    try{
        const request = new sql.Request();
        const result = await request.input('studentId', sql.Int,studentId)
        .input('missionId',sql.Int,missionId)
        .query(`SELECT 
    v.validationId, v.studentId, v.missionId, v.paramId,
    v.bonusDone, v.date, p.paramScore,
    (CASE WHEN v.bonusDone = 1 THEN p.paramScore ELSE 0 END) AS scoreEarned
FROM 
    validation v
JOIN 
    paramsInMission pm ON v.missionId = pm.missionId AND v.paramId = pm.paramId
JOIN 
    parameters p ON pm.paramId = p.paramId
WHERE 
    v.studentId = @studentId
    AND v.missionId = @missionId;

SELECT 
    SUM(CASE WHEN v.bonusDone = 1 THEN p.paramScore ELSE 0 END) AS totalScore
FROM 
    validation v
JOIN 
    paramsInMission pm ON v.missionId = pm.missionId AND v.paramId = pm.paramId
JOIN 
    [parameters] p ON pm.paramId = p.paramId
WHERE 
    v.studentId = @studentId
    AND v.missionId = @missionId;
`)
res.status(200).json(result.recordset);

    }
catch(err){
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
}
}

exports.addValidation = async (req, res) => {
    const { validations } = req.body;

    // Validate the input array
    if (!validations || !Array.isArray(validations) || validations.length === 0) {
        return res.status(400).json({ message: 'Validations array is required and must not be empty' });
    }

    try {
        const request = new sql.Request();

        // Build the query dynamically
        const values = validations
            .map(({ studentId, missionId, paramId, bonusDone, date }, index) => {
                if (!studentId || !missionId || !paramId || bonusDone === undefined || !date) {
                    throw new Error(`Validation at index ${index} is missing required fields`);
                }
                return `(${studentId}, ${missionId}, ${paramId}, ${bonusDone ? 1 : 0}, '${date}')`;
            })
            .join(', ');

        // Insert all rows at once
        const query = `
            INSERT INTO validation (studentId, missionId, paramId, bonusDone, date)
            VALUES ${values};
        `;

        await request.query(query);

        // Respond after successful insertion
        res.status(201).json({ message: 'All validations added successfully' });
    } catch (error) {
        console.error('Error adding validation:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getValidationForMission = async (req, res) => {
    const missionId = req.params.id;
    if (!missionId) {
        return res.status(400).json({ message: 'Mission ID is required' });
    }
    try{
        const request = new sql.Request();
        const result = await request.input('missionId', sql.Int, missionId)
    }
    catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
    }
exports.getValidationForParam = async (req, res) => {
    
}
