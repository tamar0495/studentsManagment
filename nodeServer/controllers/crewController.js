const sql = require('mssql');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');

exports.getAllcrewMembers = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`SELECT 
	u.userId,
	c.crewMemberId,
	CONCAT(u.firstName,' ',u.lastName) AS fullName,
    u.idNumber,
    r.roleName,
    b.branchName,
	u.birthDate,
	u.email,
	c.tekenHours,
    CONCAT(a.streetName, ' ', a.buildingAndApartmentNumber, ', ', cities.cityName) AS fullAddress
    -- הוספת שדות נוספים לפי הצורך
FROM 
    crewMember c
INNER JOIN [user] u ON c.userId = u.userId
INNER JOIN roles r ON c.roleId = r.roleId
INNER JOIN branches b ON c.branchId = b.branchId
INNER JOIN address a ON u.addressId = a.addressId
INNER JOIN cities  ON a.cityId = cities.cityId
ORDER BY u.lastName ASC, u.firstName ASC;
;`)

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

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.addCrewMember = async (req, res) => {
    const {
        firstName, lastName, cityId, streetName, buildingAndApartmentNumber,
        idNumber, birthDate, email, gender, tekenHours, roleId,
        branchId, contactName, recomendation, recommender, seniority, salaryDegree
    } = req.body;

    try {
        const request = new sql.Request();

        // Insert address
        const addressResult = await request
            .input('streetName', sql.NVarChar, streetName || null)
            .input('buildingAndApartmentNumber', sql.NVarChar, buildingAndApartmentNumber || null)
            .input('city', sql.Int, cityId || null)
            .query(`INSERT INTO address (streetName, buildingAndApartmentNumber, cityId)
                OUTPUT INSERTED.addressId
                VALUES (@streetName, @buildingAndApartmentNumber, @city);`);

        if (!addressResult || !addressResult.recordset || addressResult.recordset.length === 0) {
            throw new Error('Failed to insert address');
        }

        const addressId = addressResult.recordset[0].addressId;

        // Insert user
        const userResult = await request
            .input('firstName', sql.NVarChar, firstName || null)
            .input('lastName', sql.NVarChar, lastName || null)
            .input('idNumber', sql.NVarChar, idNumber || null)
            .input('birthDate', sql.Date, birthDate || null)
            .input('addressId', sql.Int, addressId || null)
            .input('email', sql.NVarChar, email || null)
            .query(`INSERT INTO [user] (firstName, lastName, idNumber, birthDate, addressId)
                OUTPUT INSERTED.userId
                VALUES (@firstName, @lastName, @idNumber, @birthDate, @addressId);`);

        if (!userResult || !userResult.recordset || userResult.recordset.length === 0) {
            throw new Error('Failed to insert user');
        }

        const userId = userResult.recordset[0].userId;

        // Insert contact
        const contactResult = await request
            .input('contactName', sql.NVarChar, contactName)
            .query(`INSERT INTO contact (contactName)
                OUTPUT INSERTED.contactId
                VALUES (@contactName);`);

        if (!contactResult || !contactResult.recordset || contactResult.recordset.length === 0) {
            throw new Error('Failed to insert contact');
        }

        const contactId = contactResult.recordset[0].contactId;

        // Insert crew member
        const crewResult = await request
            .input('gender', sql.Bit, gender)
            .input('tekenHours', sql.Int, tekenHours)
            .input('roleId', sql.Int, roleId)
            .input('branchId', sql.Int, branchId)
            .input('contactId', sql.Int, contactId)
            .input('userId', sql.Int, userId)
            .input('seniority', sql.Int, seniority)
            
            .query(`INSERT INTO [crewMember] (gender, tekenHours, roleId, contactId,branchId,userId,seniority, permissionId)
                OUTPUT INSERTED.crewMemberId
                VALUES (@gender, @tekenHours, @roleId, @contactId,@branchId,@userId,@seniority,  1);`);

        if (!crewResult || !crewResult.recordset || crewResult.recordset.length === 0) {
            throw new Error('Failed to insert crew member');
        }

        res.status(201).json({ message: 'crew member added successfully' });
    } catch (err) {
        console.error('Error in addCrewMember:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.fillDropDowns = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`select * from cities; select * from branches; select * from roles; select * from permissions;`)
        res.status(200).json({
            cities: result.recordset[0] ? result.recordsets[0] : [result.recordsets[0]],
            branches: result.recordset[1] ? result.recordsets[1] : [result.recordsets[1]],
            roles: result.recordset[2] ? result.recordsets[2] : [result.recordsets[2]],
            permissions: result.recordset[3] ? result.recordsets[3] : [result.recordsets[3]],
        });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message })
    }
};
