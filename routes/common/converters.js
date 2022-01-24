var xlsx = require('xlsx');

// eloqua field 와 각 사업부별 field 를 매칭 시키는 function.

exports.b2bgerp = function(eloqua_data){
    console.log("b2bgerp_Convert");
},
exports.b2bkr = function(eloqua_data){
    console.log("b2bkr_Convert");
},
exports.csintergration = async function(){
    console.log("csintergration_Convert");

    // @files 엑셀 파일을 가져온다.
    debugger;
    const eloqua_contact_excel_data = await xlsx.readFile( "C:/LGE_logs/Csdata/test/tmp0.csv" );
    console.log("Read Complete Excel files");
    const sheetName = eloqua_contact_excel_data.SheetNames[0];    
    const firstSheet = excelFile.Sheets[sheetName];  
    
    const jsonData = xlsx.utils.sheet_to_json( firstSheet, { defval : "" } );

    let convert_data = [];    
    let field_count = 0;
    console.log("PRE Convert Data");
    for(let i = 0; i < jsonData.length ; i++){
        let one_row_contact_data = await CONVERT_INTEGRATION_DB_DATA_V2(jsonData[i]);
        convert_data.push(one_row_contact_data);
        if(i === 0 ){
            for(key in one_row_contact_data){
                field_count++;
            }
        }
        
    }

    console.log("success Convert Data");

    // 가상의 엑셀 파일 생성
    const cs_excel = xlsx.utils.book_new();
    const cs_data_list = await xlsx.utils.aoa_to_sheet( convert_data);

    console.log("Create Excel Data");
    for(let item of field_count){
        cs_data_list["!cols"].push({ wpx : 200});
    }


    console.log("Append Excel Data");
    await xlsx.utils.book_append_sheet( cs_excel, cs_data_list, "Eloqua_2021_11_24 Contact " );
    

    console.log("Pre Create Excel Files");
    // @files 엑셀파일을 생성하고 저장한다.
    await xlsx.writeFile( cs_excel, "C:/LGE_logs/Csdata/test/tmp_convert_0.xlsx" ); 
    console.log("Post Create Excel Files");
},



