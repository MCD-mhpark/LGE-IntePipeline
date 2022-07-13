var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var EloquaApi = require('./public/modules/eloqua-sdk');
var moment = require('moment');
const bodyParser = require('body-parser');
require('console-stamp')(console, {
    formatter: function() {
        return moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    }
});
var os = require('os');
const apiInfo = require('./config/apiInfo.json');



const schedule = require('node-schedule-tz');
// var engine = require('ejs-locals');


var integrated_Pipeline_Jobs;

// var oracledb = require('oracledb');
// var dbConfig = require('./config/dbconfig.js');

var FolderPath = '../';
var fs = require('fs');



function get_system_foldername()
{
	var result_data = "";

	fs.readdir(FolderPath, function(error, filelist){

		
	
		if (filelist != null && filelist.length > 0) {
			for(i=0; i<filelist.length; i++)
			{
				switch(filelist[i])
				{
					case "bscard": result_data = "bscard"; break;
					case "iam": result_data = "iam"; break;
					case "b2bgerp_global": result_data = "b2bgerp_global"; break;
					case "b2bgerp_kr": result_data = "b2bgerp_kr"; break;
					case "cs_intergration": result_data = "cs_intergration"; break;
				}
			}
		}
	});

	return result_data;
}

global.logManager = require('./routes/common/history.js');
// console.log(process.platform);
// console.log(dbConfig);

// oracle XE를 로컬에 설치하여 산기평에서 테스트 불가
// oracledb.getConnection(dbConfig, function (err, conn) {
//   console.log(123);
//     if(err){
//         console.log('접속 실패', err.stack);
//         return;
//     }
//     global.ora_conn = conn;
//     console.log('접속 성공');
// });

var index =  require('./routes/index'); 
// Data/contacts 만 쓰는 project
var b2bgerp_global_data_contacts = require('./routes/integrated_pipeline/global_contacts');
var b2bgerp_kr_us_data_contacts = require('./routes/integrated_pipeline/kr_contacts');
var etc_function = require('./routes/common/etc_function');

const { url } = require('inspector');

var app = express();

var module_files = path.join(process.cwd(), '../modules');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/modules', express.static(module_files));

app.use(bodyParser.json({limit: '50mb'})); //body 의 크기 설정
app.use(bodyParser.urlencoded({limit: '50mb', extended: true})); //url의 크기 설정
 
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'html');
// app.engine('html', engine);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/index', index);


app.use('/integrated_pipeline/global_contacts', b2bgerp_global_data_contacts);
app.use('/integrated_pipeline/kr_contacts', b2bgerp_kr_us_data_contacts);
app.use('/etc_function/', etc_function);


//============TEST용 Basic인증
// var b2bgerp_eloqua_config = {
// 	sitename: 'LGElectronics',
// 	username: 'Lg_api.B2b_global',
// 	password: 'QWert1234!@'
// };

// global.lge_eloqua = new EloquaApi(b2bgerp_eloqua_config);
//============TEST용 Basic인증

var lge_eloqua_config = apiInfo;
global.lge_eloqua = {};

app.get('/oauth', function(req, res, next) {

    console.log('oAuth 토큰 발행');

    //이하 임의 1회 통신하여 oAuth 토큰 발행 확인
	var code = req.query.code;
	lge_eloqua_config['code'] = code;
	global.lge_eloqua = new EloquaApi(lge_eloqua_config);

    var queryString = { depth: req.query.depth ? req.query.depth : 'minimal', search: "?name='TEST_LGEKR(한영본)_대표사이트B2B_온라인문의'" }

    lge_eloqua.assets.customObjects.get(queryString).then((result) => {
        console.log(result.data);
        res.json(result.data);
    }).catch((err) => {
        console.error(err.message);
        res.json(err);
    });
});

