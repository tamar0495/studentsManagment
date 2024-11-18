const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getAlltests = async(req,res) => {
    try{
        const request = new sql.Request();
        const result = await request.query(`SELECT *
        from tests`);
        res.status(200).json(result.recordset);
    }
    catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.getTestsForStudent = async(req,res) => {
    const studentId = parseInt(req.params.id, 10);
    if (!studentId) {
        return res.status(400).json({ error: 'Missing or invalid student ID' });
    }
    try{
        const request = new sql.Request();
        const result = await request.input('studentId',sql.Int, studentId)
        .query(`SELECT 
    t.testId,
    t.testName,
    t.crewMember,
    t.date,
    t.minGrade,
    g.grade AS studentGrade,
    CASE 
        WHEN g.grade > t.minGrade THEN 'Yes' 
        ELSE 'No' 
    END AS gradeAboveMin,
    CASE 
        WHEN g.grade > (SELECT AVG(grade) FROM [mevakshei].[dbo].[grades] WHERE testId = t.testId) THEN 'Yes' 
        ELSE 'No' 
    END AS gradeAboveAverage
FROM 
    [mevakshei].[dbo].[tests] t
JOIN 
    [mevakshei].[dbo].[grades] g ON t.testId = g.testId
WHERE 
    g.studentId = @studentId;
;`);
        res.status(200).json(result.recordset);
    }
    catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }   
}

exports.getStudentsInTest = async(req,res) => {
    const testId = parseInt(req.params.id, 10);
    if (!testId) {
        return res.status(400).json({ error: 'Missing or invalid student ID' });
    }
    try{
        const request = new sql.Request();
        const result = await request.input('testId', sql.Int, testId)
        .query(`SELECT 
    t.testId,
    t.testName,
    t.crewMember,
    t.date,
    t.minGrade,
    g.studentId,
    g.grade,
    CASE 
        WHEN g.grade >= t.minGrade THEN 'Passed'
        ELSE 'Failed'
    END AS successStatus,
    CASE 
        WHEN g.grade >= AVG(g.grade) OVER (PARTITION BY t.testId) THEN 'Above Average'
        ELSE 'Below Average'
    END AS gradeComparison,
    (SELECT AVG(grade) FROM [mevakshei].[dbo].[grades] WHERE testId = t.testId) AS averageGrade
FROM 
    [mevakshei].[dbo].[tests] t
LEFT JOIN 
    [mevakshei].[dbo].[grades] g ON t.testId = g.testId
WHERE 
    t.testId = @testId;
`)
        res.status(200).json(result.recordset);
    }
    catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });  
    }

}