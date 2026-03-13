// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Allows your frontend to make requests to this backend
app.use(express.json()); // Allows the server to read JSON data sent from the frontend

// 1. Create MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // <-- REPLACE THIS (usually 'root')
    password: 'asha@1234', // <-- REPLACE THIS
    database: 'wellness_wave' 
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('✅ Successfully connected to MySQL Database!');
});

// 2. Create the Login API Endpoint
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;

    const query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = ?';
    
    db.query(query, [email, password, role], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            res.status(200).json({ message: 'Login successful', user: results[0] });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});


// Create the Register API Endpoint
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    const role = 'user'; // Automatically assign 'user' role to new signups

    // 1. First, check if the email is already in the database
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }
        
        // If results > 0, the email is already taken
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email is already registered. Please sign in.' });
        }

        // 2. If email is new, insert the new user into the database
        const insertQuery = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
        db.query(insertQuery, [email, password, role], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Server error' });
            }
            res.status(201).json({ message: 'Registration successful!' });
        });
    });
});

// Create the Booking API Endpoint
app.post('/api/book', (req, res) => {
    const { name, email, date, time, mode, reason } = req.body;

    const query = 'INSERT INTO appointments (name, email, date, time, mode, reason) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [name, email, date, time, mode, reason], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to book appointment' });
        }
        res.status(201).json({ message: 'Appointment booked successfully!' });
    });
});

// 3. Start the Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Backend server is running on http://localhost:${PORT}`);
});
