const sql = require('mssql');

// Database configuration
const dbConfig = {
     user: 'tamar0495',
     password: 'mt5868455',
    server: 'DESKTOP-FVU1ABL',
    database: 'mevakshei',
    port: 1433,
    options: {
        enableArithAbort: true,
        encrypt: false
    }
};

// Connect to the database
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to SQL database');
    } catch (err) {
        console.error('Database connection error: ', err);
    }
}

module.exports = {
    sql,
    connectDB
};