// token refresh scheduler
function schedule_oAuth_Token_Refresh() {
    let unique_jobs_name = "PIPELINE_OAUTH" +  moment().format('YYYYMMDD_HH');
	let second = "0";
    let minutes = "0";
	let hours = "*/6";
	let dayofmonth = "*";
	let month = "*";
	let weekindex = "*";
	var schedate = second + ' ' + minutes + ' ' + hours + ' ' + dayofmonth + ' ' + month + ' ' + weekindex;
    
    integrated_Pipeline_Jobs = schedule.scheduleJob(unique_jobs_name, schedate, "Asia/Seoul", async function() {
        await lge_eloqua.refreshToken();
    });
}

schedule_oAuth_Token_Refresh();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});




function schedule_Request_PIPELINE_GLOBAL(){
	let uniqe_jobs_name = "PIPELINE_GLOBAL" +  moment().format('YYYYMMDD');
	let second = "0";
	let minutes = "0";
	let hours = "12";
	let dayofmonth = "*";
	let month = "*";
	let weekindex = "*";
	var schedate = second + ' ' + minutes + ' ' + hours + ' ' + dayofmonth + ' ' + month + ' ' + weekindex;

	//test data
	integrated_Pipeline_Jobs = schedule.scheduleJob(uniqe_jobs_name,schedate,"Asia/Seoul" ,async function(){
		// let bant_list = ["AS" , "CLS" , "CM" , "ID" , "IT" , "Solution"];
		let bant_list = ["AS" , "CM" , "ID" , "IT" , "Solution"];
		bant_list.forEach( async BusinessName =>{
			await b2bgerp_global_data_contacts.pipe_global_bant_send(BusinessName);
		})
			
	});
}

function schedule_Request_PIPELINE_KR(){
	let uniqe_jobs_name = "PIPELINE_KR" +  moment().format('YYYYMMDD');
	let second = "0";
	let minutes = "*/10";
	let hours = "*";
	let dayofmonth = "*";
	let month = "*";
	let weekindex = "*";
	var schedate = second + ' ' + minutes + ' ' + hours + ' ' + dayofmonth + ' ' + month + ' ' + weekindex;

	//test data
	integrated_Pipeline_Jobs = schedule.scheduleJob(uniqe_jobs_name,schedate,"Asia/Seoul" ,async function(){
		await b2bgerp_kr_us_data_contacts.pipe_kr_bant_send();
	});
}

// Leadnumber update 테스트용 스케쥴러
function schedule_Request_PIPELINE_LEADUPDATE(){
	let uniqe_jobs_name = "PIPELINE_LEADUPDATE" +  moment().format('YYYYMMDD');
	let second = "0";
	let minutes = "10";
	let hours = "12";
	let dayofmonth = "*";
	let month = "*";
	let weekindex = "*";
	var schedate = second + ' ' + minutes + ' ' + hours + ' ' + dayofmonth + ' ' + month + ' ' + weekindex;

	//test data
	integrated_Pipeline_Jobs = schedule.scheduleJob(uniqe_jobs_name,schedate,"Asia/Seoul" ,async function(){
		await b2bgerp_global_data_contacts.pipe_global_lead_update();
	});
}

// Pipe Test를 위하여 임시 주석처리 추후 스케줄러를 위해 등록 필요
if(__dirname == "/home/opc/LGE/integrated_pipeline"){
	console.log("INTEGRATED PIPELINE_GLOBAL SCHEDULER REG");
	schedule_Request_PIPELINE_GLOBAL();
	console.log("INTEGRATED PIPELINE_KR SCHEDULER REG");
	schedule_Request_PIPELINE_KR();
	console.log("INTEGRATED PIPELINE_LEADUPDATE SCHEDULER REG");
	schedule_Request_PIPELINE_LEADUPDATE();
} 

// console.log(b2bgerp_global_data_contacts);
// console.log(b2bgerp_kr_us_data_contacts);

if(os.type().indexOf("Windows") > -1) global.OS_TYPE = "Windows"
else global.OS_TYPE = "Linux";

module.exports = app;