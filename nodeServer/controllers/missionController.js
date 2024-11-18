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
    const {
         missionName, startDate, endDate, parameters
    }
        = req.body;
    try {
        const missionRequest = new sql.Request(transaction);
        const missionResult = await missionRequest
            .input(' missionName', sql.NVarChar,  missionName)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`INSERT INTO [mevakshei].[dbo].[ mission] ( missionName, startDate, endDate)
                OUTPUT INSERTED. missionId
                VALUES (@ missionName, @startDate, @endDate);`);

        const missionId = missionResult.recordset[0]. missionId;

        for (const param of parameters) {
            const { paramName, paramScore, bonusOptions, bonusScore, paramStartDate, paramEndDate } = param;
            const paramRequest = new sql.Request(transaction);
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
            const linkRequest = new sql.Request(transaction);
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