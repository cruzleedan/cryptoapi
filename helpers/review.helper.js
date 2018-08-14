const { Review, User, Entity, sequelize, Sequelize } = require('../models');
const Op = Sequelize.Op;
const { to, ReE, ReS }  = require('../services/util.service');
const calcEntityRating = (count, totalRating) => {
	if(!count || !totalRating) return 0;
	let rating = (totalRating / count);
	return rating;
}
const updateReviewRtng = async (res, review) => {
	const whereCond = {
		where: {
			entityId: review.entityId
		},
		paranoid: true
	};
	let err, entity, count, totalRating;
	[err, count] = await to(Review.count(whereCond));
	if(err) return ReE(res, err, 422);

	[err, totalRating] = await to(Review.sum('rating', whereCond));
	if(err) return ReE(res, err, 422);

	const overallRating = calcEntityRating(count, totalRating);
	[err, entity] = await to(
		Entity.update({
				reviewCount: count,
				rating: overallRating
			},
			{
				where: {
					id: review.entityId
				}
			}
		)
	);
	if(err) return ReE(res, err, 422);
	console.log(entity)
	return review;
};
module.exports.updateReviewRtng = updateReviewRtng;