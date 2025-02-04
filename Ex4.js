const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

app.use(bodyParser.json());


const users = [
    { username: 'admin', password: 'test123', role: 'admin' },
    { username: 'user', password: 'test123', role: 'user' }
];

const posts = [
    "Early bird catches the worm",
    "The early bird gets the worm",
];

let refreshTokens = []; 


app.post('/signin', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '15m' });

    const refreshToken = jwt.sign({ username: user.username }, REFRESH_SECRET_KEY, { expiresIn: '7d' });

    refreshTokens.push(refreshToken);
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    res.json({ accessToken, refreshToken });
});


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
 
app.get('/posts', authenticateToken, (req, res) => {
    res.json(posts);
});

app.post('/posts', authenticateToken, authorizeRole('admin'), (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }
    posts.push(message);
    res.json({ message: 'Post added successfully', posts });
});

// Route to refresh the access token
app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });

        const newAccessToken = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    });
});

// Logout endpoint (invalidate refresh token)
app.post('/logout', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    refreshTokens = refreshTokens.filter(token => token !== refreshToken);

    res.json({ message: 'Logged out successfully' });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});