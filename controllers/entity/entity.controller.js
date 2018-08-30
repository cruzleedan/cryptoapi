const CONFIG = require('../../config');
const multer = require('multer');
const { Sequelize, sequelize, Entity, Review, User, Category } = require('../../models');
const {TE, to, ReS, ReE, tryParseJSON} = require('../../services/util.service');
const {hash, hashColumns, decodeHash} = require('../../services/hash.service');
const {filterFn} = require('../../helpers/filter.helper');
const Op = Sequelize.Op;
const path = require('path');
const validator = require('validator');
const findRemoveSync = require('find-remove');
const fs = require('fs');
// const getEntityPhoto = async function(req, res, next) {
//     const appDir = path.dirname(require.main.filename);
//     const fileName = req.params.filename;
//     const filePath = path.resolve(`${appDir}/../../${CONFIG.upload_dir}entities/images/${fileName}`);
//     res.sendFile(filePath, next);
// }
// module.exports.getEntityPhoto = getEntityPhoto;
const postEntityImage = async (req, res) => {
    let image = res.req && res.req.file && res.req.file.filename ? res.req.file : '';
    return ReS(res, {filename: image.filename});
};
module.exports.postEntityImage = postEntityImage;

const formatEntityDescImgSrc = (desc, id) => {
    id = hash(id);
    console.log('WILL be formating ', desc);
    let str;
    str = desc.replace(/src=['"](?:[^"'\/]*\/)*([^'"]+)['"]/g, "src='" + CONFIG.domain + '/entity/'+ id + "/$1'");
    console.log('returning ', str);
    return str;
}

const postNewEntity = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.user) return ReE(res, 'Unauthorized', 422);

    if(validator.isEmpty(req.body.categoryId)) return ReE(res, 'Entity Category is required');
    req.body.categoryId = decodeHash(req.body.categoryId);
    if(validator.isEmpty(req.body.desc)) return ReE(res, 'Entity Description is required');
    if(validator.isEmpty(req.body.name)) return ReE(res, 'Entity Name is required');

    let image = res.req && res.req.file && res.req.file.filename ? res.req.file : '';
    if(image) {
        req.body['image'] = image.filename;
    }
    let descImages = req.body['descImages'];
    descImages = JSON.parse(descImages);
    

    console.log('DESC IMAGES', descImages);
    // No error occured.
    Entity.create(Object.assign(req.body,{
        'userId': req.user.id,
        'links': JSON.parse(req.body.links) || []
    })).then(async (entity) => {
        const dir = `./public/images/entities/${entity.id}`;
        if(image && fs.existsSync(image.path)){
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            fs.rename(image.path, `${dir}/${image.filename}`, (err) => {
                if (err) throw err;
                console.log('Rename complete!');
            });
        }
        /*------------------------------ START ------------------------------
        | Transfer Description images to entities folder
        */
        if(descImages.length > 0) {
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            descImages.forEach((filename) => {
                const imgLoc = `./tmp/uploads/${filename}`;
                if(fs.existsSync(imgLoc)) {
                    fs.rename(imgLoc, `${dir}/${filename}`, (err) => {
                        if (err) throw err;
                        console.log('Rename complete!');
                    });
                }
            });
        }
        /*
        | Transfer Description images to entities folder
        | ------------------------------ END ------------------------------
        */
        const entityPlain = entity.get({plain: true});
        let desc = entityPlain.desc;
        desc = formatEntityDescImgSrc(desc, entityPlain.id);
        entity.set({
            desc
        });
        [err, entity] = await to(
            entity.save()
        );
        if(err) return ReE(res, err, 422);

        entity = hashColumns(['id', 'categoryId', 'userId'], entity);
        entity = Object.keys(entity)
        .filter(field => !['userId'].includes(field))
        .reduce((acc, key) => {
            acc[key] = entity[key];
            return acc;
        }, {});
        return ReS(res, {success: true, data: entity}, 201);
    }).catch(err => {
        console.log(err);
        return ReE(res, err, 422);
    });
}
module.exports.postNewEntity = postNewEntity;

const deleteImgFiles = (id, exceptArr) => {
    const directory = path.join(__dirname, './../../public/images/entities/'+id);
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            if(!exceptArr.includes(file)) {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    });
};

