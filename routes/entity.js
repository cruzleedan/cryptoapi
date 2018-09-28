const EntityController = require('../controllers/entity.controller');
const ReviewController = require('../controllers/review.controller');
const VoteController = require('../controllers/vote.controller');
const { permit, permitAdminOrEntityPublisher } = require('../middleware/permission');
const { userBlock } = require('../middleware/block');
const {Review} = require('../models');
const { check } = require('express-validator/check');
const { validate, validateImageFile } = require('../middleware/validation');
const { to, ReE, ReS }  = require('../services/util.service');
const { decodeHash } = require('../services/hash.service');
const { Entity } = require('../models');

module.exports = (router, passport) => {
	router.get('/entities',
		// Authenticate using HTTP Basic credentials, with session support disabled,
		// and allow anonymous requests.
		passport.authenticate(['jwt', 'anonymous'], { session: false }),
		EntityController.getEntities
	);

	router.put('/entities/new',
		passport.authenticate('jwt', {session:false}), 
		validateImageFile('image'),
		userBlock,
		EntityController.postNewEntity
	);

	router.post('/entities/new/image',
		// passport.authenticate('jwt', {session:false}), 
		validateImageFile('file'),
		// userBlock,
		EntityController.postEntityImage
	);

	router.put('/entities/:id/edit',
		[
			check('id').not().isEmpty().withMessage('Entity ID is required.')
		],
		validate,
		passport.authenticate('jwt', {session:false}),
		validateImageFile('image'),
		// permit admin or entity creator
		permitAdminOrEntityPublisher,
		EntityController.updateEntity
	);

	// router.post('/entities/:id/edit',
	// 	[
	// 		check('id').not().isEmpty().withMessage('Entity ID is required.')
	// 	],
	// 	validate,
	// 	passport.authenticate('jwt', {session:false}),
	// 	// permit admin or entity creator
	// 	permit('admin', async (req, res, next) => {
	// 		const user = req.user;
	// 		const id = req.params['id'];
	// 		let entity,err;
	// 		[err, entity] = await to(Entity.findById(id));
	// 		if(err) return false;
	// 		if(!entity) return false;
	// 		if(user.hasEntity(entity)) {
	// 			next();
	// 		}
	// 		return false;
	// 	}),
	// 	EntityController.updateEntity
	// );

	router.delete('/entities/:id',
		[
			check('id').not().isEmpty().withMessage('Entity ID is required.')
		],
		validate,
		passport.authenticate('jwt', {session: false}),
		permit('admin'),
		EntityController.deleteEntity
	);

	router.get('/entities/:id', EntityController.getEntityById);
	router.post('/entities/:id/approved', 
		[
			check('id').not().isEmpty().withMessage('Entity ID is required.')
		],
		validate,
		passport.authenticate('jwt', {session: false}),
		permit('admin'),
		EntityController.approveEntity
	);
	router.put('/entities/:id/reviews/new',
		[
			check('id').not().isEmpty().withMessage('Entity ID is required'),
			check('review').not().isEmpty().withMessage('Review is required'),
			check('title').not().isEmpty().withMessage('Review title is required')
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		ReviewController.postNewReview
	);

	router.put('/entities/:id/reviews/update', 
		[
			check('id').not().isEmpty().withMessage('Entity ID is required')
		], 
		validate,
		passport.authenticate('jwt', {session: false}), 
		ReviewController.updateReview
	);

	router.put('/entities/reviews/:reviewId/vote', 
		[
			check('reviewId').not().isEmpty().withMessage('Review ID is required'),
			check('voteType').not().isEmpty().withMessage('Vote Type is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		VoteController.vote
	);

	router.get('/entities/:id/reviews', 
		[
			check('id').not().isEmpty().withMessage('Entity ID is required')
		],
		validate,
		EntityController.getReviews
	);
}
