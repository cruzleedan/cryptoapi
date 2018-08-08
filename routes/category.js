const CategoryController = require('../controllers/category/category.controller');
module.exports = (router, passport) => {
    router.get('/categories/find', CategoryController.getCategoriesWithFilter);
    router.get('/categories/:id', CategoryController.getCategoryById)
    router.get('/categories', CategoryController.getCategories);
}
