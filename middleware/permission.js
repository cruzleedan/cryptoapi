// middleware for doing role-based permissions
 const permit = (...allowed) => {
	const isAllowed = (userRoles) => { return allowed.some(allowedRole=>userRoles.includes(allowedRole)); };

	// return a middleware
	return (req, res, next) => {
		if (req.user && isAllowed(req.user.roles)) {
			next(); // role is allowed, so continue on the next middleware	
		}
		else {
			response.status(403).json({message: "Forbidden"}); // user is forbidden
		}
	}
}
// // account update & delete (PATCH & DELETE) are only available to account owner
// api.patch("/account", permit('owner'), (req, res) => req.json({message: "updated"}));
// api.delete("/account", permit('owner'), (req, res) => req.json({message: "deleted"}));
// // viewing account "GET" available to account owner and account member
// api.get("/account", permit('owner', 'employee'),  (req, res) => req.json({currentUser: request.user}));
module.exports.permit = permit;