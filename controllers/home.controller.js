const debug = require('debug');
const { Sequelize, sequelize, User, Review, Entity } = require('../models');
const Op = Sequelize.Op;
const multer = require('multer');
const path = require('path');
const { updateReviewRtng } = require('../helpers/review.helper');
const { filterFn } = require('../helpers/filter.helper');
const { isAdmin } = require('../helpers/admin.helper');
const authService = require('../services/auth.service');
const { to, ReE, ReS } = require('../services/util.service');
const { hashColumns, decodeHash }  = require('../services/hash.service');

const Dashboard = function(req, res){
	let user = req.user.id;
	return res.json({success:true, message:'it worked', data:'user name is :'});
}
module.exports.Dashboard = Dashboard;


const getEntities = async (req, res) => {
	const queryParams = req.query,
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize;
    let filter = queryParams.filter;
    try {
        filter = filter ? JSON.parse(queryParams.filter) : {};
    }
    catch (e) {
        filter = {};
    }
    let field = queryParams.field;
    let filterFields = [];
    let pending, err, entities;
    try {
        field = field ? JSON.parse(field) : [[]];
    } catch (e) {
        field = [['createdAt', 'desc']];
    }
    
    const isSortFieldsValid = () => {
        return field.every(sortField => {
            return ['rating', 'createdAt', 'reviewCount'].includes(sortField[0])
        });
    }
    if(!isSortFieldsValid()) return ReE(res, 'Invalid Request');
    const arr = ['id', 'entity_id', 'review', 'createdAt', 'rating', 'upvoteTally', 'downvoteTally'];



    const config = {
        where: {
            approved: true
        },
        include: [{
            model: Review,
            attributes: ['id', 'userId', 'entityId', 'title', 'review', 'upvoteTally', 'downvoteTally', 'rating', 'createdAt'],
            // include: [{
            //  model: User,
            //  as: 'ReviewUser',
            //  attributes: ['id', 'username', 'avatar']
            // }],
            separate: true,
            required: false,
            order: [['rating', 'desc']]
        }],
        order: field,
        offset: initialPos,
        limit: finalPos
    };
    if(typeof filter === 'object' && filter.hasOwnProperty('reviewsRequired')){
        config.include[0].required = !!(filter['reviewsRequired']);
        if (!!(filter['reviewsRequired'])) {
            // delete config.include[0].separate;
            config.include[0].duplicating = true;
            config.where.reviewCount = {$gt: 0};
        }
    }

    if(isAdmin(req, res)) {
        [err, pending] = await to(Entity.count({
            where: {approved: false}
        }));
        if (err) return ReE(res, err, 422);

        if(filter.hasOwnProperty('approved')) {
            config.where.approved = !!(filter.approved);
        } else {
            // delete config.where.approved;
        }
    }
	// [err, entities] = await to(
 //        Entity.findAll(config)
 //    );
 //    if(err) return ReE(res, err, 422);
 //    if(!entities) return ReE(res, 'Entity not found', 422);


    
 //    if(err) return ReE(res, err, 422);
 //    entities = hashColumns(['id', 'userId', 'categoryId', {'Reviews': ['id', 'userId', 'entityId']}], entities);
 //    return ReS(res, {data: entities});

    const data = await filterFn(res, {
        config,
        filter,
        filterFields,
        model: Entity,
        count: true,
        hashColumns: ['id', 'userId', 'categoryId', {'Reviews': ['id', 'userId', 'entityId']}]
    }, {
        pending
    });
    if(data.success) {
        return ReS(res, data);
    } else {
        return ReE(res, data);
    }
}
module.exports.getEntities = getEntities;