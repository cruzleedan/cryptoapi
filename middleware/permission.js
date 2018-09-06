// middleware for doing role-based permissions
const permit = (...allowed) => {
	// return a middleware
	return (req, res, next) => {
		const isAllowed = (userRoles) => { 
			return allowed.some(allowedRole => {
				if(typeof allowedRole === 'function') {
					return allowedRole(req, res, next);
				}
				return userRoles.includes(allowedRole);
			}); 
		};
		let userRoles = req.user.roles || [];
		userRoles = typeof userRoles === 'object' && userRoles instanceof Array ? userRoles : [];
		if (req.user && isAllowed(userRoles)) {
			next(); // role is allowed, so continue on the next middleware	
		}
		else {
			return res.status(403).json({message: "Forbidden"}); // user is forbidden
		}
	}
}
// // account update & delete (PATCH & DELETE) are only available to account owner
// api.patch("/account", permit('owner'), (req, res) => req.json({message: "updated"}));
// api.delete("/account", permit('owner'), (req, res) => req.json({message: "deleted"}));
// // viewing account "GET" available to account owner and account member
// api.get("/account", permit('owner', 'employee'),  (req, res) => req.json({currentUser: request.user}));
module.exports.permit = permit;