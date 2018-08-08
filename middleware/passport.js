const { ExtractJwt, Strategy } = require('passport-jwt');
const FacebookTokenStrategy = require('passport-facebook-token');
const { User }      = require('../models');
const CONFIG        = require('../config');
const {to}          = require('../services/util.service');

module.exports = function(passport){
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = CONFIG.jwt_encryption;

    passport.use(new Strategy(opts, async (jwt_payload, done) => {
        let err, user;
        console.log('JWT PAYLOAD', jwt_payload);
        [err, user] = await to(User.findOne({ where: {id: jwt_payload.user_id}}));

        if(err) return done(err, false);
        if(user) {
            return done(null, user);
        }else{
            return done(null, false);
        }
    }));


    passport.use(new FacebookTokenStrategy({
        clientID: CONFIG.fb_client_id,
        clientSecret: CONFIG.fb_client_secret
    }, async (accessToken, refreshToken, profile, done) => {
        let err, user;
        [err, user] = await to (
            User.findOrCreate({where: {facebookId: profile.id}, defaults: {
                facebook_id: profile.id,
                auth_method: 'facebook',
                email: profile.emails[0].value
            }})
            .spread((user, created) => {
                return user;
            })
        );
        console.log('isError', !!(err));
        console.log('isUser', !!(user));
        if(err) return done(err, false);
        if(user) {
            return done(null, user);
        }else{
            return done(null, false);
        }
    }));
}


