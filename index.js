/** @format */

const app = require("./app")

app.listen(process.env.PORT || 5000, (err) => {
	if (err) {
		console.log(err)
		console.log("Runing server error. Check error information")
		process.exit()
	} else {
		console.log(
			`Server listening on port http://localhost:${process.env.PORT}`
		)
	}
})
