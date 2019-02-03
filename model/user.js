import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    username: String,
    password: String
});

module.exports = mongoose.model('User', userSchema);