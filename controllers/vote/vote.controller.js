const { User, Review, Vote, sequelize } = require('../../models');
const authService = require('../../services/auth.service');
const { decodeHash } = require('../../services/hash.service');
const { to, ReE, ReS } = require('../../services/util.service');
const { updateReviewVote } = require('../../helpers/vote.helper');

const vote = async (req, res) => {
	const userId = req.user.id;
    let reviewId = req.params['reviewId'],
    voteType = req.body['voteType'];

    if(!reviewId) return ReE(res, 'Review ID is required.', 422);
    reviewId = decodeHash(reviewId);

    let vote, err, userCastVote;
    [err, userCastVote] = await to(
        Vote.findOne({
            where: {userId, reviewId},
            paranoid: true
        })
    );
    if (err) return ReE(res, err, 422);
    if (userCastVote) return ReE(res, 'You are only allowed to vote once.', 422);
    return sequelize.transaction(transaction => {
    	return Vote.create({
    		userId,
    		reviewId,
    		voteType
    	})
    })
    .then(vote => {
		return updateReviewVote(res, vote);
	})
	.then(review => {
    	return ReS(res, {data: review, success: true}, 201);
	})
	.catch(err => {
        return ReE(res, err, 422);
    });
}
module.exports.vote = vote;