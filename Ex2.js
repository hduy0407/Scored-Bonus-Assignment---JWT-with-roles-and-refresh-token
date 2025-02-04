const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');


const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(bodyParser.json());

const user = {
    username: 'duy',
    password: 'test123'
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({token});
    } else {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
});

const tokenMiddleware = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

app.get('/posts', tokenMiddleware, (req, res) => {
    res.json({message: "Early bird catches the worm"})
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})