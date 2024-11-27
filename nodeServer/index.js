const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/dbConfig');

const app = express();
app.use(express.json());
app.use(cors());

connectDB();


app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/student'));
app.use('/api/crew', require('./routes/crew'));
app.use('/api/mission', require('./routes/mission'));
app.use('/api/test', require('./routes/test'));
app.use('/api/validation', require('./routes/validation'));
app.use('/api/permission', require('./routes/permission'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
