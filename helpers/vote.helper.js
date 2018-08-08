const { hashColumns } = require('../services/hash.service');
const { Review, User, Vote, sequelize, Sequelize } = require('../models');
const Op = Sequelize.Op;
const { to, ReE, ReS }  = require('../services/util.service');

const updateEntityVote = async (res, vote) => {

	let err, totalUpvotes, totalDownvotes, review;

	if(vote.voteType){
		[err, totalUpvotes] = await to(
			Vote.count('type', {
				where: {reviewId: vote.reviewId, type: 1},
				paranoid: true
			})
		);
		if(err) return ReE(res, err, 422);
	}
	else {
		[err, totalDownvotes] = await to(
			Vote.count('type', {
				where: {reviewId: vote.reviewId, type: 0},
				paranoid: true
			})
		);
		if(err) return ReE(res, err, 422);
	}

	const body = vote.voteType ? {upvoteTally: totalUpvotes} : {downvoteTally: totalDownvotes};
	[err, review] = await to(
		Review.update(body, {
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
module.exports.updateEntityVote = updateEntityVote;