function INTEGRATION_DB_ENTITY_V2() {
	this.INTERFACE_ID = "";                     //VARCHAR2(20)
	this.PROSPECT_ID = 0;                       //NUMBER
	this.FIRST_NAME = "";                       //VARCHAR2(40)
	this.LAST_NAME = "";                        //VARCHAR2(80)
	this.EMAIL = "";                            //VARCHAR2(240)
	this.ACCOUNT = "";                          //VARCHAR2(770)
	this.LAST_ACTIVITY_AT = "";                 //DATE
	this.CAMPAIGN = "";                         //VARCHAR2(255)
	this.NOTES = "";                            //VARCHAR2(2000)
	this.SCORE = "";                            //NUMBER
	this.GRADE = "";                            //VARCHAR2(10)
	this.WEBSITE = "";                          //VARCHAR2(255)
	this.JOB_TITLE = "";                        //VARCHAR2(128)
	this.FUNCTION = "";                         //VARCHAR2(255)
	this.COUNTRY = "";                          //VARCHAR2(240)
	this.ADDRESS_ONE = "";                      //VARCHAR2(770)
	this.ADDRESS_TWO = "";                      //VARCHAR2(255)
	this.CITY = "";                             //VARCHAR2(120)
	this.STATE = "";                            //VARCHAR2(240)
	this.TERRITORY = "";                        //VARCHAR2(255)
	this.ZIP = "";                              //VARCHAR2(60)
	this.PHONE = "";                            //VARCHAR2(120)
	this.FAX = "";                              //VARCHAR2(120)
	this.SOURCE = "";                           //VARCHAR2(120)
	this.ANNUAL_REVENUE = "";                   //VARCHAR2(18)
	this.EMPLOYEES = "";                        //VARCHAR2(8)
	this.INDUSTRY = "";                         //VARCHAR2(255)
	this.DO_NOT_EMAIL = "";                     //VARCHAR2(10)
	this.DO_NOT_CALL = "";                      //VARCHAR2(10)
	this.YEARS_IN_BUSINESS = "";                //VARCHAR2(255)
	this.COMMENTS = "";                         //VARCHAR2(2000)
	this.SALUTATION = "";                       //VARCHAR2(255)
	this.OPTED_OUT = "";                        //VARCHAR2(10)
	this.REFERRER = "";                         //VARCHAR2(2000)
	this.CREATED_DATE = "";                     //DATE
	this.UPDATED_DATE = "";                     //DATE
	this.USERS = "";                            //VARCHAR2(255)
	this.FIRST_ASSIGNED = "";                   //DATE
	this.CRM_CONTACT_FID = "";                  //VARCHAR2(255)
	this.CRM_LEAD_FID = "";                     //VARCHAR2(255)
	this.LISTS = "";                            //VARCHAR2(255)
	this.ACCOUNT_TYPE = "";                     //VARCHAR2(255)
	this.ATTENDANCE_RESPONSE = "";              //VARCHAR2(255)
	this.B2BNEWSLETTER = "";                    //VARCHAR2(255)
	this.B2BNEWSLETTER_BU = "";                 //VARCHAR2(255)
	this.B2BNEWSLTTER_TEAM = "";                //VARCHAR2(255)
	this.BIC_VISIT = "";                        //VARCHAR2(255)
	this.BUDGET = "";                           //VARCHAR2(255)
	this.BUSINESS_UNIT_1 = "";                  //VARCHAR2(255)
	this.BUSINESS_UNIT_2 = "";                  //VARCHAR2(255)
	this.COMPANY_TYPE = "";                     //VARCHAR2(255)
	this.DB_ACQUISITION_DATE = "";              //VARCHAR2(255)
	this.EMAIL_SUBSCRIPTION = "";               //VARCHAR2(255)
	this.EMAIL_SUBSCRIPTION_DATE = "";          //VARCHAR2(255)
	this.ES_ID_TRANSPORTATION = "";             //VARCHAR2(255)
	this.INDUSTRIES = "";                       //VARCHAR2(255)
	this.INQUIRY_TYPE = "";                     //VARCHAR2(255)
	this.LANGUAGE = "";                         //VARCHAR2(255)
	this.MESSAGE = "";                          //VARCHAR2(2000)
	this.MOBILE = "";                           //VARCHAR2(255)
	this.PP_MODIFY_REASON = "";                 //VARCHAR2(255)
	this.PP_MODIFY_TYPE = "";                   //VARCHAR2(255)
	this.PP_SUBSCRIPTION = "";                  //VARCHAR2(255)
	this.PP_SUBSCRIPTION_DATE = "";             //VARCHAR2(255)
	this.PRODUCT_SOLUTION = "";                 //VARCHAR2(300)
	this.PRODUCTS = "";                         //VARCHAR2(255)
	this.PROSPECT_SOURCE = "";                  //VARCHAR2(255)
	this.REGION = "";                           //VARCHAR2(255)
	this.SALESPERSON_EMAIL = "";                //VARCHAR2(255)
	this.SALESPERSON_NAME = "";                 //VARCHAR2(255)
	this.STORYSET_DOWNLOAD = "";                //VARCHAR2(255)
	this.STORYSET_EDUCATION = "";               //VARCHAR2(255)
	this.STORYSET_FEEDBACK_EXPERIENCE = "";     //VARCHAR2(2000)
	this.STORYSET_FEEDBACK_SUGGESTION = "";     //VARCHAR2(2000)
	this.SUBSCRIPTION = "";                     //VARCHAR2(255)
	this.SUBSIDIARY = "";                       //VARCHAR2(255)
	this.TIMELINE = "";                         //VARCHAR2(255)
	this.UK_AS_TSHIRTS_SIZE = "";               //VARCHAR2(255)
	this.HQ_B2BMKT_SCORING_CATEGORY = "";       //VARCHAR2(300)
	this.APPLIED_FLAG = "";                     //VARCHAR2(10)
	this.APPLIED_DATE = "";                     //DATE
	this.TRANSFER_FLAG = "";                    //VARCHAR2(10)
	this.TRANSFERRED_DATE = "";                 //DATE
	this.BACK_TRANSFER_FLAG = "";               //VARCHAR2(10)
	this.BACK_TRANSFERRED_DATE = "";            //DATE
	this.SALESFORCE_ID = "";                    //VARCHAR2(18)
	this.B2B_INT_ACCOUNT_CODE = "";             //VARCHAR2(255)
	this.B2B_CONTACT_PERSON_CODE = "";          //VARCHAR2(255)
	this.APPLIED_MSG = "";                      //VARCHAR2(2000)
}


