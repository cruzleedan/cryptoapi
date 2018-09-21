const debug = require('debug');
const { ExtractJwt, Strategy } = require('passport-jwt');
const AnonymousStrategy = require('passport-anonymous').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const FacebookTokenStrategy = require('passport-facebook-token');
const { User, Sequelize } = require('../models');
const Op = Sequelize.Op;
const CONFIG = require('../config');
const { to, ReE, ReS } = require('../services/util.service');

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
            let error, user;
            [error, user] = await to (
                User.findOne({
                    where: {
                        email: profile.emails[0].value,
                        facebookId: {
                            [Op.or]: [
                                {
                                    [Op.ne]: profile.id
                                }, 
                                null 
                            ]
                        }
                    }
                })
            );
            if(error) return done(error, false);
            if(user) return done(null, user);
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
            if(error) return done(error, false);
            if(user) {
                return done(null, user);
            }else{
                return done(null, false);
            }
        })
    );


    // Use the BasicStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, a username and password), and invoke a callback
    //   with a user object.
    // passport.use(new BasicStrategy(opts, async (jwt_payload, done) => {
    //     let err, user;
    //     console.log('JWT PAYLOAD', jwt_payload);
    //     [err, user] = await to(User.findOne({ where: {id: jwt_payload.user_id}}));

    //     if(err) return done(err, false);
    //     if(user) {
    //         return done(null, user);
    //     }else{
    //         return done(null, false);
    //     }
    // }));
    passport.use(new AnonymousStrategy());
}


