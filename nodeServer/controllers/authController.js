const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/dbConfig');

// Signup logic
exports.signup = async (req, res) => {
    const { email, password, id } = req.body;
    try {

        // Insert user into the database
        const request = new sql.Request();
        await request
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .input('id', sql.VarChar, id)
            .query(
                'INSERT INTO [user] ( email, password, idNumber) VALUES (@email, @password, @id)'
            );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password, captchaToken } = req.body;
//     const secretKey = 'YOUR_GOOGLE_RECAPTCHA_SECRET_KEY';
//   const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

//   try {
//     const captchaResponse = await axios.post(verificationUrl);
//     if (!captchaResponse.data.success) {
//       return res.status(400).json({ message: 'CAPTCHA verification failed' });
//     }
//     // Proceed with your login logic...
//   } catch (error) {
//     return res.status(500).json({ message: 'Error verifying CAPTCHA' });
//   }

    try {
        const request = new sql.Request();
        const result = await request
            .input('Email', sql.VarChar, email)
            .input('Password', sql.VarChar, password)
            .query(`SELECT * from [user] WHERE email = @email AND [password] = @password`)

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

       if (password !== user.password) {
        return res.status(400).json({error:'Invalid credentials'});
       }
        // // Create JWT token
        // const token = jwt.sign({ userId: user.userId }, 'your_jwt_secret', { expiresIn: '1h' });

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.loginWithId = async (req, res) => {
    const {id} = req.query;

    try{
        const request = new sql.Request();
        const result = await request
            .input('Id', sql.VarChar, id)
            .query (`SELECT COUNT(*) AS userCount FROM [mevakshei].[dbo].[user] WHERE [user].idNumber = @id;`);
       
        const userCount = result.recordset[0].userCount;

        res.status(200).json({userCount})        
        }
    catch(error){
        console.error('Error during loginWithId:', error);
        return res.status(500).json({ message: 'Server error' });
    }

};