const updateEntity = async (req, res) => {
    if(!req.user) return ReE(res, 'Unauthorized', 422);

    let entityId = req.params['id'];
    if(!entityId) return ReE(res, 'Entity ID is required');
    entityId = decodeHash(entityId);
    let entity, err;
    [err, entity] = await to(Entity.findById(entityId));
    if(err) return ReE(res, err, 422)
    if(!entity) return ReE(res, 'Entity Not Found', 422);
    const dir = `./public/images/entities/${entity.id}`;

    if(validator.isEmpty(req.body.categoryId)) return ReE(res, 'Entity Category is required');
    req.body.categoryId = decodeHash(req.body.categoryId);
    if(validator.isEmpty(req.body.desc)) return ReE(res, 'Entity Description is required');
    if(validator.isEmpty(req.body.name)) return ReE(res, 'Entity Name is required');

    let image = res.req && res.req.file && res.req.file.filename ? res.req.file : '';
    if(image) {
        req.body['image'] = image.filename;
    }
    let descImages = req.body['descImages'];
    descImages = JSON.parse(descImages);
    console.log('DESC IMAGES', descImages);
    deleteImgFiles(entity.id, [...descImages, image, entity.image]);

    /*------------------------------ START ------------------------------
    | Transfer Description images to entities folder
    */
    if(descImages.length > 0) {
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        descImages.forEach((filename) => {
            const imgLoc = `./tmp/uploads/${filename}`;
            if(fs.existsSync(imgLoc)) {
                fs.rename(imgLoc, `${dir}/${filename}`, (err) => {
                    if (err) throw err;
                    console.log('Rename complete!');
                });
            }
        });
    }
    let desc = req.body.desc;
    desc = formatEntityDescImgSrc(desc, entity.id);
    req.body.desc = desc;
    
    /*
    | Transfer Description images to entities folder
    | ------------------------------ END ------------------------------
    */
   
    // No error occured.
    entity.set(Object.assign(req.body,{
        'userId': req.user.id,
        'links': JSON.parse(req.body.links) || []
    }));

    entity
    .save()
    .then(async (entity) => {
        
        if(image && fs.existsSync(image.path)){
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            fs.rename(image.path, `${dir}/${image.filename}`, (err) => {
                if (err) throw err;
                console.log('Rename complete!');
            });
        }
        
        

        entity = hashColumns(['id', 'categoryId', 'userId'], entity);
        entity = Object.keys(entity)
        .filter(field => !['userId'].includes(field))
        .reduce((acc, key) => {
            acc[key] = entity[key];
            return acc;
        }, {});
        return ReS(res, {success: true, data: entity}, 201);
    }).catch(err => {
        console.log(err);
        return ReE(res, err, 422);
    });
}
module.exports.updateEntity = updateEntity;
// const updateEntity = async (req, res) => {
//     console.log('------------------------- START --------------------------');
//     if(!req.user) return ReE(res, 'Unauthorized', 422);
//     let entityId = req.params['id'];
//     if(!entityId) return ReE(res, 'Entity ID is required');
//     entityId = decodeHash(entityId);
//     let entity, err;
//     [err, entity] = await to(Entity.findById(entityId));
//     if(err) return ReE(res, err, 422)
//     if(!entity) return ReE(res, 'Entity Not Found', 422);


//     const appDir = path.dirname(require.main.filename);
//     const uploadPath = `public/images/entities/${entityId}`;
//     const storage = multer.diskStorage({
//         destination: uploadPath,
//         filename: (req, file, callback) => { 
//             callback(null, file.originalname);
//         }
//     });
//     const upload = multer({storage}).single('image');
//     upload(req, res, (err) => {
//         if(err) return ReE(res, err, 422);
        
//         if(validator.isEmpty(req.body.categoryId)) return ReE(res, 'Entity Category is required');
//         req.body.categoryId = decodeHash(req.body.categoryId);
//         if(validator.isEmpty(req.body.desc)) return ReE(res, 'Entity Description is required');
//         if(validator.isEmpty(req.body.name)) return ReE(res, 'Entity Name is required');
        
//         // No error occured.
//         entity.set(Object.assign(req.body,{
//             'userId': req.user.id,
//             'image': res.req.file.filename || null,
//             'links': JSON.parse(req.body.links) || []
//         }));

//         entity.save().then(entity => {

//             entity = hashColumns(['id', 'categoryId', 'userId'], entity);
//             entity = Object.keys(entity)
//                         .filter(field => !['userId'].includes(field))
//                         .reduce((acc, key) => {
//                             acc[key] = entity[key];
//                             return acc;
//                         }, {});
//             return ReS(res, {success: true, data: entity}, 201);
//         }).catch(err => {
//             console.log(err);
//             return ReE(res, err, 422);
//         });
//     })
// }
// module.exports.updateEntity = updateEntity;

