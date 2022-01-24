var express = require('express');
var router = express.Router();

router.get('/fields', function (req, res, next) {
	var queryString = {
		depth: "complete",
		// search : "?isStandard=false"
	}
	console.log(1234);
	console.log(b2bgerp_eloqua.assets.contacts);
	b2bgerp_eloqua.assets.contacts.fields.get(queryString).then((result) => {
		console.log(result.data);
		res.json(result.data);
	}).catch((err) => {
		console.error(err.message);
	});
});

router.get('/activities_log/:id', function (req, res, next) {
	var queryString = {
		type : "campaignMembership" ,
		startDate : 1627398000,
		endDate : 1627621200 ,
		count : 2
	}

	///api/REST/1.0/data/activities/contact/{id}
	console.log("call activity log");
	let id = req.params.id;
	console.log("activity logs : " +  req.params.id);

	old_eloqua.data.activities.get(id , queryString).then((result) => {
		console.log(result.data);
		res.json(result.data);
	}).catch((err) => {
		console.error(err);
	});
});


// option list api 
router.get('/optionlist_search', function (req, res, next) {
	var queryString = {
	}

	console.log();
	
	b2bgerp_eloqua.assets.optionLists.getOne(27 , queryString).then((result) => {
		console.log(result.data);
		res.json(result.data);
	}).catch((err) => {
		console.error(err);
	});
});


// // option list api 
// router.get('/optionlist_search', function (req, res, next) {
// 	var queryString = {
// 	}

// 	console.log();
	
// 	b2bgerp_eloqua.assets.optionLists.get(queryString).then((result) => {
// 		console.log(result.data);
// 		res.json(result.data);
// 	}).catch((err) => {
// 		console.error(err);
// 	});
// });





module.exports = router;