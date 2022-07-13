var express = require('express');
var router = express.Router();

router.get('/contacts_fields', function (req, res, next) {
	var queryString = {
		depth: "complete",
		// search : "?isStandard=false"
	}
	console.log(1234);
	console.log(lge_eloqua.assets.contacts);
	lge_eloqua.assets.contacts.fields.get(queryString).then((result) => {
		console.log(result.data);
		res.json(result.data);
	}).catch((err) => {
		console.error(err.message);
	});
});


router.get('/customobject_fields', function (req, res, next) {
	var queryString = {
		depth: "complete",
		// search : "?isStandard=false"
	}
	let customObject_id = req.query.cid;
	console.log(1234);
	// console.log(lge_eloqua.assets.customObjects);
	lge_eloqua.assets.customObjects.getOne(customObject_id , queryString).then((result) => {
		// console.log(result.data);
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

	lge_eloqua.data.activities.get(id , queryString).then((result) => {
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


	
	lge_eloqua.assets.optionLists.getOne(27 , queryString).then((result) => {
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
	
// 	lge_eloqua.assets.optionLists.get(queryString).then((result) => {
// 		console.log(result.data);
// 		res.json(result.data);
// 	}).catch((err) => {
// 		console.error(err);
// 	});
// });



router.post('/customobjectData_search', function (req, res, next) {
	let data = req.body.data;
	let status = req.body.status
	let parent_id = req.body.parent_id
	var queryString = {
		depth: "complete",
		// search : "?ATTRIBUTE_4_____1='" + email + "'" 
		search : status == 'email' ? "?ATTRIBUTE_4_____1='" + data + "'"  : "?LEAD_NUMBER1='" + data + "'" 
	}

	console.log(1234);
	// console.log(lge_eloqua.assets.customObjects);
	lge_eloqua.data.customObjects.data.get( parent_id , queryString).then((result) => {
		// console.log(result.data);
		res.json(result.data);
	}).catch((err) => {
		console.error(err.message);
	});
});


module.exports = router;