//Eloqua Data B2B GERP CS INTERGRATION Mapping 데이터 생성
function CONVERT_INTEGRATION_DB_DATA_V2(contacts_data) {
	var result_data = [];

	for (var i = 0; i < contacts_data.elements.length; i++) {
		try {
			var result_item = new INTEGRATION_DB_ENTITY_V2();
			var item = contacts_data.elements[i];
			var FieldValues_data = contacts_data.elements[i].fieldValues;

			result_item.INTERFACE_ID = moment().format('YYYYMMDD') + lpad(seq_cnt, 6, "0");
			seq_cnt = seq_cnt + 1;

			result_item.PROSPECT_ID = GetCustomFiledValue(FieldValues_data, item.id);       //apc14000350967, ilc14000349979 ( Eloqua Contact ID )
			result_item.FIRST_NAME = GetDataValue(item.firstName);  //firstName 이름
			result_item.LAST_NAME = GetDataValue(item.lastName);    //lastName 성
			result_item.EMAIL = GetDataValue(item.emailAddress);    //emailAddress 이메일
			result_item.ACCOUNT = GetDataValue(item.accountName);   //accountName 회사명
			result_item.LAST_ACTIVITY_AT = "";                      //Date			( date type )  ( 참여 활동 날짜 Eloqua 확인 ) 
			result_item.CAMPAIGN = "";                              //result_item.ATTRIBUTE_15 = GetCustomFiledValue(FieldValues_data, 100203); //Marketing Eventdf //100203	Marketing Event
			result_item.NOTES = "";                                 //필드확인필요 ( ex ) therma V, accustorahe )
			result_item.SCORE = "";                                 //100250	Source //숫자 MAT SCORE 계산 로직 (MAT 로직)
			result_item.GRADE = "";                                 //필드확인필요 A+, F, C+, C, C-, B- (MAT확인) 
			result_item.WEBSITE = GetCustomFiledValue(FieldValues_data, 100252);    //100252	Website 웹사이트
			result_item.JOB_TITLE = GetCustomFiledValue(FieldValues_data, 100292);  //100292	Job Title
			result_item.FUNCTION = "";
			result_item.COUNTRY = GetDataValue(item.country);         //country
			result_item.ADDRESS_ONE = GetDataValue(item.address1);    //address1
			result_item.ADDRESS_TWO = GetDataValue(item.address2);    //address2
			result_item.CITY = GetDataValue(item.city);               //city
			result_item.STATE = GetDataValue(item.province);          //GetCustomFiledValue(FieldValues_data, 100307); //100307 State(Pardot) // 100010	State or Province api name : province
			result_item.TERRITORY = "";                               //GetCustomFiledValue(FieldValues_data, 100187);  //100187 territory
			result_item.ZIP = GetDataValue(item.postalCode);          //postalCode
			result_item.PHONE = GetDataValue(item.mobilePhone);       //mobilePhone
			result_item.FAX = GetDataValue(item.fax);                 //fax
			result_item.SOURCE = "";                                  //GetCustomFiledValue(FieldValues_data, 100250);  //플랫폼 AND 액티비티 인지 확인필요  // 100250	Source
			result_item.ANNUAL_REVENUE = "";                          //GetCustomFiledValue(FieldValues_data, 100047);  //100047	Annual Revenue
			result_item.EMPLOYEES = "";                               //GetCustomFiledValue(FieldValues_data, 100184);   //100184	Employees
			result_item.INDUSTRY = "";                                //GetCustomFiledValue(FieldValues_data, 100046);    //100046	Industry         
			result_item.DO_NOT_EMAIL = "";
			result_item.DO_NOT_CALL = "";
			result_item.YEARS_IN_BUSINESS = "";                        //GetCustomFiledValue(FieldValues_data, 100253);          //100253	Years In Business
			result_item.COMMENTS = "";                                //매핑정보 존재 여부 확인필요
			result_item.SALUTATION = "";                              //GetCustomFiledValue(FieldValues_data, 100017);                 //100017	Salutation
			result_item.OPTED_OUT = "";                               //GetCustomFiledValue(FieldValues_data, 100246);       //100246	Opted Out       
			result_item.REFERRER = "";                                //매핑정보 존재 여부 확인필요 유입경로 URL ( Eloqua Referrer ) 
			result_item.CREATED_DATE = utils.timeConverter("GET_DATE", item.createdAt); //고객정보 생성일자 ( Contacts 생성일자 )
			result_item.UPDATED_DATE = utils.timeConverter("GET_DATE", item.updatedAt); //고객정보 수정일자 ( Contacts 수정일자 )

			result_item.APPLIED_FLAG = "";               //x 큐리온 적용 여부
			result_item.APPLIED_DATE = "";               //x 큐리온

			result_item.TRANSFER_FLAG = "N";             //Default N
			result_item.TRANSFERRED_DATE = moment().format('YYYY/MM/DD HH:mm:ss');    //어떤 날짜 정보인지 확인 필요

			result_item.BACK_TRANSFER_FLAG = "";         //Null
			result_item.BACK_TRANSFERRED_DATE = "";		   //Null
			result_item.SALESFORCE_ID = "";              //?	 ex) 00Q0I00012QbogUAC

			result_data.push(result_item);
		}
		catch (e) {
			console.log(e);
		}
	}

	return result_data;
}


