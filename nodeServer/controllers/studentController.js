const sql = require('mssql');
const { HDate } = require('@hebcal/core');
const { request } = require('express');
const { getDbPool } = require('../config/dbConfig');
const hebrewMonths = ['ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול', 'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א', 'אדר ב'];//החודשים מתחילים מניסן כי ככה הספריה בנויה
const hebrewDates = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'];

exports.getAllStudents = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`SELECT s.studentId, s.cooperation, s.siblingsSum, s.welfareEligibilityStatusDate, s.studiesPaymentId,
       u.userId, u.firstName, u.lastName, u.email, u.birthDate, u.hebrewDateMonth, u.hebrewdate, u.idNumber,
       a.addressId, a.streetName, a.buildingAndApartmentNumber, a.cityId,
       c.cityName,
       p1.parentId as fatherId, p1.parentName AS fatherName, p1.phoneNumber AS fatherPhone, p1.addressId AS fatherAddressId,
       p2.parentId as motherId, p2.parentName AS motherName, p2.phoneNumber AS motherPhone, p2.addressId AS motherAddressId,
       ct.contactId, ct.contactName, ct.contactPhone, ct.contactRelation, ct.addressId AS contactAddressId,
	   i.imageId, i.imageData
FROM [mevakshei].[dbo].[student] s
JOIN [mevakshei].[dbo].[user] u ON s.userId = u.userId
LEFT JOIN [mevakshei].[dbo].[address] a ON u.addressId = a.addressId
LEFT JOIN [mevakshei].[dbo].cities c ON a.cityId = c.cityId
LEFT JOIN [mevakshei].[dbo].parents p1 ON s.parent1Id = p1.parentId
LEFT JOIN [mevakshei].[dbo].parents p2 ON s.parent2Id = p2.parentId
LEFT JOIN [mevakshei].[dbo].contact ct ON s.contactId = ct.contactId
LEFT JOIN [mevakshei].[dbo].[image] i ON s.imageId = i.imageId;`)


        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.getStudentById = async (req, res) => {
    const studentId = parseInt(req.params.id, 10);
    if (!studentId) {
        return res.status(400).json({ error: 'Missing or invalid student ID' });
    }
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT 
                s.studentId, s.cooperation, s.siblingsSum, s.welfareEligibilityStatusDate, s.studiesPaymentId,
                u.userId, u.firstName, u.lastName, u.email, u.birthDate, u.hebrewDateMonth, u.hebrewdate, u.idNumber,
                a.addressId, a.streetName, a.buildingAndApartmentNumber, a.cityId,
                c.cityName,
                p1.parentId as fatherId, p1.parentName AS fatherName, p1.phoneNumber AS fatherPhone, p1.addressId AS fatherAddressId,
                p2.parentId as motherId, p2.parentName AS motherName, p2.phoneNumber AS motherPhone, p2.addressId AS motherAddressId,
                ct.contactId, ct.contactName, ct.contactPhone, ct.contactRelation, ct.addressId AS contactAddressId,
                i.imageId, i.imageData
            FROM [mevakshei].[dbo].[student] s
            JOIN [mevakshei].[dbo].[user] u ON s.userId = u.userId
            LEFT JOIN [mevakshei].[dbo].[address] a ON u.addressId = a.addressId
            LEFT JOIN [mevakshei].[dbo].cities c ON a.cityId = c.cityId
            LEFT JOIN [mevakshei].[dbo].parents p1 ON s.parent1Id = p1.parentId
            LEFT JOIN [mevakshei].[dbo].parents p2 ON s.parent2Id = p2.parentId
            LEFT JOIN [mevakshei].[dbo].contact ct ON s.contactId = ct.contactId
            LEFT JOIN [mevakshei].[dbo].[image] i ON s.imageId = i.imageId
            WHERE s.studentId = ${studentId};
        `);

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.fillDropDowns = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('select * from cities; select * from profiles; select * from welfareEligibilityStatus; select * from familyStatus;select * from paymentStatuses;')

        res.status(200).json({
            cities: result.recordset[0] ? result.recordsets[0] : [result.recordsets[0]],
            profiles: result.recordset[1] ? result.recordsets[1] : [result.recordsets[1]],
            welfareEligibilityStatus: result.recordset[2] ? result.recordsets[2] : [result.recordsets[2]],
            familyStatus: result.recordset[3] ? result.recordsets[3] : [result.recordsets[3]],
            paymentStatuses: result.recordset[4] ? result.recordsets[4] : [result.recordsets[4]]
        });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Server error', message: err.message })
    }
};

exports.addStudent = async (req, res) => {
    const {
        firstName, lastName, idNumber, birthDate, siblingsSum, city, streetName, buildingAndApartmentNumber,
        fatherName, fatherCity, fatherStreet, fatherBuildingAndApt, fatherPhone, fatherFamilyStatus, fatherOccupation,
        motherName, motherCity, motherStreet, motherBuildingAndApt, motherPhone, motherFamilyStatus, motherOccupation,
        contactName, contactPhone, contactRelation, contactCity, contactStreet, contactBuildingAndApt,
        profileId, welfareEligibilityStatusId, welfareEligibilityStatusDate,
        paymentStatusId, wasPaid, discount
    } = req.body;


    const imageFile = req.file;

    try {
        const request = new sql.Request();

        let imageId = null;
        if (imageFile) {

            const imageResult = await request.input('imageName', sql.NVarChar, imageFile.originalName)
                .input('imageData', sql.VarBinary(sql.MAX), imageFile.buffer)
                .query(`INSERT INTO image (imageName, imageData)
                OUTPUT INSERTED.imageId
                VALUES (@imageName, @imageData);`);
            if (!imageResult || imageResult.recordset.length === 0) throw new Error('Failed to insert image');
            imageId = imageResult.recordset[0].imageId;

        }



        let hebrewBirthMonth = null;
        let hebrewDate = null;
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const hebrewBirthDate = new HDate(birthDateObj);
            let monthIndex = hebrewBirthDate.getMonth();
            hebrewBirthMonth = hebrewMonths[monthIndex - 1]
            let dateIndex = hebrewBirthDate.getDate();
            hebrewDate = hebrewDates[dateIndex - 1];
        }


        const addressResult = await request.input('streetName', sql.NVarChar, streetName || null)
            .input('buildingAndApartmentNumber', sql.NVarChar, buildingAndApartmentNumber || null)
            .input('city', sql.Int, city || null)
            .query(`INSERT INTO address (streetName, buildingAndApartmentNumber, cityId)
                OUTPUT INSERTED.addressId
                VALUES (@streetName, @buildingAndApartmentNumber, @city);
            `);
        if (!addressResult || addressResult.recordset.length === 0) throw new Error('Failed to insert address');
        const addressId = addressResult.recordset[0].addressId;

        const fatherAddressResult = await request.input('fatherStreet', sql.NVarChar, fatherStreet || null)
            .input('fatherBuildingAndApt', sql.NVarChar, fatherBuildingAndApt || null)
            .input('fatherCity', sql.Int, fatherCity || null)
            .query(`INSERT INTO address (streetName, buildingAndApartmentNumber, cityId)
            OUTPUT INSERTED.addressId
            VALUES (@fatherStreet, @fatherBuildingAndApt, @fatherCity);
        `);
        if (!fatherAddressResult || fatherAddressResult.recordset.length === 0) throw new Error('Failed to insert dad address');
        const fatherAddressId = fatherAddressResult.recordset[0].addressId;

        const motherAddressResult = await request.input('motherStreet', sql.NVarChar, motherStreet || null)
            .input('motherBuildingAndApt', sql.NVarChar, motherBuildingAndApt || null)
            .input('motherCity', sql.Int, motherCity || null)
            .query(`INSERT INTO address (streetName, buildingAndApartmentNumber, cityId)
                OUTPUT INSERTED.addressId
                VALUES (@motherStreet, @motherBuildingAndApt, @motherCity);
            `);
        if (!motherAddressResult || motherAddressResult.recordset.length === 0) throw new Error('Failed to insert mom address');
        const motherAddressId = motherAddressResult.recordset[0].addressId;

        const contactAddressResult = await request.input('contactStreet', sql.NVarChar, contactStreet || null)
            .input('contactBuildingAndApt', sql.NVarChar, contactBuildingAndApt || null)
            .input('contactCity', sql.Int, contactCity || null)
            .query(`INSERT INTO address (streetName, buildingAndApartmentNumber, cityId)
            OUTPUT INSERTED.addressId
            VALUES (@contactStreet, @contactBuildingAndApt, @contactCity);
        `);
        if (!contactAddressResult || contactAddressResult.recordset.length === 0) throw new Error('Failed to insert contact address');
        const contactAddressId = contactAddressResult.recordset[0].addressId;

        const UserResult = await request.input('firstName', sql.NVarChar, firstName || null)
            .input('lastName', sql.NVarChar, lastName || null)
            .input('idNumber', sql.NVarChar, idNumber || null)
            .input('birthDate', sql.Date, birthDate || null)
            .input('hebrewBirthMonth', sql.NVarChar, hebrewBirthMonth || null)
            .input('hebrewDate', sql.NVarChar, hebrewDate || null)
            .input('addressId', sql.Int, addressId || null)
            .query(`INSERT INTO [user] (firstName, lastName, idNumber, birthDate, addressId, hebrewDateMonth, hebrewDate)
                OUTPUT INSERTED.userId
                VALUES (@firstName, @lastName, @idNumber, @birthDate, @addressId, @hebrewBirthMonth, @hebrewDate);
            `);
        if (!UserResult || UserResult.recordset.length === 0) throw new Error('Failed to insert user');
        const userId = UserResult.recordset[0].userId;


        const contactResult = await request.input('contactName', sql.NVarChar, contactName || null)
            .input('contactPhone', sql.NVarChar, contactPhone || null)
            .input('contactRelation', sql.NVarChar, contactRelation || null)
            .input('contactAddressId', sql.Int, contactAddressId || null)
            .query(`INSERT INTO contact  (contactName, contactPhone, contactRelation, addressId)
            OUTPUT INSERTED.contactId VALUES (@contactName, @contactPhone, @contactRelation, @contactAddressId);`);
        if (!contactResult || contactResult.recordset.length === 0) throw new Error('Failed to insert contact');
        const contactId = contactResult.recordset[0].contactId;


        const studentResult = await request.input('userId', sql.Int, userId || null)
            .input('siblingsSum', sql.Int, siblingsSum || null)
            .input('welfareEligibilityStatusId', sql.Int, welfareEligibilityStatusId || null)
            .input('welfareEligibilityStatusDate', sql.Date, welfareEligibilityStatusDate || null)
            .input('profileId', sql.Int, profileId)
            .input('imageId', sql.Int, imageId || 10)//id of my defualt image
            .query(`INSERT INTO student (userId, siblingsSum, welfareEligibilityStatusId, welfareEligibilityStatusDate, profileId, imageId)
                 OUTPUT INSERTED.studentId
                 VALUES (@userId, @siblingsSum, @welfareEligibilityStatusId, @welfareEligibilityStatusDate, @profileId, @imageId);`);
        if (!studentResult || studentResult.recordset.length === 0) throw new Error('Failed to insert student');
        const studentId = studentResult.recordset[0].studentId;

        const newRequest = new sql.Request();
        const paymentResult = await newRequest.input('studentId', sql.Int, studentId || null)
            .input('paymentStatusId', sql.Int, paymentStatusId || null)
            .input('wasPaid', sql.Bit, wasPaid || null)
            .input('discount', sql.Bit, discount || null)
            .query(`INSERT INTO studiesPayment (studentId, paymentStatusId, wasPaid, discount)
                OUTPUT INSERTED.studiesPaymentId
            VALUES (@studentId, @paymentStatusId, @wasPaid, @discount)
            `);
        if (!paymentResult || paymentResult.recordset.length === 0) throw new Error('Failed to insert studiesPayment')
        const studiesPaymentId = paymentResult.recordset[0].studiesPaymentId;

        const fatherRequest = new sql.Request();
        const fatherResult = await fatherRequest.input('studentId', sql.Int, studentId || null)
            .input('fatherName', sql.NVarChar, fatherName || null)
            .input('fatherAddressId', sql.Int, fatherAddressId || null)
            .input('fatherPhone', sql.NVarChar, fatherPhone || null)
            .input('fatherOccupation', sql.NVarChar, fatherOccupation || null)
            .input('fatherFamilyStatus', sql.Int, fatherFamilyStatus || null)
            .query(`INSERT INTO parents (studentId, parentName,addressId,phoneNumber,job,familyStatusId,gender)
                    OUTPUT INSERTED.parentId
                VALUES (@studentId, @fatherName,@fatherAddressId, @fatherPhone, @fatherOccupation, @fatherFamilyStatus, 0)`)
        if (!fatherResult || fatherResult.recordset[0].length === 0) throw new Error('Failed to insert father');
        const fatherId = fatherResult.recordset[0].parentId;

        const motherRequest = new sql.Request();
        const motherResult = await motherRequest.input('studentId', sql.Int, studentId || null)
            .input('motherName', sql.NVarChar, motherName || null)
            .input('motherAddressId', sql.Int, motherAddressId || null)
            .input('motherPhone', sql.NVarChar, motherPhone || null)
            .input('motherOccupation', sql.NVarChar, motherOccupation || null)
            .input('motherFamilyStatus', sql.Int, motherFamilyStatus || null)
            .query(`INSERT INTO parents (studentId, parentName,addressId,phoneNumber,job,familyStatusId,gender)
                    OUTPUT INSERTED.parentId
                VALUES (@studentId, @motherName,@motherAddressId, @motherPhone, @motherOccupation, @motherFamilyStatus, 1)`)
        if (!motherResult || motherResult.recordset[0].length === 0) throw new Error('Failed to insert mother');
        const motherId = motherResult.recordset[0].parentId;

        await request.input('studentId', sql.Int, studentId || null)
            .input('studiesPaymentId', sql.Int, studiesPaymentId || null)
            .input('fatherId', sql.Int, fatherId || null)
            .input('motherId', sql.Int, motherId || null)
            .input('contactId', sql.Int, contactId || null)
            .query('UPDATE student SET studiesPaymentId = @studiesPaymentId, parent1Id =  @fatherId, parent2Id = @motherId, contactId = @contactId WHERE studentId = @studentId')

        res.status(201).json({ message: 'Student added successfuly' });

    } catch (err) {
        console.error('Error adding student:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.editStudent = async (req, res) => {
    const {
        studentId, userId, firstName, lastName, idNumber, birthDate, siblingsSum, city, streetName, buildingAndApartmentNumber,
        fatherId, fatherName, fatherCity, fatherStreet, fatherBuildingAndApt, fatherPhone, fatherFamilyStatus, fatherOccupation,
        motherId, motherName, motherCity, motherStreet, motherBuildingAndApt, motherPhone, motherFamilyStatus, motherOccupation,
        contactId, contactName, contactPhone, contactRelation, contactCity, contactStreet, contactBuildingAndApt,
        profileId, welfareEligibilityStatusId, welfareEligibilityStatusDate,
        paymentStatusId, wasPaid, discount, addressId, fatherAddressId, motherAddressId, contactAddressId 
    } = req.body;

    const imageFile = req.file;

    try {
        // Update image if a new image file is provided
        if (imageFile) {
            const imageRequest = new sql.Request();
            await imageRequest.input('imageId', sql.Int, imageId)
                .input('imageName', sql.NVarChar, imageFile.originalName)
                .input('imageData', sql.VarBinary(sql.MAX), imageFile.buffer)
                .query(`UPDATE image SET imageName = @imageName, imageData = @imageData WHERE imageId = @imageId`);
        }

        // Calculate Hebrew date equivalents
        let hebrewBirthMonth = null;
        let hebrewDate = null;
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const hebrewBirthDate = new HDate(birthDateObj);
            hebrewBirthMonth = hebrewMonths[hebrewBirthDate.getMonth() - 1];
            hebrewDate = hebrewDates[hebrewBirthDate.getDate() - 1];
        }

        // Update the user's address
        const userAddressRequest = new sql.Request();
        await userAddressRequest.input('streetName', sql.NVarChar, streetName || null)
            .input('buildingAndApartmentNumber', sql.NVarChar, buildingAndApartmentNumber || null)
            .input('city', sql.Int, city || null)
            .input('addressId', sql.Int, addressId)
            .query(`UPDATE address SET streetName = @streetName, buildingAndApartmentNumber = @buildingAndApartmentNumber, cityId = @city WHERE addressId = @addressId`);

        // Update father's address
        const fatherAddressRequest = new sql.Request();
        await fatherAddressRequest.input('fatherStreet', sql.NVarChar, fatherStreet || null)
            .input('fatherBuildingAndApt', sql.NVarChar, fatherBuildingAndApt || null)
            .input('fatherCity', sql.Int, fatherCity || null)
            .input('fatherAddressId', sql.Int, fatherAddressId)
            .query(`UPDATE address SET streetName = @fatherStreet, buildingAndApartmentNumber = @fatherBuildingAndApt, cityId = @fatherCity WHERE addressId = @fatherAddressId`);

        // Update mother's address
        const motherAddressRequest = new sql.Request();
        await motherAddressRequest.input('motherStreet', sql.NVarChar, motherStreet || null)
            .input('motherBuildingAndApt', sql.NVarChar, motherBuildingAndApt || null)
            .input('motherCity', sql.Int, motherCity || null)
            .input('motherAddressId', sql.Int, motherAddressId)
            .query(`UPDATE address SET streetName = @motherStreet, buildingAndApartmentNumber = @motherBuildingAndApt, cityId = @motherCity WHERE addressId = @motherAddressId`);

        // Update contact's address
        const contactAddressRequest = new sql.Request();
        await contactAddressRequest.input('contactStreet', sql.NVarChar, contactStreet || null)
            .input('contactBuildingAndApt', sql.NVarChar, contactBuildingAndApt || null)
            .input('contactCity', sql.Int, contactCity || null)
            .input('contactAddressId', sql.Int, contactAddressId)
            .query(`UPDATE address SET streetName = @contactStreet, buildingAndApartmentNumber = @contactBuildingAndApt, cityId = @contactCity WHERE addressId = @contactAddressId`);

        // Update user information
        const userRequest = new sql.Request();
        await userRequest.input('userId', sql.Int, userId || null)
            .input('firstName', sql.NVarChar, firstName || null)
            .input('lastName', sql.NVarChar, lastName || null)
            .input('idNumber', sql.NVarChar, idNumber || null)
            .input('birthDate', sql.Date, birthDate || null)
            .input('hebrewBirthMonth', sql.NVarChar, hebrewBirthMonth || null)
            .input('hebrewDate', sql.NVarChar, hebrewDate || null)
            .query(`UPDATE [user] SET firstName = @firstName, lastName = @lastName, idNumber = @idNumber, birthDate = @birthDate, hebrewDateMonth = @hebrewBirthMonth, hebrewDate = @hebrewDate WHERE userId = @userId`);

        // Update contact information
        const contactRequest = new sql.Request();
        await contactRequest.input('contactId', sql.Int, contactId || null)
            .input('contactName', sql.NVarChar, contactName || null)
            .input('contactPhone', sql.NVarChar, contactPhone || null)
            .input('contactRelation', sql.NVarChar, contactRelation || null)
            .query(`UPDATE contact SET contactName = @contactName, contactPhone = @contactPhone, contactRelation = @contactRelation WHERE contactId = @contactId`);

        // Update student information
        const studentRequest = new sql.Request();
        await studentRequest.input('studentId', sql.Int, studentId || null)
            .input('userId', sql.Int, userId || null)
            .input('siblingsSum', sql.Int, siblingsSum || null)
            .input('welfareEligibilityStatusId', sql.Int, welfareEligibilityStatusId || null)
            .input('welfareEligibilityStatusDate', sql.Date, welfareEligibilityStatusDate || null)
            .input('profileId', sql.Int, profileId || null)
            .query(`UPDATE student SET siblingsSum = @siblingsSum, welfareEligibilityStatusId = @welfareEligibilityStatusId, welfareEligibilityStatusDate = @welfareEligibilityStatusDate, profileId = @profileId WHERE studentId = @studentId`);

        // Update payment information
        const paymentRequest = new sql.Request();
        await paymentRequest.input('studentId', sql.Int, studentId || null)
            .input('paymentStatusId', sql.Int, paymentStatusId || null)
            .input('wasPaid', sql.Bit, wasPaid || null)
            .input('discount', sql.Bit, discount || null)
            .query(`UPDATE studiesPayment SET paymentStatusId = @paymentStatusId, wasPaid = @wasPaid, discount = @discount WHERE studentId = @studentId`);

        // Update father's information
        const fatherRequest = new sql.Request();
        await fatherRequest.input('fatherId', sql.Int, fatherId || null)
            .input('fatherName', sql.NVarChar, fatherName || null)
            .input('fatherPhone', sql.NVarChar, fatherPhone || null)
            .input('fatherOccupation', sql.NVarChar, fatherOccupation || null)
            .input('fatherFamilyStatus', sql.Int, fatherFamilyStatus || null)
            .query(`UPDATE parents SET parentName = @fatherName, phoneNumber = @fatherPhone, job = @fatherOccupation, familyStatusId = @fatherFamilyStatus WHERE parentId = @fatherId AND gender = 0`);

        // Update mother's information
        const motherRequest = new sql.Request();
        await motherRequest.input('motherId', sql.Int, motherId || null)
            .input('motherName', sql.NVarChar, motherName || null)
            .input('motherPhone', sql.NVarChar, motherPhone || null)
            .input('motherOccupation', sql.NVarChar, motherOccupation || null)
            .input('motherFamilyStatus', sql.Int, motherFamilyStatus || null)
            .query(`UPDATE parents SET parentName = @motherName, phoneNumber = @motherPhone, job = @motherOccupation, familyStatusId = @motherFamilyStatus WHERE parentId = @motherId AND gender = 1`);

        res.status(200).json({ message: 'Student updated successfully' });
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    const studentId = parseInt(req.params.id, 10);
    if (!studentId) {
        return res.status(400).json({ error: 'Missing or invalid student ID' });
    }

    let transaction;

    try {
        transaction = new sql.Transaction();
        await transaction.begin();

        const request = transaction.request();

        await request.query(`
            UPDATE student SET studiesPaymentId = NULL WHERE studentId = ${studentId};
        `);

        await request.query(`
            DELETE FROM studiesPayment WHERE studentId = ${studentId};
        `);

        await request.query(`
            UPDATE student
            SET parent1Id = NULL, parent2Id = NULL, imageId = NULL
            WHERE studentId = ${studentId};
        `);

        await request.query(`
            DELETE FROM parents WHERE studentId = ${studentId};
        `);

        await request.query(`
            DELETE FROM [user] WHERE userId = (SELECT userId FROM student WHERE studentId = ${studentId});
            DELETE FROM contact WHERE contactId = (SELECT contactId FROM student WHERE studentId = ${studentId});
            DELETE FROM [image] WHERE imageId = (SELECT imageId FROM student WHERE studentId = ${studentId});
        `);

        await request.query(`
            DELETE FROM [address] WHERE addressId IN (
                (SELECT addressId FROM [user] WHERE userId = (SELECT userId FROM student WHERE studentId = ${studentId})),
                (SELECT addressId FROM parents WHERE parentId = (SELECT parent1Id FROM student WHERE studentId = ${studentId})),
                (SELECT addressId FROM parents WHERE parentId = (SELECT parent2Id FROM student WHERE studentId = ${studentId})),
                (SELECT addressId FROM contact WHERE contactId = (SELECT contactId FROM student WHERE studentId = ${studentId}))
            );
        `);

        await request.query(`
            DELETE FROM student WHERE studentId = ${studentId};
        `);

        await transaction.commit();
        res.status(200).json({ message: 'Student and associated records deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err);

        if (transaction) {
            await transaction.rollback();
        }
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};