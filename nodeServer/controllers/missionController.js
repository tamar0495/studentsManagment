const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getAllMissions = async (req, res) => {
    try {     
        const request = new sql.Request();
        const result = await request.query(`SELECT *
        from mission`);
        res.status(200).json(result.recordset);
    }
    catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.getParamsForMission = async (req, res) => {
    const  missionId = parseInt(req.params.id, 10);
    if (! missionId) {
        return res.status(400).json({ error: 'Missing or invalid mission ID' });
    }
    try {
        const request = new sql.Request();
        const result = await request.input('missionId', sql.Int,  missionId)
            .query(`SELECT 
    p.paramId,
    p.paramName,
    p.paramScore,
    p.bonusOptions,
    p.bonusScore,
    p.startDate AS paramStartDate,
    p.endDate AS paramEndDate
FROM 
    [mevakshei].[dbo].[parameters] p
JOIN 
    [mevakshei].[dbo].[paramsInMission] pm ON p.paramId = pm.paramId
WHERE 
    pm.missionId = @missionId;`);
        res.status(200).json(result.recordset);
    }
    catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
}

exports.addMission = async (req, res) => {
    console.log(req.body);
    
    const {
         missionName, startDate, endDate, parameters
    }
        = req.body;
    
    try {
        const missionRequest = new sql.Request();
        const missionResult = await missionRequest
            .input('missionName', sql.NVarChar,  missionName)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`INSERT INTO [mevakshei].[dbo].[mission] ( missionName, startDate, endDate)
                OUTPUT INSERTED. missionId
                VALUES (@missionName, @startDate, @endDate);`);

        const missionId = missionResult.recordset[0]. missionId;

        for (const param of parameters) {
            const { paramName, paramScore, bonusOptions, bonusScore, paramStartDate, paramEndDate } = param;
            const paramRequest = new sql.Request();
            const paramResult = await paramRequest
                .input('paramName', sql.NVarChar, paramName)
                .input('paramScore', sql.Int, paramScore)
                .input('bonusOptions', sql.NVarChar, bonusOptions || null)
                .input('bonusScore', sql.Int, bonusScore ||null)
                .input('startDate', sql.Date, paramStartDate)
                .input('endDate', sql.Date, paramEndDate)
                .query(`MERGE [mevakshei].[dbo].[parameters] AS target
                    USING (VALUES (@paramName)) AS source (paramName)
                    ON target.paramName = source.paramName
                    WHEN MATCHED THEN 
                        UPDATE SET paramScore = @paramScore, bonusOptions = @bonusOptions, bonusScore = @bonusScore,
                                   startDate = @startDate, endDate = @endDate
                    WHEN NOT MATCHED THEN 
                        INSERT (paramName, paramScore, bonusOptions, bonusScore, startDate, endDate)
                        VALUES (@paramName, @paramScore, @bonusOptions, @bonusScore, @startDate, @endDate)
                    OUTPUT INSERTED.paramId;`);

            const paramId = paramResult.recordset[0].paramId;
            const linkRequest = new sql.Request();
            await linkRequest
                .input('missionId', sql.Int, missionId)
                .input('paramId', sql.Int, paramId)
                .query(`INSERT INTO [mevakshei].[dbo].[paramsInMission] (missionId, paramId)
                    VALUES (@missionId, @paramId);`);
        }
        res.status(201).json({ message: 'Mission and parameters added successfully.', missionId });

    } catch (err) {
        console.error('Error adding mission with parameters:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
}

exports.getScoreForMission = async (req, res) => {
    const { studentId, missionId } = req.params;
    const request = new sql.Request();
    try{
    const result = await request.input('studentId',sql.Int, studentId)
    .input('missionId',sql.Int, missionId)
    .query(`SELECT 
     v.paramId, p.paramName, p.paramScore, v.[date], v.bonusDone ,p.bonusScore
    FROM 
     [validation] v
    JOIN 
    [parameters] p ON v.paramId = p.paramId
        WHERE 
    v.studentId = @studentId AND v.missionId = @missionId
        ORDER BY 
    p.paramId, v.[date];
        `)
    res.json(result);
    }catch(err){
        console.error('Error fetching validations:', error);
        res.status(500).send('Server Error');
    }
}

exports.getMaxScoreForMission = async (req, res) => {
    const missionId = req.params.missionId;

    try {
        const request = new sql.Request();
        const result = await request.input('missionId', sql.Int, missionId)
            .query(`
                SELECT 
                    p.paramId, 
                    p.paramName, 
                    p.paramScore, 
                    p.bonusScore, 
                    p.startDate, 
                    p.endDate
                FROM 
                    [mevakshei].[dbo].[parameters] p
                JOIN 
                    [mevakshei].[dbo].[paramsInMission] pm ON p.paramId = pm.paramId
                WHERE 
                    pm.missionId = @missionId;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'No parameters found for this mission' });
        }

        let totalMaxScore = 0;
        let totalMaxScoreWithBonus = 0;

        const paramsMaxScores = result.recordset.map(param => {
            const startDate = new Date(param.startDate);
            const endDate = new Date(param.endDate);
            const daysDifference = (endDate - startDate) / (1000 * 3600 * 24); // Calculate days difference
            
            const maxScoreForParam = daysDifference * param.paramScore; // Base score
            const maxScoreWithBonus = maxScoreForParam + (param.bonusScore || 0); // Include bonusScore if present

            totalMaxScore += maxScoreForParam;
            totalMaxScoreWithBonus += maxScoreWithBonus;

            return {
                paramId: param.paramId,
                paramName: param.paramName,
                paramScore: param.paramScore,
                startDate: param.startDate,
                endDate: param.endDate,
                maxScoreForParam,
                maxScoreWithBonus
            };
        });

        // Return the result with max scores for each parameter and the totals
        res.status(200).json({
            totalMaxScore,
            totalMaxScoreWithBonus,
            parameters: paramsMaxScores
        });

    } catch (err) {
        console.error('Error calculating max score for mission:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

