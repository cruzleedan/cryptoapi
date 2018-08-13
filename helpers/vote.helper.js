const { hashColumns } = require('../services/hash.service');
const { Review, User, Vote, sequelize, Sequelize } = require('../models');
const Op = Sequelize.Op;
const { to, ReE, ReS }  = require('../services/util.service');

const updateReviewVote = async (res, vote) => {
	let err, totalUpvotes, totalDownvotes, review;
	
	[err, totalUpvotes] = await to(
		Vote.count({
			where: {reviewId: vote.reviewId, voteType: 1},
			paranoid: true
		})
	);
	if(err) return ReE(res, err, 422);
	[err, totalDownvotes] = await to(
		Vote.count({
			where: {reviewId: vote.reviewId, voteType: 0},
			paranoid: true
		})
	);
	if(err) return ReE(res, err, 422);

	
	[err, review] = await to(
		Review.update({
			upvoteTally: totalUpvotes,
			downvoteTally: totalDownvotes
		}, {
			where: {id: vote.reviewId},
			paranoid: true
		})
		.then(() => {
			return Review.findById(vote.reviewId);
		})
	);
	if(err) return ReE(res, err, 422);

	review = hashColumns(['userId', 'id', 'entityId'], review);
	return review;
}
module.exports.updateReviewVote = updateReviewVote;