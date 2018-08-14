const { Sequelize, sequelize, User, Review, Entity } = require('../models');
const Op = Sequelize.Op;
const multer = require('multer');
const path = require('path');
const { updateReviewRtng } = require('../helpers/review.helper');
const { filterFn } = require('../helpers/filter.helper');
const authService       = require('../services/auth.service');
const { to, ReE, ReS }  = require('../services/util.service');
const { hashColumns, decodeHash }  = require('../services/hash.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard;


const getEntities = async (req, res) => {
	const queryParams = req.query,
	field = queryParams.field,
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize;
    let err, entities;
    if(!['rating', 'createdAt', 'reviewCount'].includes(field)) return ReE(res, 'Invalid Request');
    const arr = ['id', 'entity_id', 'review', 'createdAt', 'rating', 'upvoteTally', 'downvoteTally'];
	[err, entities] = await to(
        Entity.findAll({
        	include: [{
        		model: Review,
        		required: false,
        		attributes: ['id', 'userId', 'entityId', 'title', 'review', 'upvoteTally', 'downvoteTally', 'rating', 'createdAt'],
        		// include: [{
        		// 	model: User,
        		// 	as: 'ReviewUser',
        		// 	attributes: ['id', 'username', 'avatar']
        		// }],
        		separate: true,
        		order: [['rating', 'desc']],
        		limit: 1
        	}],
        	order: [[field, 'desc']],
            offset: initialPos,
            limit: finalPos
        })
    );
    if(err) return ReE(res, err, 422);
    if(!entities) return ReE(res, 'Entity not found', 422);
    const reviewers_ids = entities.map(row => {
    	return row.Reviews && row.Reviews.length ? row.Reviews[0]['userId'] : false;
    }).filter(id => id);

    let reviewers;
    [err, reviewers] = await to(
    	User.findAll({
    		attributes: ['id', 'username', 'email', 'avatar'],
    		where: {id: {$in: reviewers_ids}}
    	})
    );

    if(err) return ReE(res, err, 422);
    entities = hashColumns(['id', 'userId', 'categoryId', {'Reviews': ['id', 'userId', 'entityId']}], entities);
    reviewers = hashColumns(['id'], reviewers);
    entities = entities.map(entity => {
    	if(entity.Reviews && entity.Reviews instanceof Array && entity.Reviews.length){
    		entity.Reviews = entity.Reviews.map(review => { 
    			const user = reviewers.filter(reviewer => reviewer.id === review.userId);
    			review.User = user && user.length ? user[0] : {};
    			return review;
    		});
    	}
    	return entity;
    })
    return ReS(res, {data: entities});
}
module.exports.getEntities = getEntities;