var moment = require('moment');
var fs = require('fs');
let FormData = require('form-data');
var request_promise = require('request-promise');

exports.logs_makeDirectory = function(dirPath){

    
    const isExists = fs.existsSync(dirPath);
    if(OS_TYPE === 'Windows' && !isExists){
        dirPath = "C:/LGE_logs/" + dirPath + "/";
        fs.mkdirSync( dirPath, { recursive: true } );
    }else if(OS_TYPE === "Linux" ){
        dirPath = "/home/LGE_logs/" + dirPath + "/";
        fs.mkdirSync( dirPath, { recursive: true } );
    }
    return dirPath;

}



exports.timeConverter = function (status , time){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544
    
    if(!time || time == null ) return null
    else if(status == "GET_UNIX") return moment(time).unix();
    else if(status == "GET_DATE") return moment.unix(time).format("YYYY-MM-DD HH:mm:ss");
}

exports.yesterday_getUnixTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    var yesterday_start = moment().add("-1","d").format("YYYY-MM-DD"); 
    var yesterday_end = moment().add("-1","s").format("YYYY-MM-DD");

    var startUnix = moment(yesterday_start).unix();
    var endUnix = moment(yesterday_end).unix();
    console.log(startUnix);
    console.log(endUnix);

    return {
        start : startUnix , 
        end : endUnix
    }


}


exports.today_getUnixTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    var today_start = moment().format("YYYY-MM-DD"); 
    var today_end = moment().add("1","d").format("YYYY-MM-DD");

    var startUnix = moment(today_start).unix();
    var endUnix = moment(today_end).unix();

    console.log(startUnix);
    console.log(endUnix);

    return {
        start : startUnix , 
        end : endUnix
    }

}

exports.today_getOneUnixTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    var today_start = moment().format("YYYY-MM-DD"); 


    return moment(today_start).unix();



}


exports.yesterday_getDateTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    let start = moment().add("-1","d").format("YYYY-MM-DD"); 
    start = moment(start).format("YYYY-MM-DD");
    let end = moment().format("YYYY-MM-DD"); 
    end = moment(end).format("YYYY-MM-DD");

    return {
        start : start , 
        end : end
    }
}



exports.yesterday_getDetailDateTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    let start = moment().add("-1","d").format("YYYY-MM-DD 10:00:00"); 
    start = moment(start).format("YYYY-MM-DD 10:00:00");
    let end = moment().format("YYYY-MM-DD 11:00:00"); 
    end = moment(end).format("YYYY-MM-DD 11:00:00");

    return {
        start : start , 
        end : end
    }


}


exports.today_getDateTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    let start = moment().format("YYYY-MM-DD"); 
    start = moment(start).format("YYYY-MM-DD");
    let end = moment().add("1","d").format("YYYY-MM-DD"); 
    end = moment(end).format("YYYY-MM-DD");
   

    console.log(start);
    console.log(end);

    return {
        start : start , 
        end : end
    }
}


exports.getPipe_AccessToken = async function (status , req, res ){
	let url , client_id , client_secret, username , password;
	// 운영환경	https://lge.my.salesforce.com/services/oauth2/token
	// 실전검증	https://lge--fs.my.salesforce.com/services/oauth2/token
	// Stage	https://lge--sb.my.salesforce.com/services/oauth2/token
	// 개발환경	https://lge--dev.my.salesforce.com/services/oauth2/token

	switch(status){
		case "prd" : 
            url = "https://lge.my.salesforce.com/services/oauth2/token"
            client_id = "3MVG97quAmFZJfVyP3hAkCZVv33YyTZAzr3ETQYjIUtpNGqdPoxOsQ7m4Mri7MOdE6YijcBkhew83OztKUdYT"
            client_secret = "5D5292A7CF65960154608408EA820201BF0893EC22B2D1784CE88760652C3A7B"
            username = "interface4@lge.com"
            password = "lge1234#!"
		break;

		case "fullstg" : 
            url = "https://lge--fs.my.salesforce.com/services/oauth2/token"
            client_id = "3MVG9z6NAroNkeMmMX8qak2FmQZ1fl42BIxR040x1dyM9fo.Qjysx_5XPI1Nvt4tcv3nCvDeggzjki2H6_vGy"
            client_secret = "775905C194645A9E6D3993769FCD05475747F33BD19F44246EEC190C4F7D9CD1"
            username = "interface4@lge.com.fs"
            password = "lge1234f!"
		break;

		case "stg" : 
            url = "https://lge--sb.my.salesforce.com/services/oauth2/token" 
            client_id = "3MVG9pcaEGrGRoTIvSC8xMBRHGoO0sgwjIGhEKPECQGJCaI6ngk_7JX4E26ZhPjYQ8mLZbyQMX169GTboLHfj"
            client_secret = "8AD86AB46F96A9A7887862167239BD521AC2803968FD7A0AE68EA1DC08447591"
            username = "interface4@lge.com.sb"
            password = "lge1234s!"
		break;

		case "dev" : 
            url = "https://lge--dev.my.salesforce.com/services/oauth2/token" ;
            client_id = "3MVG9pcaEGrGRoTLplbFCcKKTMwmyTzgO45nB7ZcTdepKC74p0y5iP348qiVp.n3REprOVmUFYUb_3Pvf4bN0" ;
            client_secret = "0122289889E2467DA56667521AD38B296D5C31EFA2194FBF6D9DF87625AC78C0" ; 
            username = "interface4@lge.com.dev" ;
            password = "lge1234!"
		break;
	}
	
    console.log(url);
	// PipeLine 측에서 POST의 Form Data로 헤더 영역 데이터를 제출 받기 때문에 form data형식으로 가공
	let form = new FormData();
	form.append('grant_type', 'password');
	form.append('client_id', client_id);
	form.append('client_secret', client_secret);
	form.append('username', username);
	form.append('password', password);


	const options = {};
	options.url = url ;
	options.method = "POST" ;
	options.headers = form.getHeaders(); 
	options.body = form;

	let result_data ;
	await request_promise.post(options, async function (error, response, body) {
		
		if(error){
			result_data = undefined;
			console.log(error.message)
		}else if(!error && response.statusCode != 200 ){
			result_data = undefined;
		}else if (!error && response.statusCode == 200) {
			result_data = body;
		}
	});
	return result_data;
}



exports.todayDetail_getDateTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    return moment().format("YYYY-MM-DD HH:mm:ss"); 

}