//data 20개
exports.bscard = function(request_data){

    var return_data = [];
   
    // console.log(1234);
    for( var i = 0; i< request_data.length; i++){
        
        var item = request_data[i];
        var return_item = {};

      
      
    
           
        ( !item.id || item.id == "" ) ? null : return_item.id = item.id; 
        ( !item.first_name || item.first_name == "" ) ? null : return_item.firstName = item.first_name; 
        ( !item.last_name || item.last_name == "" ) ? null : return_item.lastName = item.last_name; 
        ( !item.company || item.company == "" ) ? null : return_item.accountname = item.company;
        // return_item.rank = item.rank;
        ( !item.hp || item.hp == "" ) ? null : return_item.mobilePhone = item.hp;
        // return_item.tel = item.tel;
        ( !item.fax || item.fax == "" ) ? null : return_item.fax = item.fax;
        ( !item.addr1 || item.addr1 == ""  ) ? null : return_item.address1 = item.addr1; //== "" ? undefined : item.addr1;
        ( !item.addr2 || item.addr2 == "" ) ? null : return_item.address2 = item.addr2; //
        ( !item.email ||item.email == "" ) ? null : return_item.emailAddress = item.email; // 필수값
        ( !item.etc1  || item.etc1 == "" ) ? null : return_item.description = item.etc1;
        ( !item.userId  || item.userId == "" ) ? null : return_item.salesPerson = item.userId;
        // return_item.etc2 = item.etc2;
        // return_item.mailingDate = item.mailingDate;
        // return_item.subscriptionDate = item.subscriptionDate;

       
        var customValues_list = [] ;

        if( item.rank && item.rank != ""){
            var rank_data = { "id" : "100238" , "value" : item.rank}; //100238 Department custom field
            customValues_list.push(rank_data);
        } 
        if( item.homepage && item.homepage != ""){
            var website_data = { "id" : "100252" , "value" : item.homepage}; //100252 website custom field
            customValues_list.push(website_data);
        }
        if( item.userCode && item.userCode != ""){
            var usercode_data = { "id" : "100196" , "value" : item.userCode}; //100252 Subsidiary custom field
            customValues_list.push(usercode_data);
        }
        if( item.product && item.product != ""){
            var product_data = { "id" : "100229" , "value" : item.product}; //100252 Business Unit custom field
            customValues_list.push(product_data);
        }

        
        
        
        
        
        
       


        // if( item.mailingDate && item.mailingDate != ""){
        //     var mailingDate_data = { "id" : "" , "value" : item.mailingDate}; //100252 Business Unit custom field
        //     customValues_list.push(mailingDate_data);
        // }
        // if( item.subscriptionDate && item.subscriptionDate != ""){
        //     var subscriptionDate_data = { "id" : "" , "value" : item.subscriptionDate}; //100252 Business Unit custom field
        //     customValues_list.push(subscriptionDate_data);
        // }
        // if( item.campaignName && item.campaignName != ""){
        //     var campaignName_data = { "id" : "" , "value" : item.campaignName}; //100252 Business Unit custom field
        //     customValues_list.push(campaignName_data);
        // }
        // if( item.campaignDate && item.campaignDate != ""){
        //     var campaignDate_data = { "id" : "" , "value" : item.campaignDate}; //100252 Business Unit custom field
        //     customValues_list.push(campaignDate_data);
        // }
        // if( item.customerProduct && item.customerProduct != ""){
        //     var customerProduct_data = { "id" : "" , "value" : item.customerProduct}; //100252 Business Unit custom field
        //     customValues_list.push(customerProduct_data);
        // }
        // if( item.krMkt && item.krMkt != ""){
        //     var krMkt_data = { "id" : "" , "value" : item.krMkt}; //100252 Business Unit custom field
        //     customValues_list.push(krMkt_data);
        // }

        if(customValues_list.length > 0)  return_item.fieldValues = customValues_list;
        return_data.push(return_item);
            
        console.log(return_item.fieldValues);
    }
    return return_data;

// ex :   [
//   {
//     "userId":"dslim", 
//     "userCode":"LGEKR", 
//     "product":"all", 
//     "first_name":"대선", 
//     "last_name":"임", 
//     "company":"intellicode", 
//     "rank":"데이터 서비스 사업부 /부장", 
//     "hp":"010.7402.0722", 
//     "tel":"031 252.9127", 
//     "fax":"031.629.7826",                    
//     "addr1":"(16229) 경기도 수원시 영통구광교로 105 경기R&DB센터 705호", 
//     "addr2":"", 
//     "email":"dslim@intellicode.co.kr", 
//     "homepage":"",
//     "etc1":"", 
//     "etc2":"", 
//     "mailingDate":"2019-12-29 19:48:08", 
//     "subscriptionDate":"2019-12-29 19:49:04" 
//   }, 
// ]
}

