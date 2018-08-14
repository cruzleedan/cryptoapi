const { Sequelize, sequelize, User, Review, Entity } = require('../models');
const Op = Sequelize.Op;
const multer = require('multer');
const path = require('path');
const { updateReviewRtng } = require('../helpers/review.helper');
const { filterFn } = require('../helpers/filter.helper');
const authService       = require('../services/auth.service');
const { to, ReE, ReS }  = require('../services/util.service');
const { hashColumns, decodeHash }  = require('../services/hash.service');

const create = async function(req, res){
    res.setHeader('Content-Type', 'application/json');
    const body = req.body;

    if(!body.unique_key && !body.email && !body.phone){
        return ReE(res, 'Please enter an email or username to register.');
    } else if(!body.password){
        return ReE(res, 'Please enter a password to register.');
    }else{
        let err, user;

        [err, user] = await to(authService.createUser(body, res));
        
        if(err) return ReE(res, err, 422);
        return ReS(res, {message:'Successfully created new user.', user:user.toWeb(), token:user.getJWT()}, 201);
    }
}
module.exports.create = create;

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
    review = hashColumns(['id'], review);
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
    let err, reviewCount;
    [err, reviewsCount] = await to(
        Review.count({
            where: {
                userId: user.id
            },
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    user = hashColumns(['id'], user);
    user.reviewsCount = reviewsCount;
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
    return ReS(res, {data: user});
}
module.exports.findUserById = findUserById;

const getUsers = async (req, res) => {
    let err, count;
    const fields = ['id', 'email', 'avatar', 'firstname', 'lastname', 'gender', 'roles', 'blockFlag', 'desc', 'authMethod', 'avatar', 'score', 'username', 'AcceptedTermsFlag'],
    queryParams = req.query,
    userId = req.user.id,
    filter = queryParams.filter,
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
        hashColumns: ['id']
    });
}
module.exports.getUsers = getUsers;

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
    return ReS(res, {token, user});
}
module.exports.login = login;

const fbLogin = async function(req, res){
    res.setHeader('Content-Type', 'application/json');
    let user = req.user;
    return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.fbLogin = fbLogin;
