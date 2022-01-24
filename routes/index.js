var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.send('test');
  // eloqua.assets.campaigns.get().then((result) => {
  //   console.log(result.data);
  // }).catch((err) => {
  //   console.error(err);
  // });

  // eloqua.assets.accounts.groups.get().then((result) => {
  //   console.log(result.data);
  // }).catch((err) => {
  //   console.error(err);
  // });

  
  // eloqua.assets.accounts.lists.get().then((result) => {
  //   console.log(result.data);
  // }).catch((err) => {
  //   console.error(err);
//  });

  //  eloqua.assets.contacts.lists.get().then((result) => {
  //    console.log(result.data);
  //  }).catch((err) => {
  //    console.error(err);
  //  });

  eloqua.assets.contacts.segments.get().then((result) => {
    console.log(result.data);
  }).catch((err) => {
    console.error(err);
  });

  //res.render('index', { title: 'Express111' });
 
});

module.exports = router;
