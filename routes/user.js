const UserController 	= require('../controllers/user.controller');
const { permit } = require('../middleware/permission');
const { validate } = require('../middleware/validation');
const { check } = require('express-validator/check');
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
	router.delete('/user/review/:id', 
		[
			check('id').not().isEmpty().withMessage('Review ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		UserController.deleteUserReview
	);
	router.put('/user', passport.authenticate('jwt', {session:false}), UserController.update);
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
	router.post('/users/login', 
		[
			check('username').not().isEmpty().withMessage('Username is required'),
			check('password').not().isEmpty().withMessage('Password is required')
		],
		validate,
		UserController.login
	);
	router.post('/users/facebook/token', passport.authenticate('facebook-token', {session: false}), UserController.fbLogin);
	router.delete('/users', passport.authenticate('jwt', {session:false}), UserController.remove);
}
