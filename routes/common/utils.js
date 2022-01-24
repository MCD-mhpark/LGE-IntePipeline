var moment = require('moment');
var fs = require('fs');

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



exports.todayDetail_getDateTime = function (){
    //ex date = 2019-12-29 19:48:08
    //ex unix =  1577616544 

    // var today = moment().format("YYYY-MM-DD");
    return moment().format("YYYY-MM-DD HH:mm:ss"); 

}



