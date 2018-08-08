sequelize
.query('CALL login (:email, :pwd, :device)', 
	{replacements: { email: "me@jsbot.io", pwd: 'pwd', device: 'android', }})
.then(v=>console.log(v))
.error(err=>console.log(err));



// express middleware
// error handling always takes 4 arguments to classify as an error handler
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
// i believe, it's the same with router level middleware
