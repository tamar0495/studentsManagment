const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getAllpermissions = async (req, res) => {
    try {     
        const request = new sql.Request();
        const result = await request.query(`SELECT *
        from permissions`);
        res.status(200).json(result.recordset);
    }
    catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.editPermissionForCrewMember = async (req, res) => {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Invalid request format. Expecting a non-empty array of updates.' });
    }

    try {
        for (const update of updates) {
            const { crewMemberId, permissionId } = update;

            // Validate inputs
            if (!crewMemberId || !permissionId) {
                return res.status(400).json({
                    error: 'Invalid update format. Each update must include crewMemberId and permissionId.',
                });
            }

            // Create a new request for each query
            const request = new sql.Request();
            await request.input('crewMemberId', sql.Int, crewMemberId)
                .input('permissionId', sql.Int, permissionId)
                .query(`
                    UPDATE crewMember
                    SET permissionId = @permissionId
                    WHERE crewMemberId = @crewMemberId;
                `);
        }

        res.status(200).json({ message: 'Permissions updated successfully!' });
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
};



