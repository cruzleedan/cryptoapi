const { permit } = require('../middleware/permission');
const { validate } = require('../middleware/validation');
const { check } = require('express-validator/check');

const CategoryController = require('../controllers/category/category.controller');
module.exports = (router, passport) => {
    router.get('/categories/find', CategoryController.getCategoriesWithFilter);
    router.get('/categories/:id', CategoryController.getCategoryById);
    router.put('/categories/:id',
    	[
			check('id').not().isEmpty().withMessage('Category ID is required'),
		],
		validate,
		passport.authenticate('jwt', {session: false}), 
		permit('admin'), 
		CategoryController.updateCategory
	);
    router.get('/categories', CategoryController.getCategories);
    router.get('/categories/checkcategoryname', CategoryController.checkCategoryNameNotTaken)
}
