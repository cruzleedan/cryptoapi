const debug = require('debug');
const CONFIG = require('../config');
const multer = require('multer');
const { Sequelize, sequelize, Entity, Review, User, Category } = require('../models');
const {TE, to, ReS, ReE, tryParseJSON} = require('../services/util.service');
const {hash, hashColumns, decodeHash} = require('../services/hash.service');
const {filterFn} = require('../helpers/filter.helper');
const { isAdmin } = require('../helpers/admin.helper');
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
    debug('WILL be formating ', desc);
    let str;
    str = desc.replace(/src=['"](?:[^"'\/]*\/)*([^'"]+)['"]/g, "src='" + CONFIG.domain + '/entity/'+ id + "/$1'");
    debug('returning ', str);
    return str;
}

const postNewEntity = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.user) return ReE(res, 'Unauthorized', 422);

    if(validator.isEmpty(req.body.categoryId)){
        let category, err;
        [err, category] = await to(Category.findOne({
            attributes: ['id'],
            where: {
                category: 'coins'
            }
        }));
        if(err) return ReE(res, err, 422);
        console.log('CATEGORY ID', category.id);
        if(!category) return ReE(res, 'CategoryId is required', 422);
        req.body.categoryId = category.id;
    } else {
        req.body.categoryId = decodeHash(req.body.categoryId);
    }

    if(validator.isEmpty(req.body.desc)) return ReE(res, 'Entity Description is required');
    if(validator.isEmpty(req.body.name)) return ReE(res, 'Entity Name is required');

    let image = res.req && res.req.file && res.req.file.filename ? res.req.file : '';
    if(image) {
        req.body['image'] = image.filename;
    }
    let descImages = req.body['descImages'];
    descImages = JSON.parse(descImages);
    

    debug('DESC IMAGES', descImages);
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
                // if (err) throw err;
                debug('Rename complete!');
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
                        // if (err) throw err;
                        debug('Rename complete!');
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
        debug(err);
        return ReE(res, err, 422);
    });
}
module.exports.postNewEntity = postNewEntity;

const deleteImgFiles = (res, id, exceptArr) => {
    const directory = path.join(__dirname, './../../public/images/entities/'+id);
    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }
    fs.readdir(directory, (err, files) => {
        // if (err) throw err;

        for (const file of files) {
            if(!exceptArr.includes(file)) {
                fs.unlink(path.join(directory, file), err => {
                    // return ReE(res, err, 422);
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
    debug('DESC IMAGES', descImages);
    deleteImgFiles(res, entity.id, [...descImages, image, entity.image]);

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
                    // if (err) throw err;
                    debug('Rename complete!');
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
                // if (err) throw err;
                debug('Rename complete!');
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
        debug(err);
        return ReE(res, err, 422);
    });
}
module.exports.updateEntity = updateEntity;
// const updateEntity = async (req, res) => {
//     debug('------------------------- START --------------------------');
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
//             debug(err);
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
    let pending, err;

    const config = {
        where: {
            approved: true
        },
        attributes: {
            // exclude: ['create_time', 'delete_time', 'update_time', 'user_id', 'entity_id']
        },
        order: [[sortField, sortDirection]],
        offset: initialPos,
        limit: finalPos,
        paranoid: true
    };
    
    if(isAdmin(req, res)) {
        [err, pending] = await to(Entity.count({
            where: {approved: false}
        }));
        if (err) return ReE(res, err, 422);

        if(filter.hasOwnProperty('approved')) {
            config.where.approved = !!(filter.approved);
        } else {
            delete config.where.approved;
        }
    }

    const data = await filterFn(res, {
        config,
        filter,
        filterFields,
        model: Entity,
        count: true,
        hashColumns: ['id', 'categoryId', 'userId']
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

const approveEntity = async (req, res) => {
    let entityId = req.params.id;
    entityId = decodeHash(entityId);
    let err, entity, rating,
    superShady = 0,
    veryShady = 0,
    shady = 0,
    slightlyShady = 0,
    notShadyAtAll = 0;

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

    entity.set({approved: true});
    [err, entity] = await to(
        entity.save()
    );
    if(err) return ReE(res, err, 422);

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
                superShady++;
                break;
            case 4:
                veryShady++;
                break;
            case 3:
                shady++;
                break;
            case 2:
                slightlyShady++;
                break;
            case 1:
                notShadyAtAll++;
                break;
        }
    }
    entity = hashColumns(['id', 'categoryId', 'userId', {'Category': ['id']}, {'User': ['id']}], entity);
    entity.superShady = superShady;
    entity.veryShady = veryShady;
    entity.shady = shady;
    entity.slightlyShady = slightlyShady;
    entity.notShadyAtAll = notShadyAtAll;
    entity.links = entity.links && entity.links instanceof Array ? entity.links : JSON.parse(entity.links || "[]");
    return ReS(res, {data: entity});
}
module.exports.approveEntity = approveEntity;

const getEntityById = async (req, res) => {
    let entityId = req.params.id;
    entityId = decodeHash(entityId);
    let err, entity, rating,
    superShady = 0,
    veryShady = 0,
    shady = 0,
    slightlyShady = 0,
    notShadyAtAll = 0;

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
                superShady++;
                break;
            case 4:
                veryShady++;
                break;
            case 3:
                shady++;
                break;
            case 2:
                slightlyShady++;
                break;
            case 1:
                notShadyAtAll++;
                break;
        }
    }
    entity = hashColumns(['id', 'categoryId', 'userId', {'Category': ['id']}, {'User': ['id']}], entity);
    entity.superShady = superShady;
    entity.veryShady = veryShady;
    entity.shady = shady;
    entity.slightlyShady = slightlyShady;
    entity.notShadyAtAll = notShadyAtAll;
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
    
    const data = await filterFn(res, {
        config,
        filter,
        filterFields,
        model: Review,
        count: true,
        hashColumns: ['id', 'entityId', 'userId', {'User': ['id']}]
    });
    
    if(data.success) {
        return ReS(res, data);
    } else {
        return ReE(res, data);
    }
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