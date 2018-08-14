const { Sequelize, Category, Entity } = require('../../models');
const Op = Sequelize.Op;
const {TE, to, ReS, ReE} = require('../../services/util.service');
const { hashColumns, decodeHash }  = require('../../services/hash.service');
const { filterFn } = require('../../helpers/filter.helper');

const getCategories = async (req, res) => {
    let categories, err;
    [err, categories] = await to(
        Category.findAll({
            attributes: {
                exclude: ['create_time', 'delete_time', 'update_time', 'createdAt', 'deletedAt', 'updatedAt', 'category'],
                include: [['category', 'name'],[Sequelize.fn("COUNT", Sequelize.col("entity_id")), "chip"]]
            },
            include: [{
                model: Entity,
                attributes: []
            }],
            paranoid: true,
            group: ['id']
        })
    );
    if(err) return ReE(res, err, 422);
    categories = hashColumns(['id'], categories);
    categories = categories.map(category => {
        if(!category.hasOwnProperty('sub')){
        }
        category = Object.assign({}, category, {link: category.id, open: false});
        return category;
    });
    return ReS(res, {data: categories} , 200);
}
module.exports.getCategories = getCategories;

const getCategoriesWithFilter = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const queryParams = req.query,
    filter = JSON.parse(queryParams.filter),
    sortDirection = queryParams.sortDirection || 'desc',
    sortField = queryParams.sortField || 'category',
    pageNumber = parseInt(queryParams.pageNumber),
    pageSize = parseInt(queryParams.pageSize) || 10,
    initialPos = isNaN(pageNumber) ? 0 : pageNumber * pageSize,
    finalPos = initialPos + pageSize,
    filterFields = [];

    const config = {
        attributes: {
            exclude: ['create_time', 'delete_time', 'update_time']
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
        model: Category,
        count: true,
        hashColumns: ['id']
    });

    // whereCond = () => {
    //     let cfg = {};

    //     Object.keys(filter).forEach((filterField) => {
    //         let fitlerValue = filter[filterField];
    //         if(!fitlerValue) return;
    //         let tblAttr = Category.tableAttributes,
    //             fieldExists = tblAttr.hasOwnProperty(filterField),
    //             type = fieldExists ? tblAttr[filterField].type.constructor.key: '',
    //             isString = ['STRING', 'TEXT'].indexOf(type) > -1;
    //             isNumber = ['INTEGER', 'DECIMAL', 'BIGINT'].indexOf(type) > -1,
    //             isDate = ['DATE'].indexOf(type) > -1,
    //             cond = {'STRING': isString, 'NUMBER': isNumber, 'DATE': isDate},
    //             fieldDT = (()=>{
    //                 let t;
    //                 for(key in cond) { 
    //                     if(cond[key]){
    //                         t = key;
    //                         break;
    //                     }
    //                 }
    //                 return t;
    //             })();

    //         if(fitlerValue && fieldDT == 'STRING') {
    //             cfg[filterField] = { [Op.like]: `%${fitlerValue}%` };
    //         } else if(fitlerValue && fieldDT == 'NUMBER') {
    //             cfg[filterField] = fitlerValue;
    //         } else if(fitlerValue && fieldDT == 'DATE') {
    //             let dayBefore = new Date(fitlerValue);
    //             dayBefore.setDate(dayBefore.getDate() + 1);
    //             cfg[filterField] = { [Op.between]: [new Date(fitlerValue), dayBefore]};
    //         }
    //     })
        
    //     return {where: cfg};
    // };

    // let categories, err;
    // [err, categories] = await to(
    //     Category.findAll(Object.assign(whereCond(),{
    //         offset: initialPos,
    //         limit: pageSize,
    //         order: [
    //             [sortField, sortDirection]
    //         ]
    //     }))
    // );
    
    // if(err) return ReE(res, err, 422);

    // return ReS(res, {data: categories, filter: filter}, 200);
};
module.exports.getCategoriesWithFilter = getCategoriesWithFilter;

const getCategoryById = async (req, res) => {
    let entityId = req.params['id'];
    entityId = decodeHash(entityId);
    let category, err;
    console.log('entityID', entityId);
    [err, category] = await to(Category.findById(entityId));

    if(err) return ReE(res, err, 422);
    category = category ? hashColumns(['id'], category) : {};
    return ReS(res, {data: category}, 200);
}
module.exports.getCategoryById = getCategoryById;

const checkCategoryNameNotTaken = async (req, res) => {
    let category, err,
    categoryName = req.query['categoryName'];
    if(!categoryName) return ReE(res, 'Category Name is required', 422);
    [err, category] = await to(
        Category.findOne({
            where: {
                category: categoryName
            },
            paranoid: true
        })
    );
    if(err) return ReE(res, err, 422);
    return ReS(res, {data: !!(category)}, 200);
}
module.exports.checkCategoryNameNotTaken = checkCategoryNameNotTaken;

const updateCategory = async (req, res) => {
    let category, err,
    categoryId = req.params['id'];
    if(!categoryId) return ReE(res, 'Category ID is required.', 422);
    categoryId = decodeHash(categoryId);
    [err, category] = await to(
        Category.findById(categoryId)
    );
    if(err) return ReE(res, err, 422);
    if(!category) return ReE(res, 'Category not found', 422);

    const uploadPath = `public/images/categories/${categoryId}/`;
    var storage = multer.diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => { 
            callback(null, file.originalname);
        }
    });
    var upload = multer({storage}).single('icon');
    upload(req, res, async (err) => {
        if(err) return ReE(res, err, 422);
        // No error occured.
        let data = req.body;
        if(res.req.file && res.req.file.filename) {
            data['icon'] = res.req.file.filename;
        }
        category.set(data);
        [err, category] = await to(category.save());
        if(err) return ReE(res, err, 422);
        category = hashColumns(['id'], category);
        return ReS(res, {data: category}, 200);
    });
}
module.exports.updateCategory = updateCategory;