const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getAllcrewMembers = async (req, res)  => {
        try {
            const request = new sql.Request();
            const result = await request.query(`SELECT 
            cm.crewMemberId,cm.userId,cm.gender,cm.tekenHours,cm.roleId,
            r.roleName,cm.branchId,b.branchName,cm.contactId,cm.recomendationId,
            cm.seniority,cm.salaryDegree
            FROM 
              mevakshei . dbo . crewMember  cm
            LEFT JOIN 
             mevakshei . dbo . roles  r ON cm.roleId = r.roleId
            LEFT JOIN 
             mevakshei . dbo . branches  b ON cm.branchId = b.branchId;`)
    
            res.status(200).json(result.recordset);
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'Server error', message: err.message });
        } 
};

exports.getCrewMemberById = async (req, res) => {
    const crewMemberId = parseInt(req.params.id, 10);
    if (!crewMemberId) {
        return res.status(400).json({ error: 'Missing or invalid crew member ID' });
    }
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT 
                cm.crewMemberId, cm.userId, cm.gender, cm.tekenHours, cm.roleId,
                r.roleName, cm.branchId, b.branchName, cm.contactId, cm.recomendationId,
                cm.seniority, cm.salaryDegree
            FROM 
                 mevakshei . dbo . crewMember  cm
            LEFT JOIN 
                 mevakshei . dbo . roles  r ON cm.roleId = r.roleId
            LEFT JOIN 
                 mevakshei . dbo . branches  b ON cm.branchId = b.branchId
            WHERE 
                cm.crewMemberId = ${crewMemberId};
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Crew member not found' });
        }

        res.status(200).json(result.recordset[0] );
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.addCrewMember = async (req,res) => {
    const {
        firstName, lastName, steetName, buildingAndApt,cityId, idNumber, birthDate 
        ,hebrewDateMonth, hebrewdate, password, email  
    } = req.body;
    try {
        const request = new sql.Request();
        // await request
        
        //     );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