exports.bulk_bscard = function(request_data){

    var return_data = [];
   
    // console.log(1234);
    console.log(request_data);
    for( var i = 0; i< request_data.length; i++){
        
        var item = request_data[i];
        var return_item = {};

      
      
    
           

        ( !item.first_name || item.first_name == "" ) ? null : return_item.firstName = item.first_name; 
        ( !item.last_name || item.last_name == "" ) ? null : return_item.lastName = item.last_name; 
        ( !item.company || item.company == "" ) ? null : return_item.accountname = item.company;
        // return_item.rank = item.rank;
        ( !item.hp || item.hp == "" ) ? null : return_item.mobilePhone = item.hp;
        // return_item.tel = item.tel;
        ( !item.fax || item.fax == "" ) ? null : return_item.fax = item.fax;
        ( !item.addr1 || item.addr1 == ""  ) ? null : return_item.address1 = item.addr1; //== "" ? undefined : item.addr1;
        ( !item.addr2 || item.addr2 == "" ) ? null : return_item.address2 = item.addr2; //
        ( !item.email ||item.email == "" ) ? null : return_item.emailAddress = item.email; // 필수값
        ( !item.etc1  || item.etc1 == "" ) ? null : return_item.description = item.etc1;
        ( !item.userId  || item.userId == "" ) ? null : return_item.salesPerson = item.userId;
        // return_item.etc2 = item.etc2;
        // return_item.mailingDate = item.mailingDate;
        // return_item.subscriptionDate = item.subscriptionDate;

        ( !item.rank  || item.rank == "" ) ? null : return_item.Department = item.rank;
        ( !item.homepage  || item.homepage == "" ) ? null : return_item.Website = item.homepage;
        ( !item.userCode  || item.userId == "" ) ? null : return_item.Subsidiary = item.userCode;
        ( !item.product  || item.product == "" ) ? null : return_item.BusinessUnit = item.product;
        
        
        return_data.push(return_item);
            
    }
    return return_data;

// ex :   [
//   {
//     "userId":"dslim", 
//     "userCode":"LGEKR", 
//     "product":"all", 
//     "first_name":"대선", 
//     "last_name":"임", 
//     "company":"intellicode", 
//     "rank":"데이터 서비스 사업부 /부장", 
//     "hp":"010.7402.0722", 
//     "tel":"031 252.9127", 
//     "fax":"031.629.7826",                    
//     "addr1":"(16229) 경기도 수원시 영통구광교로 105 경기R&DB센터 705호", 
//     "addr2":"", 
//     "email":"dslim@intellicode.co.kr", 
//     "homepage":"",
//     "etc1":"", 
//     "etc2":"", 
//     "mailingDate":"2019-12-29 19:48:08", 
//     "subscriptionDate":"2019-12-29 19:49:04" 
//   }, 
// ]
}

exports.standardField_Valid = function(str){
    (!str || str == "" ) ? null : return_item.id = item.id; 
}

exports.customField_Valid = function(str){
    
}




