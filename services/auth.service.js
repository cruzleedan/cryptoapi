const { User } = require('../models');
const validator = require('validator');
const { to, TE, ReE } = require('./util.service');
const { hashColumns } = require('./hash.service');
const getUniqueKeyFromBody = function (body) { // this is so they can send in 3 options unique_key, email, or username and it will work
    let unique_key = body.unique_key;
    console.log('is undefined', (unique_key === undefined));
    if (typeof unique_key === undefined || !unique_key) {
        console.log('first');
        if (typeof body.email !== undefined && !!(body.email)) {
            console.log('unique = email');
            unique_key = body.email
        } else if (typeof body.username !== undefined && !!(body.username)) {
            console.log('unique = username');
            unique_key = body.username
        } else {
            console.log('unique = null');
            unique_key = null;
        }
    }

    return unique_key;
}
module.exports.getUniqueKeyFromBody = getUniqueKeyFromBody;

const createUser = async (userInfo, res) => {
    let unique_key, auth_info, err;

    auth_info = {};
    auth_info.status = 'create';

    unique_key = getUniqueKeyFromBody(userInfo);
    if (!unique_key) TE('Please enter your email or username.');

    if (validator.isEmail(unique_key)) {
        auth_info.method = 'email';
        userInfo.email = unique_key;

        console.log('UNIQUE KEY', unique_key);
        [err, user] = await to(User.create(userInfo));
        if (err) ReE(res, {email: 'User already exists with that email'}, 422);

        return user;

    } else if (validator.isAlphanumeric(unique_key)) { //checks if only username was sent
        auth_info.method = 'username';
        userInfo.username = unique_key;

        [err, user] = await to(User.create(userInfo));
        if (err) ReE(res, {username: 'User already exists with that username'}, 422);

        return user;
    } else {
        TE('Invalid email or username');
    }
}
module.exports.createUser = createUser;

const authUser = async function (userInfo) { //returns token
    let unique_key;
    let auth_info = {};
    auth_info.status = 'login';
    unique_key = getUniqueKeyFromBody(userInfo);
    console.log('unique_key', userInfo);
    if (!unique_key) TE('Please enter your email or username to login');


    if (!userInfo.password) TE('Please enter your password to login');

    let user, data;
    const fields = ['id', 'password', 'AcceptedTermsFlag', 'authMethod', 'avatar', 'blockFlag', 'createdAt', 'updatedAt', 'desc', 'email', 'gender', 'firstname', 'lastname', 'roles', 'score', 'username'];
    if (validator.isEmail(unique_key)) {
        auth_info.method = 'email';

        [err, user] = await to(User.findOne({
            where: {
                email: unique_key
            },
            attributes: fields
        }));
        if (err) TE(err.message);

    } else if (validator.isAlphanumeric(unique_key)) { //checks if only username was sent
        auth_info.method = 'username';

        [err, user] = await to(User.findOne({
            where: {
                username: unique_key
            },
            attributes: fields
        }));
        if (err) TE(err.message);

    } else {
        TE('Invalid email or username');
    }

    if (!user) TE('Not registered');
    console.log('USER', user);
    [err, data] = await to(user.comparePassword(userInfo.password));

    if (err) TE(err.message);
    return data;

}
module.exports.authUser = authUser;
