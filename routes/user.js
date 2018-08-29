const UserController 	= require('../controllers/user.controller');
const { permit } = require('../middleware/permission');
const { validate, validateImageFile } = require('../middleware/validation');
const { check } = require('express-validator/check');
const { ReE } = require('../services/util.service');
module.exports = (router, passport) => {
	router.get('/user', passport.authenticate('jwt', {session: false}), UserController.get);
	router.get('/users',
		[
			// check('filter').not().isEmpty().withMessage('Filter keyword is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		permit('admin'), 
		UserController.getUsers
	);
	router.get('/users/checkusername', UserController.checkUsernameNotTaken);
	router.get('/users/:id', 
		[
			check('id').not().isEmpty().withMessage('ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		permit('admin'), 
		UserController.findUserById
	);
	router.get('/user/entities', 
		[],
		validate,
		passport.authenticate('jwt', {session:false}), 
		UserController.getUserEntities
	);
	router.get('/user/reviews', 
		[],
		validate,
		passport.authenticate('jwt', {session:false}), 
		UserController.getUserReviews
	);
	router.get('/user/review/:id', 
		[
			check('id').not().isEmpty().withMessage('Review ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session:false}), 
		UserController.hasUserReviewedEntity
	);
	router.get('/user/entity/:id/owner',
		[
			check('id').not().isEmpty().withMessage('Entity ID is required'),
		],
		passport.authenticate('jwt', {session: false}),
		UserController.doesUserOwnsEntity
	);
	router.delete('/user/entity/:id', 
		[
			check('id').not().isEmpty().withMessage('Entity ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}),
		UserController.deleteUserEntity
	);
	router.delete('/user/:id', 
		[
			check('id').not().isEmpty().withMessage('ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		permit('admin'), 
		UserController.deleteUser
	);
	router.delete('/user/review/:id', 
		[
			check('id').not().isEmpty().withMessage('Review ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		UserController.deleteUserReview
	);
	router.put('/user', passport.authenticate('jwt', {session:false}), UserController.update);
	router.put('/user/:id/block',
		[
			check('id').not().isEmpty().withMessage('User ID is required'),
			check('block').not().isEmpty().withMessage('Block flag is required')
		],
		validate,
		passport.authenticate('jwt', {session:false}), 
		permit('admin'), 
		UserController.toggleUserBlock
	);
	router.put('/user/:id/profile',
		[
			check('id').not().isEmpty().withMessage('User ID is required')
		],
		validate,
		passport.authenticate('jwt', {session:false}), 
		permit('admin'), 
		UserController.updateUserProfile
	);
	router.put('/user/profile', passport.authenticate('jwt', {session:false}), UserController.updateProfile);
	router.put('/user/password-reset', passport.authenticate('jwt', {session:false}), UserController.passwordReset);
    router.post('/users', UserController.create);
    router.put('/users/new', 
    	validateImageFile('avatar'), 
    	passport.authenticate('jwt', {session: false}),
    	permit('admin'),
    	UserController.create
    );
	router.post('/users/login', 
		[
			check('username').not().isEmpty().withMessage('Username is required'),
			check('password').not().isEmpty().withMessage('Password is required')
		],
		validate,
		UserController.login
	);
	router.post('/user/forgot-password',
		[
			check('username').not().isEmpty().withMessage('Username or email is required')
		],
		validate,
		UserController.forgotPassword
	);
	router.put('/user/forgot-password-reset',
		[
			check('token').not().isEmpty().withMessage('Token is required'),
			check('newPassword').not().isEmpty().withMessage('New Password is required'),
		],
		validate,
		UserController.forgotPasswordReset
	);
	router.post('/users/facebook/token',
		[
			check('access_token').not().isEmpty().withMessage('Access Token missing')
		],
		validate,
		function(req, res, next) {
			passport.authenticate('facebook-token', {session: false}, function(err, user) {
				if(err) {
					return ReE(res, err.error, 422);
				}
				if(user) {
					req.user = user;
					return next();
				};
				return ReE(res, 'Failed to register user, please try again later.', 422);
			})(req, res, next);
		}, 
		UserController.fbLogin
	);
	router.delete('/users', passport.authenticate('jwt', {session:false}), UserController.remove);
}
