'use strict';

module.exports.init = function (router, middleware) {
	router.get('/filter', middleware.buildHeader, async (req, res) => {
		// If you want query params for start/end, read req.query.start / req.query.end here
		res.render('filter', {});
	});

	// Optional API route if you need it:
	// router.get('/api/filter', async (req, res) => {
	//     res.json({ success: true });
	// });
};