import express from 'express';
import environment from './environment/environment';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import User from './model/user';
import jwt from 'jsonwebtoken';
import oauthUtils from './utils/oauthUtils';

// APP
const app = express();

// MONGODB CONNECTION
mongoose.connect('mongodb://localhost:27017/node-oauth-db', { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', () => console.error.bind(console, 'connetion error:'));

// CONFIG
app.set('view engine', 'ejs');
app.use(express.static('views/assets'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ROUTES
/**
 * HOME
 */
app.get('/', (req, res) => res.render('index.ejs'));

/**
 * OAUTH REQUEST
 */
app.post('/oauth/token', (req, res) => {
    User.find({ username: req.body.username }, (err, user) => {
        if (err) res.send(err);
        const u = user[0];
        const userJwt = { username: u.username };
        jwt.sign({ user: userJwt }, 'secret_key', { expiresIn: '30s' }, (err, token) => {
            if (err) {
                res.status(500).send('System error');
                return;
            }
            res.json({
                token
            });
        });
    });
});

/**
 * SAVE USERS
 */
app.post('/users', (req, res) => {
    console.log('AUTHENTICATION INITIALIZED');
    const user = new User();
    user.username = req.body.username;
    user.password = req.body.password;
    user.save((err, usr) => {
        if (err) res.send(500, err);
        res.send(201, usr);
    });
    console.log('AUTHENTICATION FINALIZED');
});

/**
 * USERS
 */
app.get('/users', oauthUtils.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secret_key', (err, authData) => {
        if (err) res.send(err);
        User.find((err, users) => { 
            if (err) res.send(err);
            res.send(200, users);
        });
    });
});

/**
 * USER INFO BY USERNAME
 */
app.get('/users/:username', (req, res) => {
    User.find({ username: req.params.username }, (err, user) => {
        if (err) res.send(err);
        res.send(200, user);
    });
});


// INITIALIZE SERVER
db.once('open', () => app.listen(environment.port, () => console.log("Server running on " + environment.port)));
