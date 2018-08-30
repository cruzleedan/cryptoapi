const ReviewController = require('../controllers/review/review.controller');
const { permit } = require('../middleware/permission');
const { validate, validateImageFile } = require('../middleware/validation');
const { check } = require('express-validator/check');
const { ReE } = require('../services/util.service');
module.exports = (router, passport) => {
  	router.get('/reviews', ReviewController.getReviews);
  	router.get('/reviews/:id', 
  		[
			check('id').not().isEmpty().withMessage('ID is required'),
		],
		validate,
  		ReviewController.getReviewById
  	);
}
