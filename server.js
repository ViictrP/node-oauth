import express from 'express';
import environment from './environment/environment';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import User from './model/user';
import jwt from 'jsonwebtoken';
import oauthUtils from './utils/oauthUtils';
import bcrypt from 'bcrypt';

// APP
const app = express();
const router = express.Router();
const BCRYPT_INDEX = 10;

// MONGODB CONNECTION
mongoose.connect('mongodb://localhost:27017/node-oauth-db', { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (err) => console.log('Conexão com database falhou', err));

// CONFIG
app.set('view engine', 'ejs');
app.use(express.static('views/assets'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/auth', router);

// ROUTES
/**
 * HOME
 */
router.get('/', (req, res) => res.render('index.ejs'));

/**
 * OAUTH REQUEST
 */
router.post('/oauth/token', getUser, (req, res) => {
    const userDTO = req.user;
    User.findOne({ username: userDTO.username }, (err, user) => {
        if (err) res.send(err);
        if (user) {
            if (bcrypt.compareSync(userDTO.password, user.password)) {
                jwt.sign({ user: user }, 'secret_key', { expiresIn: '3600s' }, (err, token) => {
                    if (err) {
                        res.status(500).send('System error');
                        return;
                    }
                    res.json({
                        "access_token": token,
                        "user": {
                            "id": user._id,
                            "email": user.email,
                            "name": user.name 
                        }
                    });
                });
            } else {
                res.status(422).send('Username or password is invalid');
            }
        } else {
            res.status(404).send('User doesn\'t exist');
        }
    });
});

/**
 * SAVE USERS
 */
router.post('/users', getUser, (req, res) => {
    console.log('CREATING USER');
    const user = req.user;
    const success = validateUser(user);
    if (success) {
        user.password = bcrypt.hashSync(user.password, BCRYPT_INDEX);
        user.save((err, usr) => {
            if (err) res.send(500, err);
            console.log('USER CREATED');
            res.status(201).json(usr);
        });
    } else {
        console.log('CREATING USER FAILED');
        res.status(422).send('User is invalid');
    }
    
});

/**
 * USERS
 */
router.get('/users', oauthUtils.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secret_key', (err, authData) => {
        if (err) res.send(err);
        User.find((err, users) => { 
            if (err) res.send(err);
            res.status(200).send(users);
        });
    });
});

/**
 * USER INFO BY USERNAME
 */
router.get('/users/:username', oauthUtils.verifyToken, (req, res) => {
    User.find({ username: req.params.username }, (err, user) => {
        if (err) res.send(err);
        res.send(200, user);
    });
});


//UTILS
function getUser (req, res, next) {
    const body = req.body;
    if (!body) res.status(422).send('User is null');
    var user = new User();
    user.name = body.name;
    user.email = body.email;
    user.username = body.email;
    user.password = body.password;
    req.user = user;
    next();
}

function validateUser(user) {
    var success = true;
    if (!user.name) success = false;
    if (!user.email) success = false;
    if (!user.username) success = false;
    if (!user.password) success = false;
    return success;
}

// INITIALIZE SERVER
db.once('open', () => app.listen(environment.port, () => console.log("Server running on " + environment.port)));
