const debug = require('debug');
const { Review, User, Entity, sequelize, Sequelize } = require('../models');
const Op = Sequelize.Op;
const { to, ReE, ReS }  = require('../services/util.service');
const { hashColumns, decodeHash }  = require('../services/hash.service');
const {filterFn} = require('../helpers/filter.helper');
const { updateReviewRtng } = require('../helpers/review.helper');
const updateReview = async (req, res) => {
    // const userId = req.user.id,
    // entity_id = req.params['id'],
    // updatedReview = req.body;

    // if(!userId || !entity_id) return ReE(res, 'User Id and Entity Id are required.', 422);

    // let review, err;
    // [err, review] = await to(Review.update(updatedReview, {
    //         where: {entity_id: entity_id, user_id: user_id},
    //         individualHooks: true 
    //     })
    // );
    // if(err) return ReE(res, err, 422);
    // return ReS(res, {success: true, data: review}, 200);
}
module.exports.updateReview = updateReview;

const postNewReview = async (req, res) => {
	// res.setHeader('Content-Type', 'application/json');
	let entityId = req.params['id'];
	if(!entityId) return ReE(res, 'Entity Id is required', 422);
    if(!req.user) return ReE(res, 'Unauthorized', 422);

    entityId = decodeHash(entityId);

    const values = Object.assign(req.body, {
        'userId': req.user.id,
        entityId
    });
    const condition = {
    	'userId': req.user.id,
        entityId,
    };
    Review.findOne({ where: condition, paranoid: true })
	    .then((obj) => {
	        if(obj) { // update
	            return sequelize.transaction(transaction => {
                    return obj.update(values, {
                        transaction
                    });
                })
                .then(review => updateReviewRtng(res, review))
                .then(review => {
                    review = hashColumns(['id', 'entityId', 'userId'], review);
                    return ReS(res, {data: review, created: false, success: true}, 200); 
                })
                .catch(err => {
                    return ReE(res, err, 422);
                });
	        }
	        else { // insert
                return sequelize.transaction(transaction => {
                    return Review.create(values, {
                        transaction
                    });
                })
                .then(review => updateReviewRtng(res, review))
                .then(review => { 
                    review = hashColumns(['id', 'entityId', 'userId'], review);
	            	return ReS(res, {data: review, created: true, success: true}, 201); 
	        	})
	        	.catch(err => {
			        return ReE(res, err, 422);
			    });
	        }
	    })
}
module.exports.postNewReview = postNewReview;

const getReviews = async (req, res) => {
    let err, reviews;
    const queryParams = req.query;
    
    let filter = tryParseJSON(queryParams.filter);
    filter = filter ? filter : queryParams.filter;
    const filterField = queryParams.filterField || 'user_id',
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'createdAt',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize;
    filterFields = [];

    const config = {
        attributes: {
            exclude: ['create_time', 'delete_time', 'update_time', 'user_id', 'entity_id'],
        },
        include: [{
            model: User,
            attributes: {
                include: [
                    [sequelize.literal('(SELECT COUNT(*) FROM `review` sr WHERE sr.user_id = Review.user_id AND sr.delete_time IS NULL)'), 'reviewCount']
                ],
                exclude: ['roles', 'createdAt', 'updatedAt', 'deletedAt', 'create_time', 'update_time', 'delete_time', 'password', 'AcceptedTermsFlag', 'desc', 'facebookId', 'firstname', 'lastname', 'gender', 'authMethod', 'blockFlag']
            }
        }],
        order: [[sortField, sortDirection]],
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    const data = await filterFn(res, {
        config,
        filter,
        filterFields,
        model: Review,
        count: true,
        hashColumns: ['id', 'userId', {'User': ['id']}]
    });
    if(data.success) {
        return ReS(res, data);
    } else {
        return ReE(res, data);
    }
};
module.exports.getReviews = getReviews;

const getReviewById = async(req, res) => {
    let reviewId = req.params['id'];
    reviewId = decodeHash(reviewId);
    let review, err;
    [err, review] = await to(
    	Review.findById(reviewId, {
    		include: [
    			{
    				model: User,
                    required: true,
                    attributes: {
                        include: [
                            [sequelize.literal('(SELECT COUNT(*) FROM `review` sr WHERE sr.user_id = Review.user_id AND sr.delete_time IS NULL)'), 'reviewCount']
                        ],
                        exclude: ['roles', 'createdAt', 'updatedAt', 'deletedAt', 'create_time', 'update_time', 'delete_time', 'password', 'AcceptedTermsFlag', 'desc', 'facebookId', 'firstname', 'lastname', 'gender', 'authMethod', 'blockFlag']
                    }
    			},
    			{
    				model: Entity,
    				required: true,
    				attributes: [
    					'id', 'name', 'rating', 'reviewCount',
    					[sequelize.fn('LEFT', sequelize.col('entity_desc'), 200), 'desc']
    				]
    			}
    		]
    	})
    );
    if(err) return ReE(res, err, 422);
    if(!review) return ReE(res, 'Review not found', 422);
    review = hashColumns(['id', 'entityId', 'userId', {'Entity': ['id']}, {'User': ['id']}], review);
    return ReS(res, {data: review}, 200);
}
module.exports.getReviewById = getReviewById;

const getReviewsByEntityId = async(req, res) => {

}
module.exports.getReviewsByEntityId = getReviewsByEntityId;