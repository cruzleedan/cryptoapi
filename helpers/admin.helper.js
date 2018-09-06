const isAdmin = (req, res) => {
	if(req.user && req.user.roles) {
        let userRoles = req.user.roles || [];
        try {
        	if(typeof userRoles === 'string') {
        		userRoles = JSON.parse(req.user.roles)
        	}
            userRoles = userRoles.map(r => r.toLowerCase());
        } catch (e) {
            userRoles = [];
        }
        return userRoles.includes('admin');
    }
    return false;
}
module.exports.isAdmin = isAdmin;