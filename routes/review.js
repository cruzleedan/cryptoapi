const ReviewController = require('../controllers/review/review.controller');
module.exports = (router, passport) => {
  	router.get('/reviews', ReviewController.getReviews);
  	router.get('/reviews/:id', ReviewController.getReviewById);
}
