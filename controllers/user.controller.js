const { Sequelize, sequelize, User, Review, Entity } = require('../models');
const Op = Sequelize.Op;
const multer = require('multer');
const path = require('path');
const { updateReviewRtng } = require('../helpers/review.helper');
const { filterFn } = require('../helpers/filter.helper');
const authService       = require('../services/auth.service');
const { to, ReE, ReS }  = require('../services/util.service');
const { smtpTransport } = require('../services/mail.service');
const { hashColumns, decodeHash }  = require('../services/hash.service');
const fs = require('fs');
const crypto = require('crypto');
const CONFIG = require('../config');

const filterFieldsFn = (user, fields) => {
    fields = fields instanceof Array ? fields : ['create_time', 'update_time', 'delete_time', 'password', 'facebookId', 'authMethod', 'resetPasswordExpires', 'resetPasswordToken'];
    return Object.keys(user).filter(key => {
        return !fields.includes(key);
    }).reduce((acc, field) => {
        acc[field] = user[field];
        return acc;
    }, {})
};
const forgotPassword = async (req, res) => {
    const username = req.query['username'];
    let user, err;
    if(!username) return ReE(res, 'username is required', 422);
    [err, user] = await to(
        User.findOne({
            where: {
                [Op.or]: [{username}, {email: username}]
            },
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    if(!user) return ReE(res, 'User not found', 422);

    const resetPasswordToken = crypto.randomBytes(30).toString('hex');
    const resetPasswordExpires = Date.now() + 86400000;
    user.set({resetPasswordToken, resetPasswordExpires});
    [err, user] = await to(user.save());
    if(err) return ReE(res, err, 422);

    var data = {
        to: user.email,
        from: CONFIG.mailer_user,
        template: 'forgot-password-email',
        subject: 'Reset Password',
        context: {
            url: `${ CONFIG.frontend_domain }/auth/forgot-password-reset?token=${ resetPasswordToken }`,
            name: user.username || user.firstname
        }
    };
    if(!data.to) return ReE(res, 'Email not found', 422);
    smtpTransport.sendMail(data, function(err) {
        if (!err) {
            return ReS(res, { data: 'Kindly check your email for further instructions' });
        } else {
            return ReE(res, err, 422);
        }
    });
}
module.exports.forgotPassword = forgotPassword;

const create = async function(req, res){
    const body = req.body;
    let avatar = res.req && res.req.file && res.req.file.filename ? res.req.file : '';
    let matchedPassword = body.matchedPassword ? JSON.parse(body.matchedPassword) : {};
    if(avatar) {
        body['avatar'] = avatar.filename;
    }
    if(!body.unique_key && !body.email && !body.username){
        return ReE(res, 'Please enter an email or username to register.');
    } else if(!matchedPassword || !matchedPassword.new){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;
        body.password = matchedPassword.new;
        delete body.matchedPassword;
        try{
            body.roles = body.roles ? JSON.parse(body.roles) : [];
            body.roles = body.roles instanceof Array ? body.roles : [body.roles];
        } catch (e) {

        }
        [err, user] = await to(authService.createUser(body, res));
        
        if(err) return ReE(res, err, 422);
        console.log('USER', user);
        if(user && avatar && fs.existsSync(avatar.path)){
            const dir = `./public/images/avatars/${user.id}`
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            fs.rename(avatar.path, `${dir}/${avatar.filename}`, (err) => {
                if (err) throw err;
                console.log('Rename complete!');
            });
        }

        const token = user.getJWT();
        user = hashColumns(['id'], user);
        user = filterFieldsFn(user);
        return ReS(res, {message:'Successfully created new user.', user, token}, 201);
    }
}
module.exports.create = create;
const createUserProfile = async function(req, res){
    const avatar = res.req.file;
    if(fs.existsSync(avatar.path)){
        fs.rename(avatar.path, `./public/images/avatars/${avatar.filename}`, (err) => {
            if (err) throw err;
            console.log('Rename complete!');
        });
    }
    const body = req.body;
    console.log(res.req.file);
    return ReS(res, {body, 'file': res.req.file});
    // if(!body.unique_key && !body.email && !body.phone){
    //     return ReE(res, 'Please enter an email or username to register.');
    // } else if(!body.password){
    //     return ReE(res, 'Please enter a password to register.');
    // }else{
    //     let err, user;

    //     [err, user] = await to(authService.createUser(body, res));
        
    //     if(err) return ReE(res, err, 422);
    //     const token = user.getJWT();
    //     user = hashColumns(['id'], user);
    //     user = filterFieldsFn(user);
    //     return ReS(res, {message:'Successfully created new user.', user, token}, 201);
    // }
    // let err, user, data,
    // id = req.params['id'] ? decodeHash(req.params['id']) : null;
    // if(!id) return ReE(res, 'User ID is required', 422);
    
    // [err, user] = await to(
    //     User.findById(id)
    // );
    // if(err) return ReE(res, err, 422);

    // const appDir = path.dirname(require.main.filename);
    // const uploadPath = `public/images/avatars/${user.id}/`;

    
        
    // var storage = multer.diskStorage({
    //     destination: uploadPath,
    //     filename: (req, file, callback) => { 
    //         callback(null, file.originalname);
    //     }
    // });
    // var upload = multer({storage}).single('avatar');
    // upload(req, res, async (err) => {
    //     if(err) return ReE(res, err, 422);
    //     // No error occured.
    //     let data = req.body;
    //     if(res.req.file && res.req.file.filename) {
    //         data['avatar'] = res.req.file.filename;
    //     }
    //     data['roles'] = data.roles ? JSON.parse(data.roles) : '';
    //     user.set(data);
    //     [err, user] = await to(user.save());
    //     if(err){
    //         if(err.message=='Validation error') err = 'The email address or phone number is already in use';
    //         return ReE(res, err);
    //     }
    //     user = hashColumns(['id'], user);
    //     user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    //     user = filterFieldsFn(user);
    //     return ReS(res, {message :'Updated User: '+user.email, user});
    // });
}
module.exports.createUserProfile = createUserProfile;

const doesUserOwnsEntity = async(req, res) => {
    let user = req.user;
    let id = req.params['id'];
    id = decodeHash(id);
    let err, entity;
    [err, entity] = await to(Entity.findById(id));
    
    if(err) return ReE(res, err, 422);
    if(!entity) return ReE(res, 'Entity not found', 422);

    [err, owner] = await to(user.hasEntity(entity));
    if(err) return ReE(res, err, 422);
    return ReS(res, {data: !!(owner)}, 200);
}
module.exports.doesUserOwnsEntity = doesUserOwnsEntity;

const hasUserReviewedEntity = async(req, res) => {
    let user = req.user;
    let entityId = req.params['id'];
    if(!user) return ReE(res, 'UnAuthorized');
    if(!entityId) return ReE(res, 'Entity Id is required.');
    entityId = decodeHash(entityId);
    let review, err;
    [err, review] = await to(
        Review.findOne({
            where: {userId: user.id, entityId: entityId},
            include: [
                {
                    model: Entity,
                    attributes: ['id', 'name']
                }
            ]
        })
    );
    if(err) return ReE(res, err, 422);
    if(!review) return ReS(res, {data: []});
    review = hashColumns(['id', 'userId', 'entityId', {'Entity': ['id']}], review);
    return ReS(res, {success: true, data: review});
}
module.exports.hasUserReviewedEntity = hasUserReviewedEntity;

const checkUsernameNotTaken = async (req, res) => {
    const username = req.query['username'];
    let user, err;
    if(!username) return ReE(res, 'username is required', 422);
    [err, user] = await to(
        User.findOne({
            where: {username},
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    return ReS(res, {data: !!(user)}, 200);
}
module.exports.checkUsernameNotTaken = checkUsernameNotTaken;

const get = async function(req, res){
    res.setHeader('Content-Type', 'application/json');
    let user = req.user;
    let err, reviewCount, entitiesCount;
    [err, reviewsCount] = await to(
        Review.count({
            where: {
                userId: user.id
            },
            paranoid: true
        })
    );
    [err, entitiesCount] = await to(
        Entity.count({
            where: {
                userId: user.id
            },
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    user = hashColumns(['id'], user);
    user.reviewsCount = reviewsCount;
    user.entitiesCount = entitiesCount;
    user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    user = filterFieldsFn(user);
    return ReS(res, {user});
}
module.exports.get = get;

const findUserById = async (req, res) => {
    let id = req.params['id'];
    if(!id) return ReE(res, 'ID is required', 422);
    id = decodeHash(id);
    let err, user;
    [err, user] = await to(
        User.findById(id)
    );
    if(err) return ReE(res, err, 422);
    user = hashColumns(['id'], user);
    user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    user = filterFieldsFn(user);
    return ReS(res, {data: user});
}
module.exports.findUserById = findUserById;

const getUsers = async (req, res) => {
    let err, count;
    const fields = ['id', 'email', 'avatar', 'firstname', 'lastname', 'gender', 'roles', 'blockFlag', 'desc', 'authMethod', 'avatar', 'score', 'username', 'AcceptedTermsFlag'],
    queryParams = req.query,
    userId = req.user.id,
    filter = queryParams.filter || '',
    filterFields = queryParams.filterFields ? JSON.parse(queryParams.filterFields) : fields,
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'createdAt',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize;


    const order = [[sortField, sortDirection]];
    const config = {
        attributes: fields,
        order: order,
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    return filterFn(res, {
        config,
        filter,
        filterFields,
        model: User,
        count: true,
        parseToJSON: ['roles'],
        hashColumns: ['id']
    });
}
module.exports.getUsers = getUsers;

const getUserEntities = async (req, res) => {
    let err, reviews;
    const queryParams = req.query,
    userId = req.user.id,
    filter = queryParams.filter,
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'createdAt',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize,
    filterFields = [];
    

    
    const config = {
        where: {userId},
        attributes: ['id','name', 'desc', 'rating', 'reviewCount', 'image', 'createdAt'],
        order: [[sortField, sortDirection]],
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    return filterFn(res, {
        config,
        filter,
        filterFields,
        model: Entity,
        count: false,
        hashColumns: ['id']
    });

}
module.exports.getUserEntities = getUserEntities;

const getUserReviews = async (req, res) => {
    let err, reviews;
    const queryParams = req.query,
    userId = req.user.id,
    filter = queryParams.filter,
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'createdAt',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize,
    filterFields = [];
    

    
    const config = {
        where: {userId},
        attributes: {
            exclude: ['create_time', 'delete_time', 'update_time', 'user_id', 'entity_id']
        },
        include: [{
            model: Entity,
            attributes: ['id','name']
        }],
        order: [[sortField, sortDirection]],
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    return filterFn(res, {
        config,
        filter,
        filterFields,
        model: Review,
        count: false,
        hashColumns: ['id', 'entityId', 'userId', {'Entity': ['id']}]
    });

}
module.exports.getUserReviews = getUserReviews;

const deleteUserEntity = async (req, res) => {
    let user = req.user, 
    entityId = req.params['id'],
    entity, err;
    entityId = decodeHash(entityId);
    [err, entity] = await to(
        Entity.findOne({
            where: {userId:user.id, id: entityId}
        })
    );
    if(err) return ReE(res, 'Cannot find the record', 422);

    return sequelize.transaction(transaction => {
        return entity.destroy()
    })
    .then(entity => {
        return ReS(res, {data: entity}, 200); 
    })
    .catch(err => {
        return ReE(res, err, 422);
    });
}
module.exports.deleteUserEntity = deleteUserEntity;

const deleteUserReview = async (req, res) => {
    let user = req.user, 
    entityId = req.params['id'],
    review, err;
    entityId = decodeHash(entityId);
    [err, review] = await to(
        Review.findOne({
            where: {userId:user.id, entityId}
        })
    );
    if(err) return ReE(res, 'Cannot find the record', 422);

    return sequelize.transaction(transaction => {
        return review.destroy()
    })
    .then(status => updateReviewRtng(res, {entityId}))
    .then(review => {
        return ReS(res, {data: review}, 200); 
    })
    .catch(err => {
        return ReE(res, err, 422);
    });
}
module.exports.deleteUserReview = deleteUserReview;

const passwordReset = async (req, res) => {
    let err, currUser,
    user = req.user,
    password = req.body.password || '',
    newPassword = req.body.newPassword || '';

    [err, currUser] = await to(user.comparePassword(password));
    if(err) return res.status(401).json({success: false, error: {current: 'Current Password does not match'}});
    [err, currUser] = await to(user.comparePassword(newPassword));
    if(currUser) return res.status(401).json({success: false, error: {matchedPassword: {new: 'New Password should not be the same as your current one.'}}});
    user.password = newPassword;
    [err, currUser] = await to(user.save());
    if(err) return ReE(res, err, 422);
    return ReS(res, {success: true, data: true});
}
module.exports.passwordReset = passwordReset;


const forgotPasswordReset = async (req, res, next) => {
    const resetPasswordToken = req.body['token'],
    newPassword = req.body.newPassword || '';
    let user, err;
    [err, user] = await to(
        User.findOne({
            where: {
                resetPasswordToken,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }
        })
    );
    if(err) return ReE(res, err, 422);
    if(!user) return ReE(res, 'Password reset token is invalid or has expired.', 422);
    user.set({
        resetPasswordToken: null,
        resetPasswordExpires: null
    });

    user.password = newPassword;
    [err, currUser] = await to(user.save());
    if(err) return ReE(res, err, 422);

    var data = {
        to: user.email,
        from: CONFIG.mailer_user,
        template: 'reset-password-email',
        subject: 'Password Reset Confirmation',
        context: {
            name: user.username || user.firstname
        }
    };
    if(!data.to) return ReE(res, 'Email not found', 422);
    smtpTransport.sendMail(data, function(err) {
        if (!err) {
            return ReS(res, {success: true, data: true});
        } else {
            return ReE(res, err, 422);
        }
    });

  // User.findOne({
  //   reset_password_token: req.body.token,
  //   reset_password_expires: {
  //     $gt: Date.now()
  //   }
  // }).exec(function(err, user) {
  //   if (!err && user) {
  //     if (req.body.newPassword === req.body.verifyPassword) {
  //       user.hash_password = bcrypt.hashSync(req.body.newPassword, 10);
  //       user.reset_password_token = undefined;
  //       user.reset_password_expires = undefined;
  //       user.save(function(err) {
  //         if (err) {
  //           return res.status(422).send({
  //             message: err
  //           });
  //         } else {
  //           var data = {
  //             to: user.email,
  //             from: email,
  //             template: 'reset-password-email',
  //             subject: 'Password Reset Confirmation',
  //             context: {
  //               name: user.fullName.split(' ')[0]
  //             }
  //           };

  //           smtpTransport.sendMail(data, function(err) {
  //             if (!err) {
  //               return res.json({ message: 'Password reset' });
  //             } else {
  //               return done(err);
  //             }
  //           });
  //         }
  //       });
  //     } else {
  //       return res.status(422).send({
  //         message: 'Passwords do not match'
  //       });
  //     }
  //   } else {
  //     return res.status(400).send({
  //       message: 'Password reset token is invalid or has expired.'
  //     });
  //   }
  // });
};
module.exports.forgotPasswordReset = forgotPasswordReset;

const toggleUserBlock = async (req, res) => {
    let err, user, block, userId;
    userId = req.params['id'];
    if (!userId) return ReE(res, 'User Id is required');
    userId = decodeHash(userId);
    blockFlag = req.body.block;
    blockFlag = blockFlag ? JSON.parse(blockFlag) : blockFlag;
    
    [err, user] = await to(
        User.update({
            blockFlag
        }, {
            where: {
                id: userId
            }
        }).then(() => {
            return User.findById(userId);
        })
    );
    if(err) return ReE(res, err, 422);
    user = hashColumns(['id'], user);
    user = filterFieldsFn(user);
    return ReS(res, {user});
}
module.exports.toggleUserBlock = toggleUserBlock;

const update = async function(req, res){
    let err, user, data
    user = req.user;
    data = req.body.user;
    user.set(data);

    [err, user] = await to(user.save());
    if(err){
        if(err.message=='Validation error') err = 'The email address or phone number is already in use';
        return ReE(res, err);
    }
    user = hashColumns(['id'], user);
    user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    user = filterFieldsFn(user);
    return ReS(res, {message :'Updated User: '+user.email, user});
}
module.exports.update = update;

const updateUserProfile = async function(req, res){
    let err, user, data,
    id = req.params['id'] ? decodeHash(req.params['id']) : null;
    if(!id) return ReE(res, 'User ID is required', 422);
    
    [err, user] = await to(
        User.findById(id)
    );
    if(err) return ReE(res, err, 422);

    const appDir = path.dirname(require.main.filename);
    const uploadPath = `public/images/avatars/${user.id}/`;
    var storage = multer.diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => { 
            callback(null, file.originalname);
        }
    });
    var upload = multer({storage}).single('avatar');
    upload(req, res, async (err) => {
        if(err) return ReE(res, err, 422);
        // No error occured.
        let data = req.body;
        if(res.req.file && res.req.file.filename) {
            data['avatar'] = res.req.file.filename;
        }
        data['roles'] = data.roles ? JSON.parse(data.roles) : '';
        user.set(data);
        [err, user] = await to(user.save());
        if(err){
            if(err.message=='Validation error') err = 'The email address or phone number is already in use';
            return ReE(res, err);
        }
        user = hashColumns(['id'], user);
        user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
        user = filterFieldsFn(user);
        return ReS(res, {message :'Updated User: '+user.email, user});
    });
}
module.exports.updateUserProfile = updateUserProfile;

const updateProfile = async function(req, res){
    let err, user, data
    user = req.user;
    

    const appDir = path.dirname(require.main.filename);
    const uploadPath = `public/images/avatars/${user.id}/`;
    var storage = multer.diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => { 
            callback(null, file.originalname);
        }
    });
    var upload = multer({storage}).single('avatar');
    upload(req, res, async (err) => {
        if(err) return ReE(res, err, 422);
        // No error occured.
        const data = req.body;
        if(res.req.file && res.req.file.filename) {
            data['avatar'] = res.req.file.filename;
        }
        user.set(data);
        [err, user] = await to(user.save());
        if(err){
            if(err.message=='Validation error') err = 'The email address or phone number is already in use';
            return ReE(res, err);
        }
        user = hashColumns(['id'], user);
        user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
        user = filterFieldsFn(user);
        return ReS(res, {message :'Updated User: '+user.email, user});
    });
}
module.exports.updateProfile = updateProfile;

const remove = async function(req, res){
    let user, err;
    user = req.user;
    [err, user] = await to(user.destroy());
    if(err) return ReE(res, 'An Error occured trying to delete user');

    return ReS(res, {message:'Deleted User'}, 204);
}
module.exports.remove = remove;


const login = async function(req, res){
    const body = req.body;
    let err, user;
    [err, user] = await to(authService.authUser(body));
    if(err) return ReE(res, err, 422);
    const token = user.getJWT();
    user = hashColumns(['id'], user);
    user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    user = filterFieldsFn(user);
    return ReS(res, {token, user});
}
module.exports.login = login;

const fbLogin = async function(req, res){
    res.setHeader('Content-Type', 'application/json');
    let user = req.user;
    const token = user.getJWT();
    user = hashColumns(['id'], user);
    user.roles = user.roles && user.roles instanceof Array ? user.roles : JSON.parse(user.roles || "[]");
    user = filterFieldsFn(user);
    return ReS(res, {token, user});
}
module.exports.fbLogin = fbLogin;
