const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://127.0.0.1:27017/userdb');
const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);
const registrationSchema = z.object({
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/login.htm');
});
app.get('/logout', (req, res) => {
    res.sendFile(__dirname + '/templates/login.htm');
});
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/templates/login.htm');
});
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});


app.post('/register', async (req, res) => {
    try {
        const validatedData = registrationSchema.parse(req.body);
        const existingUser = await User.findOne({
            $or: [{ username: validatedData.username }, { email: validatedData.email }]
        });

        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const newUser = new User({
            username: validatedData.username,
            email: validatedData.email,
            password: hashedPassword
        });

        await newUser.save();
        res.sendFile(__dirname + '/templates/login.htm');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user.');
        console.log(newUser);
    }
});

// Handle login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && await bcrypt.compare(password, user.password)) {
            res.sendFile(__dirname + '/templates/home.html');
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});