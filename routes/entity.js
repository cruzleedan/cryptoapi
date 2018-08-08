const EntityController = require('../controllers/entity/Entity.controller');
const ReviewController = require('../controllers/review/Review.controller');
const VoteController = require('../controllers/vote/Vote.controller');
const {Review} = require('../models');
const { check } = require('express-validator/check');
const { validate } = require('../middleware/validation');
module.exports = (router, passport) => {
	router.get('/entities', EntityController.getEntities);
	router.put('/entities/new',
		passport.authenticate('jwt', {session:false}), 
		EntityController.postNewEntity
	);
	router.get('/entities/:id', EntityController.getEntityById);
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
