const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/dbConfig');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();


app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/student'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