const getEntities = async (req, res) => {
    const queryParams = req.query,
    filter = JSON.parse(queryParams.filter),
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'entity_name',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize,
    filterFields = [];

    const config = {
        attributes: {
            // exclude: ['create_time', 'delete_time', 'update_time', 'user_id', 'entity_id']
        },
        order: [[sortField, sortDirection]],
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    return filterFn(res, {
        config,
        filter,
        filterFields,
        model: Entity,
        count: true,
        hashColumns: ['id', 'categoryId', 'userId']
    });
}
module.exports.getEntities = getEntities;

const getEntityById = async (req, res) => {
    let entityId = req.params.id;
    entityId = decodeHash(entityId);
    let err, entity, rating,
    excellentRating = 0,
    greatRating = 0,
    averageRating = 0,
    poorRating = 0,
    badRating = 0;

    [err, entity] = await to(
        Entity.findOne({
            where: {id: entityId},
            attributes: {
                exclude: ['update_time','delete_time','create_time','user_id','entity_category_id']
            },
            include: [{
                model: User,
                attributes: ['id', 'username']
            }, {
                model: Category, 
                attributes: ['category', 'id']
            }],
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    if(!entity) return ReE(res, 'Cannot find Entity', 422);

    [err, review] = await to(
        Review.findAndCountAll({
            where: {entityId: entity.id},
            attributes: ['rating']
        })
    );
    if(err) return ReE(res, err, 422);
    const ratings = JSON.parse(JSON.stringify(review.rows));
    for(let i = 0; i < review.count; i++) {
        rating = +ratings[i].rating;
        switch(rating){
            case 5:
                excellentRating++;
                break;
            case 4:
                greatRating++;
                break;
            case 3:
                averageRating++;
                break;
            case 2:
                poorRating++;
                break;
            case 1:
                badRating++;
                break;
        }
    }
    entity = hashColumns(['id', 'categoryId', 'userId', {'Category': ['id']}, {'User': ['id']}], entity);
    entity.excellentRating = excellentRating;
    entity.greatRating = greatRating;
    entity.averageRating = averageRating;
    entity.poorRating = poorRating;
    entity.badRating = badRating;
    entity.links = entity.links && entity.links instanceof Array ? entity.links : JSON.parse(entity.links || "[]");
    return ReS(res, {data: entity});
    
    
}
module.exports.getEntityById = getEntityById;

const getReviews = async (req, res) => {
    let err, reviews;
    const queryParams = req.query;
    let entityId = req.params.id;
    let filter = tryParseJSON(queryParams.filter);
    filter = filter ? filter : queryParams.filter;
    const filterField = queryParams.filterField || 'user_id',
    sortDirection = queryParams.sortDirection || 'asc',
    sortField = queryParams.sortField || 'createdAt',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize;
    entityId = decodeHash(entityId);
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
        where: {
            entityId
        },
        paranoid: true
    };
    
    return filterFn(res, {
        config,
        filter,
        filterFields,
        model: Review,
        count: true,
        hashColumns: ['id', 'entityId', 'userId', {'User': ['id']}]
    });



    // whereCond = () => {
    //     let cond = [{
    //         cond:`${ filterField } LIKE ${ '%'+filter+'%' }`,
    //         value: filter
    //     }, {
    //         cond: `entity_id = ${ +entityId }`,
    //         value: entityId
    //     }, {
    //         cond: `r.delete_time IS NULL`,
    //         value: true
    //     }]
    //     .filter((i) => i.value)
    //     .map((i) => i.cond)
    //     .join(' AND ');
    //     return cond.length ? `WHERE ${cond}`: '';
    // };
    // // I used raw query instead of sequeliz DAo for where clause but
    // // you could convert it into DAo to make it dialect agnostic
    // [err, reviews] = await to(
    //     sequelize.query(`
    //             SELECT r.review_id AS id 
    //                 , r.entity_id AS 'entityId'
    //                 , r.user_id AS 'userId'
    //                 , r.review_title AS 'title'
    //                 , r.review
    //                 , r.upvote_tally AS 'upvoteTally'
    //                 , r.downvote_tally AS 'downvoteTally'
    //                 , r.rating
    //                 , r.delete_time AS 'deletedAt'
    //                 , r.create_time AS 'createdAt'
    //                 , r.update_time AS 'updatedAt'
    //                 , (SELECT COUNT(*) FROM review sr WHERE sr.user_id = r.user_id AND sr.delete_time IS NULL) AS 'reviewCount'
    //                 , u.username
    //                 , u.avatar
    //             FROM review r
    //             LEFT JOIN user u
    //                 ON r.user_id = u.user_id
    //                 AND u.delete_time IS NULL
    //             ${ whereCond() }
    //             GROUP BY r.entity_id, r.user_id
    //             ORDER BY ${ sortField } ${ sortDirection }
    //             LIMIT ${ +initialPos }, ${ +finalPos }
    //     `, { type: sequelize.QueryTypes.SELECT})
    // );
    // let reviewsCount, error;
    // [error, entity] = await to(Entity.findById(entityId));

    // if(err || error) return ReE(res, err || error, 422);
    // return ReS(res, {data: reviews, count: entity.reviewCount }, 200);
}
module.exports.getReviews = getReviews;

const deleteEntity = async (req, res) => {
    let user = req.user, 
    entityId = req.params['id'],
    entity, err;
    entityId = decodeHash(entityId);
    [err, entity] = await to(
        Entity.findById(entityId)
    );
    if(err) return ReE(res, 'Cannot find the Entity', 422);
    const appDir = path.dirname(require.main.filename);
    const filePath = path.resolve(`${appDir}/public/images/entities/`);
    var result = findRemoveSync(filePath, {dir: entityId+''});
    return sequelize.transaction(transaction => {
        return entity.destroy()
    })
    .then(entity => {
        entity = hashColumns(['id', 'categoryId', 'userId'], entity);
        entity = Object.keys(entity)
                    .filter(field => !['userId', 'user_id', 'entity_category_id'].includes(field))
                    .reduce((acc, key) => {
                        acc[key] = entity[key];
                        return acc;
                    }, {});
        return ReS(res, {data: entity, images: result}, 200); 
    })
    .catch(err => {
        return ReE(res, err, 422);
    });
}
module.exports.deleteEntity = deleteEntity;