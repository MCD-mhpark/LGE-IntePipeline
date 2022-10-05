var express = require('express');
var router = express.Router();
var request = require('request');
var request_promise = require('request-promise');
var httpRequest = require('../common/httpRequest');
var utils = require('../common/utils');
var moment = require('moment');
var global_seq_cnt = 0;
var fs = require("mz/fs");
const { option } = require('yargs');

const { resolveMx } = require('dns');

router.get('/inte_pipeline_global', async function (req, res, next) {
	
	let sdate = req.query.sdate ; 
	let edate = req.query.edate ; 
	let bant_list = ["AS" , "CM" , "ID" , "IT" , "Solution"];
	bant_list.forEach( async BusinessName =>{
		await pipe_global_bant_send(BusinessName , sdate , edate , req, res);
	})
});


router.post('/inte_pipeline_lead_update', async function (req, res, next) {
	await pipe_global_lead_update(req, res, next); 
});

router.post('/tester', async function (req, res, next) {
	console.log(req);
});


router.get('/get_access_token', async function (req, res, next) {
	let result = await utils.getPipe_AccessToken("dev" , req , res);
	console.log(result);
	res.json(result);
});

router.post('/contactpointtest', async function (req, res, next) {
	var contact_list = req.body;
	var request_data = await Convert_B2BGERP_GLOBAL_NOSUBSIDIARY_DATA(contact_list, "Solution");
	// let mql_customobject_list = await TEST_CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data);
	res.json(request_data);
});

async function getTransfer_UpdateData(TRANS_KR_LIST , type){

	let return_list = [];
	let trans_check = "";
	if(type == 'get' ) trans_check = 'Y'
	else if(type == 'init' ) trans_check = ''
	

	for(const kr_data of TRANS_KR_LIST){

		for(let i = 0 ; i <  kr_data.fieldValues.length ; i++){
			if(kr_data.fieldValues[i].id == "483") { kr_data.fieldValues[i].value = trans_check }
			
			if(kr_data.fieldValues[i].id == "301" || kr_data.fieldValues[i].id == "300" || kr_data.fieldValues[i].id == "299" || kr_data.fieldValues[i].id == "298"){ 
			 	kr_data.fieldValues[i].value = utils.timeConverter("GET_UNIX" , kr_data.fieldValues[i].value ) 
			}

			//{ type: 'FieldValue', id:  '301', value: '4/18/2021 12:00:00 AM' },
			// { type: 'FieldValue', id: '300', value: '4/18/2021 12:00:00 AM' },
			// { type: 'FieldValue', id: '299', value: '4/18/2021 12:00:00 AM' },
			// { type: 'FieldValue', id: '298', value: '4/18/2021 12:00:00 AM' },
		}

		return_list.push(kr_data);
	}

	return return_list;
}


//BANT 조건 Eloqua 조회 함수
async function get_b2bgerp_global_bant_data(_business_name, start_date, end_date) {
	//BANT 조건 : Status - Contact / Pre-lead / MQL

	var business_name = _business_name;
	var status_bant = "";

	var contacts_data;
	var queryString = {}
	var queryText = "";

	switch (business_name) {
		case "AS":
			status_bant = "C_AS_Status1";
			break;
		case "IT":
			status_bant = "C_IT_Status1";
			break;
		case "ID":
			status_bant = "C_ID_Status1";
			break;
		case "Solar":
			status_bant = "C_Solar_Status1";
			break;
		case "CM":
			status_bant = "C_CM_Status1";
			break;
		case "CLS":
			status_bant = "C_CLS_Status1";
			break;
		case "Solution":
			status_bant = "C_Solution_Status1";
			break;
		case "TEST":
			status_bant = "C_AS_Status1";
			break;
	}

	var yesterday_Object = utils.yesterday_getDateTime();
	start_date ? yesterday_Object.start = start_date : null;
	end_date ? yesterday_Object.end = end_date : null;

	// yesterday_Object.start = "2021-03-05";

	//var yesterday_Object = utils.today_getDateTime();

	var queryText = "C_DateModified>" + "'" + yesterday_Object.start + " 10:00:00'" + "C_DateModified<" + "'" + yesterday_Object.end + " 11:00:59'" + status_bant + "='MQL'";
														
	if (business_name == 'TEST') queryText = "emailAddress='jtlim@goldenplanet.co.kr'";
	// "emailAddress='jtlim@lge.com'emailAddress='jtlim@goldenplanet.co.kr'emailAddress='jtlim@test.com'emailAddress='jtlim@cnspartner.com'emailAddress='jtlim@intellicode.co.kr'emailAddress='jtlim@hsad.co.kr'emailAddress='jtlim@test.co.kr'emailAddress='jtlim@naver.com'emailAddress='jtlim@gmail.com'"
	console.log("queryText : " + queryText);
	queryString['search'] = queryText;
	queryString['depth'] = "complete";
	//   queryString['count'] = 1;

	await lge_eloqua.data.contacts.get(queryString).then((result) => {
		console.log("business_name : " + business_name + " result data 건수 : " + result.data.total);
		// console.log(result.data);
		if (result.data.total && result.data.total > 0) {
			contacts_data = result.data;
		}
	}).catch((err) => {
		console.error(err);
		return null;
	});
	return contacts_data;
}


function B2B_GERP_GLOBAL_ENTITY() {
	this.interfaceId = "ELOQUA_0003", //  (필수값) 
    this.leadName	= "";        // (필수값) 리드네임 [MQL]Subsidiary_BU_Platform&Activity_Register Date+Hour 값을 조합
    this.siteName	= "";		// (필수값) 사이트네임
	this.leadSourceName	= "";	//리드소스 네임 Platform&Activity 필드 매핑
	this.leadSourceType	= "11";// (필수값) default 11 ? Eloqua에서 넘어오는 값이면 By Marketing, 영업인원이 수기입할 경우 By Sales로 지정
	this.entryType	= "L"       //default L
	this.account	= "";          // (필수값) 회사
	this.contactPoint	= "";    // (필수값) Contact Point는 Eloqua 필드 중 -> Customer Name/Email/Phone No. 를 연결 시켜 매핑 필요
	this.corporation	= "";      //법인정보
	// this.OWNER = "";            //데이터 없음 -> pipeline 에서 사용 하지않음
	this.address	= "";          //현업확인 Address1 + Address2 + Address3
	this.description 	= "";      //설명 Comments, message, inquiry-to-buy-message 필드 중 하나
	this.contactId	= "";      		//엘로코아 CONTACT ID
	this.budget	= "";      			//PRODUCT LV1의 BU 별 Budget
	this.verticalType2	= "";      //픽리스트 eloqua 확인
	this.email	= "";      			//이메일
	this.phone	= "";      			//전화번호
	// this.ATTRIBUTE_6 = "";       //확인필요 -> pipeline 에서 사용 하지않음
	this.region	= "";      			//지역 - 국가 eloqua filed 정보
	// this.ATTRIBUTE_8	= "";      //넷중 하나 또는 4개의 필드 정보 합 ( 확인 필요 ) -> pipeline 에서 사용 하지않음
	this.jobFunction	= "";      //Job Function
	this.businessUnit	= "";     // 사업부별 BU
	this.division	= "";     //사업부코드( 코드마스터 필요 ) 예) HE    LGE 앞자리 빼는지 확인 필요
	this.seniority	= "";     //Seniority
	this.needs	= "";     //PRODUCT LV1의 BU 별 Needs
	this.timeLine = "";     //PRODUCT LV1의 BU 별 Timeline
	this.marketingEvent	= "";     //Marketing Event
	this.privacyPolicyYn = "";     //Privacy Policy YN
	this.privacyPolicyDate	= "";     //Privacy Policy Date
	this.transferOutsideEeaYn	= "";     //TransferOutside EEA YN
	this.transferOutsideEeaDate	= "";     //TransferOutside EEA Date
	this.marketingAgreementYn	= "";     // MarketingAgreementYn
	this.marketingAgreementDate	= ""; 	  // MarketingAgreementDate
	this.customerType = ""; //CustomerType
	this.eloquaProduct1	= "";     //ELOQUA 내 Product 1
	this.eloquaProduct2	= "";     //ELOQUA 내 Product 2 없을경우 NULL
	this.eloquaProduct3	= "";     //ELOQUA 내 Product 3 없을경우 NULL
	this.verticalType	= "";     //Vertical Type B2B GERP Global Code mapping
	this.registerDate	= "";    // (필수값) 어떤 날짜 정보인지 확인 필요
	this.transferDate	= "";    // (필수값) 어떤 날짜 정보인지 확인 필요
	this.transferFlag	= "";		// (필수값) TRANSFER_FLAG N , Y 값의 용도 확인 필요 
	this.lastUpdateDate	= "";
	this.customObjectId	= "";		// Eloqua 내 CustomObject 에 전송 MQL 을 저장한 후 leadnumber update 를 하기 위한 customobject id 값
	//Building Type을 Vertical Type으로 변경하고 전사 Vertical 기준에 맞추어 매핑 필요 - LG.com내에도 항목 수정 필요하니 요청 필요함 호텔정보 
	this.firstName = "";
	this.lastName = "";
}


//Eloqua Data B2B GERP Global Mapping 데이터 생성
async function Convert_B2BGERP_GLOBAL_DATA(contacts_data, business_department) {
	var result_data = [];
	if (!contacts_data) return;
	for (var i = 0; i < contacts_data.elements.length; i++) {

		try {

	
			var result_item = new B2B_GERP_GLOBAL_ENTITY();
			var FieldValues_data = contacts_data.elements[i].fieldValues;

	
			//result_item.INTERFACE_ID = "ELOQUA_0003" // this.INTERFACE_ID = "ELOQUA_0003"

			var business_interface_num = 0;
			switch (business_department) {
				case "AS": business_interface_num = 1; break;
				case "CLS": business_interface_num = 2; break;
				case "CM": business_interface_num = 3; break;
				case "ID": business_interface_num = 4; break;
				case "IT": business_interface_num = 5; break;
				case "Solar": business_interface_num = 6; break;
				case "Solution": business_interface_num = 7; break;
				case "TEST": business_interface_num = 1; break;
				default: business_interface_num = 0; break;
			}

			result_item.interfaceId	= moment().format('YYYYMMDD') + business_interface_num + lpad(global_seq_cnt, 5, "0");
			//리드네임 [MQL]Subsidiary_BU_Platform&Activity_Register Date+Hour 값을 조합
			//리드네임 {{Business Unit}}_{{Subsidiary}}_{{Platform}}_{{Activity}}_{{Date}}
			//리드네임 {{Business Unit}}_{{Subsidiary}}_{{Platform&Activity}}_{{Date}}
			//리드네임 {{100229}}_{{100196}}_{{100202}}_{{100026}}
			//리드네임 [MQL]Subsidiary_BU_Platform&Activity_Register Date+Hour 값을 조합

			global_seq_cnt = global_seq_cnt + 1;

			

			result_item.leadName =
				//GetCustomFiledValue(FieldValues_data, 100229) + "_" +
				"[MQL]" + GetCustomFiledValue(FieldValues_data, 100196) + "_" +
				business_department + "_" +
				GetCustomFiledValue(FieldValues_data, 100202) + "_" +
				moment().format('YYYYMMDD');

			result_item.siteName = GetCustomFiledValue(FieldValues_data, 100187) == "" ? "N/A" : GetCustomFiledValue(FieldValues_data, 100187);        //100187	Territory //SITE_NAME ( 현장명 매핑필드 확인 ) //2021-02-02 기준 데이터 없음
			result_item.leadSourceName = GetCustomFiledValue(FieldValues_data, 100202) == "" ? "N/A" : GetCustomFiledValue(FieldValues_data, 100202); //리드소스 네임 Platform&Activity 필드 매핑 // 폼에 히든값으로 존재
			result_item.leadSourceType = "11";                                          //default 11 (협의됨) //Eloqua에서 넘어오는 값이면 By Marketing, 영업인원이 수기입할 경우 By Sales로 지정

			

			result_item.entryType = "L"                                                  //default L
			result_item.account = GetDataValue(contacts_data.elements[i].accountName) == "" ? "N/A" : GetDataValue(contacts_data.elements[i].accountName);    //ACCOUNT ( 회사 )  // Company Name
			result_item.contactPoint = GetCustomFiledValue(FieldValues_data, 100172) == "" ? "None" : GetCustomFiledValue(FieldValues_data, 100172);
				// + "/" +
				//GetDataValue(contacts_data.elements[i].firstName) + " " + GetDataValue(contacts_data.elements[i].lastName) + "/" +
				// GetDataValue(contacts_data.elements[i].emailAddress) + "/" +
				// GetDataValue(contacts_data.elements[i].mobilePhone) + "/"               //Contact Point는 Eloqua 필드 중 -> Customer Name/Email/Phone No. 를 연결 시켜 매핑 필요
			result_item.corporation = "LGE" + GetCustomFiledValue(FieldValues_data, 100196);  //법인정보 "LGE" + {{Subsidiary}}
			// result_item.OWNER = "";                                                       //(확인필요);


			let address = "";
			address += GetDataValue(contacts_data.elements[i].address1);
			if (address != "") address += " " + GetDataValue(contacts_data.elements[i].address2);
			if (address != "") address += " " + GetDataValue(contacts_data.elements[i].address3);
			address += "/" + GetDataValue(contacts_data.elements[i].city) + "/" + GetDataValue(contacts_data.elements[i].country);	//주소정보 Address1 + Address2 + Address3 // Inquiry To Buy 주소 입력 없음



			result_item.address = address;
			//result_item.DESCRIPTION = GetDataValue(contacts_data.elements[i].description);//설명 Comments, message, inquiry-to-buy-message 필드 중 하나 (확인필요) //DESCRIPTION
			let description = GetCustomFiledValue(FieldValues_data, 100209);
			result_item.description = description.length >= 1500 ? description.substring(0, 1675) : description;      //설명 inquiry-to-buy-message 필드

			result_item.contactId = GetDataValue(contacts_data.elements[i].id);         //Eloqua Contact ID
			result_item.budget = GetBusiness_Department_data(FieldValues_data, business_department, "Budget"); //PRODUCT LV1의 BU 별 
			result_item.verticalType2 = GetBusiness_Department_data(FieldValues_data, business_department, "Vertical_Level_2"); //Vertical Level 2
			result_item.email = GetDataValue(contacts_data.elements[i].emailAddress);   //이메일
			result_item.phone = GetDataValue(contacts_data.elements[i].mobilePhone);    //전화번호 (businessPhone 확인필요)
			// result_item.ATTRIBUTE_6 = "";                                                     //(확인필요)
			result_item.region = GetCustomFiledValue(FieldValues_data, 100069);          //지역 - 국가 eloqua filed 정보
			// result_item.ATTRIBUTE_8 = "";
			result_item.jobFunction	= GetBusiness_Department_data(FieldValues_data, business_department, "Job Function"); //(Job Function 사업부별 컬럼 확인 필요)
			result_item.businessUnit = business_department; //(Business Unit 가장 최근 기준 BU값)
			//result_item.ATTRIBUTE_10 = GetBusiness_Department_data(FieldValues_data, business_department, "Business Unit"); //(Business Unit 사업부별 컬럼 확인 필요)

			result_item.division = "";                                                    //division (확인필요) 사업부코드( 코드마스터 필요 ) 예) HE    LGE 앞자리 빼는지 확인 필요
			result_item.seniority = GetBusiness_Department_data(FieldValues_data, business_department, "Seniority"); //Seniority
			result_item.needs = GetBusiness_Department_data(FieldValues_data, business_department, "Needs");     //PRODUCT LV1의 BU 별 Needs //(Nees 사업부별 컬럼 확인 필요)  // Inquiry Type* Needs
			result_item.timeLine = GetBusiness_Department_data(FieldValues_data, business_department, "TimeLine");  //PRODUCT LV1의 BU 별 Timeline //(Nees 사업부별 컬럼 확인 필요)
			result_item.marketingEvent = GetCustomFiledValue(FieldValues_data, 100203);                                   //Marketing Event //100203	Marketing Event // 폼 히든값
			result_item.privacyPolicyYn = GetCustomFiledValue(FieldValues_data, 100213) == "Yes" ? "Y" : "N";              //Privacy Policy YN //100213	Privacy Policy_Agreed // privcy Policy*

			var Privacy_Policy_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100199));
			result_item.privacyPolicyDate = Privacy_Policy_Date == null ? "" : Privacy_Policy_Date; //Privacy Policy Date : 100199	Privacy Policy_AgreedDate

			result_item.transferOutsideEeaYn = GetCustomFiledValue(FieldValues_data, 100210) == "Yes" ? "Y" : "N";     //TransferOutside EEA YN : 100210	TransferOutsideCountry*

			var TransferOutside_EEA_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100208));
			result_item.transferOutsideEeaDate = TransferOutside_EEA_Date == null ? "" : TransferOutside_EEA_Date; //TransferOutside EEA Date : 100208	TransferOutsideCountry_AgreedDate

			result_item.marketingAgreementYn = GetCustomFiledValue(FieldValues_data, 100211) == "Yes" ? "Y" : "N";     //Direct Marketing_EM YN 100211

			var Marketing_Agreement_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100200));
			result_item.marketingAgreementDate = Marketing_Agreement_Date == null ? "" : Marketing_Agreement_Date; //Direct Marketing_EM Date

			result_item.customerType = GetBusiness_Department_data(FieldValues_data, business_department, "Customer Type");    //Customer Type

			result_item.eloquaProduct1 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_Category");     //ELOQUA 내 Product 1 //(사업부별 컬럼 확인 필요)
			result_item.eloquaProduct2 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_SubCategory");  //ELOQUA 내 Product 2 없을경우 NULL // (사업부별 컬럼 확인 필요)
			result_item.eloquaProduct3 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_Model");        //ELOQUA 내 Product 3 없을경우 NULL // (사업부별 컬럼 확인 필요)

			result_item.verticalType = GetBusiness_Department_data(FieldValues_data, business_department, "Vertical_Level_1");    //Vertical Level_1

			result_item.registerDate = moment().format('YYYY-MM-DD hh:mm:ss');    //어떤 날짜 정보인지 확인 필요 //utils.timeConverter("GET_DATE", contacts_data.elements[i].createdAt);
			result_item.transferDate = moment().format('YYYY-MM-DD hh:mm:ss');    //어떤 날짜 정보인지 확인 필요
			result_item.transferFlag = "Y";	 									//TRANSFER_FLAG N , Y 값의 용도 확인 필요
			result_item.lastUpdateDate = utils.timeConverter("GET_DATE", contacts_data.elements[i].updatedAt);

			result_item.firstName = GetDataValue(contacts_data.elements[i].firstName);
			result_item.firstName = result_item.firstName.length > 40 ? result_item.firstName.substring(0, 40) : result_item.firstName;
			result_item.lastName = GetDataValue(contacts_data.elements[i].lastName) == "" ? "None" : GetDataValue(contacts_data.elements[i].lastName);
			result_item.lastName = result_item.lastName.length > 80 ? result_item.lastName.substring(0, 80) : result_item.lastName;

			console.log(result_item.corporation);

			let notBant_email_list = [];
			// Pipe Line 테스트를 위해 임시 주석
			// notBant_emailType_List = ["@lg.com", "@lge.com", "@goldenplanet.co.kr", "@test.com", "@cnspartner.com", "@intellicode.co.kr", "@hsad.co.kr", "@test.co.kr", "@test.test", "@testtest.com"];
			// let notBant_email_list = notBant_emailType_List.filter(function (sentence) {
			// 	return result_item.ATTRIBUTE_4.indexOf(sentence) > -1 ? result_item.ATTRIBUTE_4 : null;
			// });

			let subsidiaryOption = ['LGEAP', 'LGESL', 'LGETH', 'LGECH', 'LGEHK', 'LGEIL', 'LGEIN', 'LGEML', 'LGEPH', 'LGETT', 'LGEVH', 'LGEJP', 'LGEKR', 'LGERA', 'LGEAK', 'LGEUR', 'LGEMK',
    		'LGEAG', 'LGEBN', 'LGEHS', 'LGECZ', 'LGEDG', 'LGEPL', 'LGEFS', 'LGEUK', 'LGEIS', 'LGEPT', 'LGERO', 'LGEES', 'LGEPS', 'LGEAR', 'LGECL', 'LGESP', 'LGECB', 'LGEMS', 'LGEPR', 'LGEGF',
    		'LGEAS', 'LGEAF', 'LGESA', 'LGEEF', 'LGEEG', 'LGEIR', 'LGELF', 'LGEYK', 'LGEMC', 'LGESB', 'LGETU', 'LGETK', 'LGECI', 'LGEUS', 'LGEHQ', 'LGESW', 'LGELA', 'LGELV'];
			let subsidiaryCheck;
			if(subsidiaryOption.includes(result_item.corporation)){
				subsidiaryCheck = true;
			}else{
				subsidiaryCheck = false;
			}

		
			if (result_item.corporation != "" && result_item.corporation != "LGE" && subsidiaryCheck == true && notBant_email_list.length < 1)
				result_data.push(result_item);
		}
		catch (e) {
			console.log(e);
		}
	}
	return result_data;
}



function CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data) {
	let mql_list = [];
	for (const item of request_data) {
		let mql_data = {};
		mql_data.fieldValues = [];

		mql_data.name = item.email;
		mql_data.contactId = item.contactId;
		mql_data.isMapped = "Yes";
		mql_data.type = "CustomObjectData";

		mql_data.fieldValues.push({
			"id": "484",
			"value": item.interfaceId
		})

		mql_data.fieldValues.push({
			"id": "485",
			"value": item.leadName
		})

		mql_data.fieldValues.push({
			"id": "486",
			"value": item.siteName
		})

		mql_data.fieldValues.push({
			"id": "487",
			"value": item.leadSourceName
		})

		mql_data.fieldValues.push({
			"id": "488",
			"value": item.leadSourceType
		})

		mql_data.fieldValues.push({
			"id": "489",
			"value": item.entryType
		})

		mql_data.fieldValues.push({
			"id": "490",
			"value": item.account
		})

		mql_data.fieldValues.push({
			"id": "491",
			"value": item.contactPoint
		})

		mql_data.fieldValues.push({
			"id": "492",
			"value": item.corporation
		})

		// mql_data.fieldValues.push({
		// 	"id": "493",
		// 	"value": item.OWNER
		// })

		mql_data.fieldValues.push({
			"id": "494",
			"value": item.address
		})

		mql_data.fieldValues.push({
			"id": "495",
			"value": item.description
		})

		mql_data.fieldValues.push({
			"id": "496",
			"value": item.contactId
		})

		mql_data.fieldValues.push({
			"id": "497",
			"value": item.budget
		})

		mql_data.fieldValues.push({
			"id": "498",
			"value": item.verticalType2
		})

		mql_data.fieldValues.push({
			"id": "499",
			"value": item.email
		})

		mql_data.fieldValues.push({
			"id": "500",
			"value": item.phone
		})

		// mql_data.fieldValues.push({
		// 	"id": "501",
		// 	"value": item.ATTRIBUTE_6
		// })

		mql_data.fieldValues.push({
			"id": "502",
			"value": item.region
		})

		// mql_data.fieldValues.push({
		// 	"id": "503",
		// 	"value": item.ATTRIBUTE_8
		// })

		mql_data.fieldValues.push({
			"id": "504",
			"value": item.jobFunction
		})

		mql_data.fieldValues.push({
			"id": "505",
			"value": item.businessUnit
		})

		mql_data.fieldValues.push({
			"id": "506",
			"value": item.division
		})

		mql_data.fieldValues.push({
			"id": "507",
			"value": item.seniority
		})

		mql_data.fieldValues.push({
			"id": "508",
			"value": item.needs
		})

		mql_data.fieldValues.push({
			"id": "509",
			"value": item.timeLine
		})

		mql_data.fieldValues.push({
			"id": "510",
			"value": item.marketingEvent
		})

		mql_data.fieldValues.push({
			"id": "511",
			"value": item.privacyPolicyYn
		})

		mql_data.fieldValues.push({
			"id": "521",
			"value": utils.timeConverter("GET_UNIX", item.privacyPolicyDate)
		})

		mql_data.fieldValues.push({
			"id": "513",
			"value": item.transferOutsideEeaYn
		})

		mql_data.fieldValues.push({
			"id": "520",
			"value": utils.timeConverter("GET_UNIX", item.transferOutsideEeaDate)
		})

		mql_data.fieldValues.push({
			"id": "1670",
			"value": item.customerType
		})

		mql_data.fieldValues.push({
			"id": "1983",
			"value": item.marketingAgreementYn
		})

		mql_data.fieldValues.push({
			"id": "1984",
			"value": utils.timeConverter("GET_UNIX", item.marketingAgreementDate)
		})

		mql_data.fieldValues.push({
			"id": "515",
			"value": item.eloquaProduct1
		})

		mql_data.fieldValues.push({
			"id": "516",
			"value": item.eloquaProduct2
		})

		mql_data.fieldValues.push({
			"id": "517",
			"value": item.eloquaProduct3
		})

		mql_data.fieldValues.push({
			"id": "518",
			"value": item.verticalType
		})

		mql_data.fieldValues.push({
			"id": "519",
			"value": utils.timeConverter("GET_UNIX", item.registerDate) 
		})

		mql_data.fieldValues.push({
			"id": "522",
			"value": utils.timeConverter("GET_UNIX", item.transferDate)
		})

		mql_data.fieldValues.push({
			"id": "523",
			"value": item.transferFlag
		})

		mql_data.fieldValues.push({
			"id": "524",
			"value": utils.timeConverter("GET_UNIX", item.lastUpdateDate)
		});

		/*		FIXME: 테스트 종료 후 본 환경 배포시 수정
		id값 확인 후 수정할 것

		mql_data.fieldValues.push({
			"id": "1654",
			"value": item.firstName
		});

		mql_data.fieldValues.push({
			"id": "1655",
			"value": item.lastName
		});
		*/
		
		mql_list.push(mql_data);
	}

	return mql_list;
}


function TEST_CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data) {
	let mql_list = [];
	for (const item of request_data) {
		let mql_data = {};
		mql_data.fieldValues = [];

		mql_data.name = item.email;
		mql_data.contactId = item.contactId;
		mql_data.isMapped = "Yes";
		mql_data.type = "CustomObjectData";

		mql_data.fieldValues.push({
			"id": "1303",
			"value": item.interfaceId
		})

		mql_data.fieldValues.push({
			"id": "1304",
			"value": item.leadName
		})

		mql_data.fieldValues.push({
			"id": "1305",
			"value": item.siteName
		})

		mql_data.fieldValues.push({
			"id": "1306",
			"value": item.leadSourceName
		})

		mql_data.fieldValues.push({
			"id": "1307",
			"value": item.leadSourceType
		})

		mql_data.fieldValues.push({
			"id": "1308",
			"value": item.entryType
		})

		mql_data.fieldValues.push({
			"id": "1309",
			"value": item.account
		})

		mql_data.fieldValues.push({
			"id": "1310",
			"value": item.contactPoint
		})

		mql_data.fieldValues.push({
			"id": "1311",
			"value": item.corporation
		})

		// mql_data.fieldValues.push({
		// 	"id": "1312",
		// 	"value": item.OWNER
		// })

		mql_data.fieldValues.push({
			"id": "1313",
			"value": item.address
		})

		mql_data.fieldValues.push({
			"id": "1314",
			"value": item.description
		})

		mql_data.fieldValues.push({
			"id": "1315",
			"value": item.contactId
		})

		mql_data.fieldValues.push({
			"id": "1316",
			"value": item.budget
		})

		mql_data.fieldValues.push({
			"id": "1317",
			"value": item.verticalType2
		})

		mql_data.fieldValues.push({
			"id": "1318",
			"value": item.email
		})

		mql_data.fieldValues.push({
			"id": "1319",
			"value": item.phone
		})

		// mql_data.fieldValues.push({
		// 	"id": "1320",
		// 	"value": item.ATTRIBUTE_6
		// })

		mql_data.fieldValues.push({
			"id": "1321",
			"value": item.region
		})

		// mql_data.fieldValues.push({
		// 	"id": "1322",
		// 	"value": item.ATTRIBUTE_8
		// })

		mql_data.fieldValues.push({
			"id": "1323",
			"value": item.jobFunction
		})

		mql_data.fieldValues.push({
			"id": "1324",
			"value": item.businessUnit
		})

		mql_data.fieldValues.push({
			"id": "1325",
			"value": item.division
		})

		mql_data.fieldValues.push({
			"id": "1326",
			"value": item.seniority
		})

		mql_data.fieldValues.push({
			"id": "1327",
			"value": item.needs
		})

		mql_data.fieldValues.push({
			"id": "1328",
			"value": item.timeLine
		})

		mql_data.fieldValues.push({
			"id": "1329",
			"value": item.marketingEvent
		})

		mql_data.fieldValues.push({
			"id": "1330",
			"value": item.privacyPolicyYn
		})

		mql_data.fieldValues.push({
			"id": "1338",
			"value": utils.timeConverter("GET_UNIX", item.privacyPolicyDate)
		})

		mql_data.fieldValues.push({
			"id": "1331",
			"value": item.transferOutsideEeaYn
		})

		mql_data.fieldValues.push({
			"id": "1337",
			"value": utils.timeConverter("GET_UNIX", item.transferOutsideEeaDate)
		})

		mql_data.fieldValues.push({
			"id": "1667",
			"value": item.customerType
		})

		mql_data.fieldValues.push({
			"id": "1977",
			"value": item.marketingAgreementYn
		})

		mql_data.fieldValues.push({
			"id": "1978",
			"value": utils.timeConverter("GET_UNIX", item.marketingAgreementDate)
		})

		mql_data.fieldValues.push({
			"id": "1332",
			"value": item.eloquaProduct1
		})

		mql_data.fieldValues.push({
			"id": "1333",
			"value": item.eloquaProduct2
		})

		mql_data.fieldValues.push({
			"id": "1334",
			"value": item.eloquaProduct3
		})

		mql_data.fieldValues.push({
			"id": "1335",
			"value": item.verticalType
		})

		mql_data.fieldValues.push({
			"id": "1336",
			"value": utils.timeConverter("GET_UNIX", item.registerDate)
		})

		mql_data.fieldValues.push({
			"id": "1339",
			"value": utils.timeConverter("GET_UNIX", item.transferDate)
		})

		mql_data.fieldValues.push({
			"id": "1340",
			"value": item.transferFlag
		})

		mql_data.fieldValues.push({
			"id": "1341",
			"value": utils.timeConverter("GET_UNIX", item.lastUpdateDate)
		});

		mql_data.fieldValues.push({
			"id": "1654",
			"value": item.firstName
		});

		mql_data.fieldValues.push({
			"id": "1655",
			"value": item.lastName
		});

		mql_list.push(mql_data);
	}

	return mql_list;
}



async function mqldata_to_eloqua_send( parent_id , convert_mql_data) {
	let return_list = [];
	console.log(parent_id);
	console.log(convert_mql_data);
	for (const mqldata of convert_mql_data) {
		await lge_eloqua.data.customObjects.data.create(parent_id, mqldata).then((result) => {
			
			return_list.push(result.data);
		}).catch((err) => {
			// console.error(err);
			console.error(err.message);
		});
	}

	return return_list;

}

function mqldata_push_customobjectid(origin_data, update_data) {
	for (let i = 0; i < origin_data.length; i++) {
		for (const update_item of update_data) {
			// console.log("origin contact id : " + origin_data[i].ATTRIBUTE_1);
			// console.log("update contact id : " + update_item.contactId);
			if (origin_data[i].contactId == update_item.contactId) {
				origin_data[i]['customObjectId'] = update_item.id;
			}
		}
	}

	return origin_data;
}



//Eloqua Data B2B GERP Global Mapping Subsidiray 없을 경우
async function Convert_B2BGERP_GLOBAL_NOSUBSIDIARY_DATA(contacts_data, business_department ) {
	var result_data = [];
	if (!contacts_data) return;
	for (var i = 0; i < contacts_data.elements.length; i++) {

		try {

			var result_item = new B2B_GERP_GLOBAL_ENTITY();
			var FieldValues_data = contacts_data.elements[i].fieldValues;

			//result_item.INTERFACE_ID = "ELOQUA_0003" // this.INTERFACE_ID = "ELOQUA_0003"

			var business_interface_num = 0;
			switch (business_department) {
				case "AS": business_interface_num = 1; break;
				case "CLS": business_interface_num = 2; break;
				case "CM": business_interface_num = 3; break;
				case "ID": business_interface_num = 4; break;
				case "IT": business_interface_num = 5; break;
				case "Solar": business_interface_num = 6; break;
				case "Solution": business_interface_num = 7; break;
				case "TEST": business_interface_num = 1; break;
				default: business_interface_num = 0; break;
			}

			result_item.interfaceId = moment().format('YYYYMMDD') + business_interface_num + lpad(global_seq_cnt, 5, "0");
			//리드네임 [MQL]Subsidiary_BU_Platform&Activity_Register Date+Hour 값을 조합
			//리드네임 {{Business Unit}}_{{Subsidiary}}_{{Platform}}_{{Activity}}_{{Date}}
			//리드네임 {{Business Unit}}_{{Subsidiary}}_{{Platform&Activity}}_{{Date}}
			//리드네임 {{100229}}_{{100196}}_{{100202}}_{{100026}}
			//리드네임 [MQL]Subsidiary_BU_Platform&Activity_Register Date+Hour 값을 조합

			global_seq_cnt = global_seq_cnt + 1;

			

			result_item.leadName =
				//GetCustomFiledValue(FieldValues_data, 100229) + "_" +
				"[MQL]" + GetCustomFiledValue(FieldValues_data, 100196) + "_" +
				business_department + "_" +
				GetCustomFiledValue(FieldValues_data, 100202) + "_" +
				moment().format('YYYYMMDD');

			result_item.siteName = GetCustomFiledValue(FieldValues_data, 100187) == "" ? "N/A" : GetCustomFiledValue(FieldValues_data, 100187);        //100187	Territory //SITE_NAME ( 현장명 매핑필드 확인 ) //2021-02-02 기준 데이터 없음
			result_item.leadSourceName = GetCustomFiledValue(FieldValues_data, 100202) == "" ? "N/A" : GetCustomFiledValue(FieldValues_data, 100202); //리드소스 네임 Platform&Activity 필드 매핑 // 폼에 히든값으로 존재
			result_item.leadSourceType = "11";                                          //default 11 (협의됨) //Eloqua에서 넘어오는 값이면 By Marketing, 영업인원이 수기입할 경우 By Sales로 지정

			

			result_item.entryType = "L"                                                  //default L
			result_item.account = GetDataValue(contacts_data.elements[i].accountName) == "" ? "N/A" : GetDataValue(contacts_data.elements[i].accountName);    //ACCOUNT ( 회사 )  // Company Name
			result_item.contactPoint = GetCustomFiledValue(FieldValues_data, 100172) == "" ? "None" : GetCustomFiledValue(FieldValues_data, 100172);
				// + "/" +
				//GetDataValue(contacts_data.elements[i].firstName) + " " + GetDataValue(contacts_data.elements[i].lastName) + "/" +
				// GetDataValue(contacts_data.elements[i].emailAddress) + "/" +
				// GetDataValue(contacts_data.elements[i].mobilePhone) + "/"               //Contact Point는 Eloqua 필드 중 -> Customer Name/Email/Phone No. 를 연결 시켜 매핑 필요
			result_item.corporation = "LGE" + GetCustomFiledValue(FieldValues_data, 100196);  //법인정보 "LGE" + {{Subsidiary}}
			// result_item.OWNER = "";                                                       //(확인필요);


			let address = "";
			address += GetDataValue(contacts_data.elements[i].address1);
			if (address != "") address += " " + GetDataValue(contacts_data.elements[i].address2);
			if (address != "") address += " " + GetDataValue(contacts_data.elements[i].address3);
			address += "/" + GetDataValue(contacts_data.elements[i].city) + "/" + GetDataValue(contacts_data.elements[i].country);	//주소정보 Address1 + Address2 + Address3 // Inquiry To Buy 주소 입력 없음



			result_item.address = address;
			//result_item.DESCRIPTION = GetDataValue(contacts_data.elements[i].description);//설명 Comments, message, inquiry-to-buy-message 필드 중 하나 (확인필요) //DESCRIPTION
			let description = GetCustomFiledValue(FieldValues_data, 100209);
			result_item.description = description.length >= 1500 ? description.substring(0, 1675) : description;      //설명 inquiry-to-buy-message 필드

			result_item.contactId = GetDataValue(contacts_data.elements[i].id);         //Eloqua Contact ID
			result_item.budget = GetBusiness_Department_data(FieldValues_data, business_department, "Budget"); //PRODUCT LV1의 BU 별 
			result_item.verticalType2 = GetBusiness_Department_data(FieldValues_data, business_department, "Vertical_Level_2"); //Vertical Level 2
			result_item.email = GetDataValue(contacts_data.elements[i].emailAddress);   //이메일
			result_item.phone = GetDataValue(contacts_data.elements[i].mobilePhone);    //전화번호 (businessPhone 확인필요)
			// result_item.ATTRIBUTE_6 = "";                                                     //(확인필요)
			result_item.region = GetCustomFiledValue(FieldValues_data, 100069);          //지역 - 국가 eloqua filed 정보
			// result_item.ATTRIBUTE_8 = "";
			result_item.jobFunction = GetBusiness_Department_data(FieldValues_data, business_department, "Job Function"); //(Job Function 사업부별 컬럼 확인 필요)
			result_item.businessUnit = business_department; //(Business Unit 가장 최근 기준 BU값)
			//result_item.ATTRIBUTE_10 = GetBusiness_Department_data(FieldValues_data, business_department, "Business Unit"); //(Business Unit 사업부별 컬럼 확인 필요)

			result_item.division = "";                                                    //division (확인필요) 사업부코드( 코드마스터 필요 ) 예) HE    LGE 앞자리 빼는지 확인 필요
			result_item.seniority = GetBusiness_Department_data(FieldValues_data, business_department, "Seniority"); //Seniority
			result_item.needs = GetBusiness_Department_data(FieldValues_data, business_department, "Needs");     //PRODUCT LV1의 BU 별 Needs //(Nees 사업부별 컬럼 확인 필요)  // Inquiry Type* Needs
			result_item.timeLine = GetBusiness_Department_data(FieldValues_data, business_department, "TimeLine");  //PRODUCT LV1의 BU 별 Timeline //(Nees 사업부별 컬럼 확인 필요)
			result_item.marketingEvent = GetCustomFiledValue(FieldValues_data, 100203);                                   //Marketing Event //100203	Marketing Event // 폼 히든값
			result_item.privacyPolicyYn = GetCustomFiledValue(FieldValues_data, 100213) == "Yes" ? "Y" : "N";              //Privacy Policy YN //100213	Privacy Policy_Agreed // privcy Policy*

			var Privacy_Policy_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100199));
			result_item.privacyPolicyDate = Privacy_Policy_Date == null ? "" : Privacy_Policy_Date; //Privacy Policy Date : 100199	Privacy Policy_AgreedDate

			result_item.transferOutsideEeaYn = GetCustomFiledValue(FieldValues_data, 100210) == "Yes" ? "Y" : "N";     //TransferOutside EEA YN : 100210	TransferOutsideCountry*

			var TransferOutside_EEA_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100208));
			result_item.transferOutsideEeaDate = TransferOutside_EEA_Date == null ? "" : TransferOutside_EEA_Date; //TransferOutside EEA Date : 100208	TransferOutsideCountry_AgreedDate

			result_item.marketingAgreementYn = GetCustomFiledValue(FieldValues_data, 100211) == "Yes" ? "Y" : "N";     //Direct Marketing_EM YN 100211

			var Marketing_Agreement_Date = utils.timeConverter("GET_DATE", GetCustomFiledValue(FieldValues_data, 100200));
			result_item.marketingAgreementDate = Marketing_Agreement_Date == null ? "" : Marketing_Agreement_Date; //Direct Marketing_EM Date

			result_item.customerType = GetBusiness_Department_data(FieldValues_data, business_department, "Customer Type");    //Customer Type

			result_item.eloquaProduct1 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_Category");     //ELOQUA 내 Product 1 //(사업부별 컬럼 확인 필요)
			result_item.eloquaProduct2 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_SubCategory");  //ELOQUA 내 Product 2 없을경우 NULL // (사업부별 컬럼 확인 필요)
			result_item.eloquaProduct3 = GetBusiness_Department_data(FieldValues_data, business_department, "Product_Model");        //ELOQUA 내 Product 3 없을경우 NULL // (사업부별 컬럼 확인 필요)

			result_item.verticalType = GetBusiness_Department_data(FieldValues_data, business_department, "Vertical_Level_1");    //Vertical Level_1

			result_item.registerDate = moment().format('YYYY-MM-DD hh:mm:ss');    //어떤 날짜 정보인지 확인 필요 //utils.timeConverter("GET_DATE", contacts_data.elements[i].createdAt);
			result_item.transferDate = moment().format('YYYY-MM-DD hh:mm:ss');    //어떤 날짜 정보인지 확인 필요
			result_item.transferFlag = "Y";	 									//TRANSFER_FLAG N , Y 값의 용도 확인 필요
			result_item.lastUpdateDate = utils.timeConverter("GET_DATE", contacts_data.elements[i].updatedAt);

			result_item.firstName = GetDataValue(contacts_data.elements[i].firstName);
			result_item.firstName = result_item.firstName.length > 40 ? result_item.firstName.substring(0, 40) : result_item.firstName;
			result_item.lastName = GetDataValue(contacts_data.elements[i].lastName) == "" ? "None" : GetDataValue(contacts_data.elements[i].lastName);
			result_item.lastName = result_item.lastName.length > 80 ? result_item.lastName.substring(0, 80) : result_item.lastName;

			let notBant_emailType_List = ["@lg.com", "@lge.com", "@goldenplanet.co.kr", "@test.com", "@cnspartner.com", "@intellicode.co.kr", "@hsad.co.kr", "@test.co.kr", "@test.test", "@testtest.com"];
			// let notBant_emailType_List = ["@goldenplanet.co.kr"];
			let notBant_email_list = notBant_emailType_List.filter(function (sentence) {
				return result_item.email.indexOf(sentence) > -1 ? result_item.email : null;
			});

			// for(let k = 0 ; notBant_emailType_List.length > k ; k++){
			// 	let notBant_item = notBant_emailType_List[k];
			// 	notBant_item
			// }
			// console.log(notBant_email_list.length);

			let subsidiaryOption = ['LGEAP', 'LGESL', 'LGETH', 'LGECH', 'LGEHK', 'LGEIL', 'LGEIN', 'LGEML', 'LGEPH', 'LGETT', 'LGEVH', 'LGEJP', 'LGEKR', 'LGERA', 'LGEAK', 'LGEUR', 'LGEMK',
    		'LGEAG', 'LGEBN', 'LGEHS', 'LGECZ', 'LGEDG', 'LGEPL', 'LGEFS', 'LGEUK', 'LGEIS', 'LGEPT', 'LGERO', 'LGEES', 'LGEPS', 'LGEAR', 'LGECL', 'LGESP', 'LGECB', 'LGEMS', 'LGEPR', 'LGEGF',
    		'LGEAS', 'LGEAF', 'LGESA', 'LGEEF', 'LGEEG', 'LGEIR', 'LGELF', 'LGEYK', 'LGEMC', 'LGESB', 'LGETU', 'LGETK', 'LGECI', 'LGEUS', 'LGEHQ', 'LGESW', 'LGELA', 'LGELV'];
			let subsidiaryCheck;
			if(subsidiaryOption.includes(result_item.corporation)){
				subsidiaryCheck = true;
			}else{
				subsidiaryCheck = false;
			}

			if (result_item.corporation == "" || result_item.corporation == "LGE"  || subsidiaryCheck == false)
				result_data.push(result_item);		
		}
		catch (e) {
			console.log(e);
		}
	}
	return result_data;
}


function CONVERT_B2BGERP_GLOBAL_SUBSIDIARY_MISSING(request_data) {
	let mql_list = [];
	for (const item of request_data) {
		let mql_data = {};
		mql_data.fieldValues = [];

		mql_data.name = item.email;
		mql_data.contactId = item.contactId;
		mql_data.isMapped = "Yes";
		mql_data.type = "CustomObjectData";

		mql_data.fieldValues.push({
			"id": "905",
			"value": item.interfaceId
		})

		mql_data.fieldValues.push({
			"id": "906",
			"value": item.leadName
		})

		mql_data.fieldValues.push({
			"id": "907",
			"value": item.siteName
		})

		mql_data.fieldValues.push({
			"id": "908",
			"value": item.leadSourceName
		})

		mql_data.fieldValues.push({
			"id": "909",
			"value": item.leadSourceType
		})

		mql_data.fieldValues.push({
			"id": "910",
			"value": item.entryType
		})

		mql_data.fieldValues.push({
			"id": "911",
			"value": item.account
		})

		mql_data.fieldValues.push({
			"id": "912",
			"value": item.contactPoint
		})

		mql_data.fieldValues.push({
			"id": "913",
			"value": item.corporation
		})

		// mql_data.fieldValues.push({
		// 	"id": "914",
		// 	"value": item.OWNER
		// })

		mql_data.fieldValues.push({
			"id": "915",
			"value": item.address

		})

		mql_data.fieldValues.push({
			"id": "916",
			"value": item.description
		})

		mql_data.fieldValues.push({
			"id": "917",
			"value": item.contactId
		})

		mql_data.fieldValues.push({
			"id": "918",
			"value": item.budget
		})

		mql_data.fieldValues.push({
			"id": "919",
			"value": item.verticalType2
		})

		mql_data.fieldValues.push({
			"id": "920",
			"value": item.email
		})

		mql_data.fieldValues.push({
			"id": "921",
			"value": item.phone
		})

		// mql_data.fieldValues.push({
		// 	"id": "922",
		// 	"value": item.ATTRIBUTE_6
		// })

		mql_data.fieldValues.push({
			"id": "923",
			"value": item.region
		})

		// mql_data.fieldValues.push({
		// 	"id": "924",
		// 	"value": item.ATTRIBUTE_8
		// })

		mql_data.fieldValues.push({
			"id": "925",
			"value": item.jobFunction
		})

		mql_data.fieldValues.push({
			"id": "926",
			"value": item.businessUnit
		})

		mql_data.fieldValues.push({
			"id": "927",
			"value": item.division
		})

		mql_data.fieldValues.push({
			"id": "928",
			"value": item.seniority
		})

		mql_data.fieldValues.push({
			"id": "929",
			"value": item.needs
		})

		mql_data.fieldValues.push({
			"id": "930",
			"value": item.timeLine
		})

		mql_data.fieldValues.push({
			"id": "931",
			"value": item.marketingEvent
		})

		mql_data.fieldValues.push({
			"id": "932",
			"value": item.privacyPolicyYn
		})

		mql_data.fieldValues.push({
			"id": "940",
			"value": utils.timeConverter("GET_UNIX", item.privacyPolicyDate)
		})

		mql_data.fieldValues.push({
			"id": "933",
			"value": item.transferOutsideEeaYn
		})

		mql_data.fieldValues.push({
			"id": "939",
			"value": utils.timeConverter("GET_UNIX", item.transferOutsideEeaDate)
		})

		mql_data.fieldValues.push({
			"id": "1671",
			"value": item.customerType
		})

		mql_data.fieldValues.push({
			"id": "1986",
			"value": item.marketingAgreementYn
		})

		mql_data.fieldValues.push({
			"id": "1985",
			"value": utils.timeConverter("GET_UNIX", item.marketingAgreementDate)
		})

		mql_data.fieldValues.push({
			"id": "934",
			"value": item.eloquaProduct1
		})

		mql_data.fieldValues.push({
			"id": "935",
			"value": item.eloquaProduct2
		})

		mql_data.fieldValues.push({
			"id": "936",
			"value": item.eloquaProduct3
		})

		mql_data.fieldValues.push({
			"id": "937",
			"value": item.verticalType
		})

		mql_data.fieldValues.push({
			"id": "938",
			"value": utils.timeConverter("GET_UNIX", item.registerDate)
		})

		mql_data.fieldValues.push({
			"id": "941",
			"value": utils.timeConverter("GET_UNIX", item.transferDate)
		})

		mql_data.fieldValues.push({
			"id": "942",
			"value": item.transferFlag
		})

		mql_data.fieldValues.push({
			"id": "943",
			"value": utils.timeConverter("GET_UNIX", item.lastUpdateDate)
		});

		/*		FIXME: 테스트 종료 후 본 환경 배포시 수정
		id도 수정할 것 

		mql_data.fieldValues.push({
			"id": "1654",
			"value": item.firstName
		});

		mql_data.fieldValues.push({
			"id": "1655",
			"value": item.lastName
		});
		 */
		mql_list.push(mql_data);
	}

	return mql_list;
}



async function setBant_Update(bant_name, contact_list) {

	var bu_bant_id_list = [];

	switch (bant_name) {
		case "ID":
			bu_bant_id_list = ['100254', '100255', '100256', '100337'];
			break;

		case "IT":
			bu_bant_id_list = ['100264', '100265', '100266', '100338'];
			break;

		case "Solar":
			bu_bant_id_list = ['100291', '100272', '100273', '100339'];
			break;

		case "AS":
			bu_bant_id_list = ['100215', '100220', '100221', '100336'];
			break;

		case "CLS":
			bu_bant_id_list = ['100276', '100278', '100279', '100341'];
			break;

		case "CM":
			bu_bant_id_list = ['100282', '100284', '100285', '100342'];
			break;

		case "Solution":
			bu_bant_id_list = ['100222', '100223', '100224', '100343'];
			break;

		case "TEST":
			bu_bant_id_list = ['100215', '100220', '100221', '100336'];
			break;
	}
	//   var bant_list = [
	//     100254, 100255, 100256, // ID 
	//     100264, 100265, 100266, // IT
	//     //100291, 100272, 100273, // Solar
	//     100215, 100220, 100221, // AS
	//     100276, 100278, 100279, // CLS
	//     100282, 100284, 100285, // CM
	//     100222, 100223, 100224, // Solution
	//   ]

	//   var status_list = [100337, 100338, 100339, 100336, 100341, 100342, 100343] // 순서대로 ID , IT , Solar , AS , CLS , CM , Solution 의 Status

	var bant_result_list = [];
	for (let i = 0; contact_list.length > i; i++) {
		var bant_logs = {};
		contact_list[i]['accountname'] = contact_list[i].accountName;
		delete contact_list[i].accountName;



		for (let j = 0; contact_list[i].fieldValues.length > j; j++) {
			var FieldValues_item = contact_list[i].fieldValues[j];
			if (bu_bant_id_list.indexOf(FieldValues_item.id) > -1) {
				contact_list[i].fieldValues[j].value = "";
			}
		}


		await lge_eloqua.data.contacts.update(contact_list[i].id, contact_list[i]).then((result) => {

			// console.log(result.data);


			bant_logs.email = contact_list[i].emailAddress;
			bant_logs.bant_update = "Y";
			bant_logs.message = "success";
			bant_result_list.push(bant_logs);
			// console.log(result.data);
		}).catch((err) => {
			bant_logs.email = contact_list[i].emailAddress;
			bant_logs.bant_update = "Y";
			bant_logs.message = err.message;
			bant_result_list.push(bant_logs);
			console.error(err.message);
		});

	}

	return bant_result_list;
}


// router.post('/testMissing', async function (req, res, next) {

// 	// let contact_list = await get_b2bgerp_global_bant_data("TEST", "2022-07-03", "2022-07-03");

// 	var business_name = "TEST"
// 	var contact_list = req.body;

// 	var request_data = await Convert_B2BGERP_GLOBAL_DATA(contact_list, business_name);
// 	//let temp_nosub_data = await Convert_B2BGERP_GLOBAL_NOSUBSIDIARY_DATA(contact_list , business_name)

// 	let mql_customobject_list = await TEST_CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data);
// 	//let update_mql_data = await mqldata_to_eloqua_send( 146 , mql_customobject_list);
// 	let update_data = await mqldata_push_customobjectid(request_data, mql_customobject_list);

// 	return res.json(update_data);
// })

//# region Bant 조건 사업부별 contact 데이터 전송을 하는 함수
pipe_global_bant_send = async function (business_name, state_date, end_date , req, res) {
	console.log("pipe_global_bant_send function BS NAME : " + business_name);
	
	// var parentId = 46;  // B2B GERP GLOBAL CustomObject ID

	var parentId = 146;  // SFDC B2B GERP GLOBAL CustomObject ID

	let status = "prd"
	let access_token_data = await utils.getPipe_AccessToken(status);

	let send_url ; 

	
	
	switch(status){
		//LG전자 파이프라인 개발 URL
		case "dev" : send_url = "https://lge--dev.my.salesforce.com/services/apexrest/mat/eloqua/lead/global";
		break;

		//LG전자 파이프라인 스테이징 URL
		case "stg" : send_url  = "https://lge--sb.my.salesforce.com/services/apexrest/mat/eloqua/lead/global";
		break;

		//LG전자 파이프라인 실전검증 URL 
		case "fullstg" : send_url  = "https://lge--fs.my.salesforce.com/services/apexrest/mat/eloqua/lead/global";
		break;

		//LG전자 파이프라인 운영 URL
		case "prd" : send_url = "https://lge.my.salesforce.com/services/apexrest/mat/eloqua/lead/global";
		break;
	}
	
	let contact_list = await get_b2bgerp_global_bant_data(business_name, state_date, end_date);

	// console.log(contacts_data);


	if(contact_list != null){

		// contacts_data : Eloqua 에 Bant 업데이트를 하기 위한 필드
		// request_data : B2B GERP 에 전송할 데이터
		var request_data = await Convert_B2BGERP_GLOBAL_DATA(contact_list, business_name);
		var bant_update_list;
		if (contact_list) bant_update_list = contact_list.elements;

		//pipe test 를 위해 추가
		
	
		
		// 사업부별 Eloqua Data 건수 및 실제 전송 건수 로그를 쌓기 위함 (이메일 필터링에 의해 Eloqua Data 건수와 실제 전송 건수 는 다를 수 있음)
		let total_logs = {
			bsname: business_name,
			search_time: utils.todayDetail_getDateTime(),
			eloqua_total: contact_list && contact_list.total ? contact_list.total : 0,
			convert_total: request_data ? request_data.length : 0
		}


		// reqEloqua : Eloqua Data List , reqConvert : 실제 전송 list , reqTotal : Eloqua Data 건수 및 실제 전송 건수 기록
		req_res_logs("reqEloqua", business_name, "PIPELINE_GLOBAL" , contact_list);
		req_res_logs("reqConvert", business_name, "PIPELINE_GLOBAL" , request_data);
		req_res_logs("reqTotal", business_name, "PIPELINE_GLOBAL",  total_logs);


		// MQL Data 전송 전 MQL Data List 를 CustomObject 에 적재하기 위해 데이터 형태 변경
		// pipe test 를 위해 주석 처리
		// let mql_customobject_list = await CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data);
		let mql_customobject_list = await TEST_CONVERT_B2BGERP_GLOBAL_CUSTOMOBJECT(request_data);
		
		// MQL Data 전송 전 MQL Data List 를 CustomObject 에 적재 update_mql_data은 customobject 적재값임
		// pipe 테스트 를 위해 주석 처리
		let update_mql_data = await mqldata_to_eloqua_send( parentId , mql_customobject_list);
		
		// CustomObject 에 적재된 MQL DATA를 CUSTOMBOEJCT_ID 고유값을 추가
		let update_data = await mqldata_push_customobjectid(request_data, update_mql_data);
		req_res_logs("reqCustomData", business_name, "PIPELINE_GLOBAL" ,  update_data);
		// console.log(access_token_data);


		let token_data = {};

		try{
			token_data = JSON.parse(access_token_data);
		}catch (error){
			if(error) error.stack();
		}
		let token_type = token_data.token_type ? token_data.token_type : undefined;
		let token = token_data.access_token ? token_data.access_token : undefined;
		
		// console.log("send_url : " + send_url);
		// console.log("token_type : " + token_type)
		// console.log("token : " + token)
		if(!token_type || !token) return;
		var headers = {
			'Content-Type': "application/json",
			'Authorization' : token_type + " " + token
		}

		
		options = {
			url: send_url,
			method: "POST",
			headers: headers,
			body: { ContentList: update_data },
			json: true
		};

		
		

		//pipe test 를 위한 임시코드
		await request_promise.post(options, async function (error, response, body) {
		

			if (error) {
				console.log(0);
				console.log("에러에러(wise 점검 및 인터넷 연결 안됨)");
				console.log(error);
				req_res_logs("bantsend_error", business_name, "PIPELINE_GLOBAL", []);
			}
			else if(!error && response.statusCode != 200 ){
				console.log(1);
				req_res_logs("bantsend_not send", business_name, "PIPELINE_GLOBAL", []);
			}
			else if (!error && response.statusCode == 200) {
				console.log(body);
				req_res_logs("response", business_name, "PIPELINE_GLOBAL", body);
				console.log(2);


				if (contact_list && contact_list.total) {


					// Bant 전송 후 Eloqua 에 Bant 조건을 초기화 할 때 Subsidiary 가 없는 값은 전송되지 않았기 때문에 제외 한다.
					let bant_update_data = [];
					let not_bant_data = [];
					if (contact_list && contact_list.elements) {
						for (const bant_item of contact_list.elements) {
							let fieldValues_list = bant_item.fieldValues;
							let subsidiary_data = GetCustomFiledValue(fieldValues_list, 100196);

							if (subsidiary_data != "" && subsidiary_data != "LGE") bant_update_data.push(bant_item);
							else { 
								not_bant_data.push(bant_item) ;
							}
						}
					}

					let temp_nosub_data = await Convert_B2BGERP_GLOBAL_NOSUBSIDIARY_DATA(contact_list , business_name)
					// MQL Data 전송 전 MQL Data List 를 CustomObject 에 적재하기 위해 데이터 형태 변경
					let temp_nosub_customobject = await CONVERT_B2BGERP_GLOBAL_SUBSIDIARY_MISSING(temp_nosub_data);

					// MQL Data 전송 전 MQL Data List 를 CustomObject 에 적재 update_mql_data은 customobject 적재값임
					await mqldata_to_eloqua_send( 105 ,temp_nosub_customobject);

					// Pipe Test 를 위해 주석처리
					// var bant_result_list = await setBant_Update(business_name, bant_update_list);
					// req_res_logs("bantUpdateData", business_name, "PIPELINE_GLOBAL",  bant_result_list);
					// req_res_logs("NOT_bantUpdateData", business_name, "PIPELINE_GLOBAL" , not_bant_data);
				}

				// res.json(body);
			}
			
		});

	}
}


//business_department ( AS , CLS , CM , ID , IT , Solar , Solution )
//key ( Job Function , Business Unit , Seniority , Needs , TimeLine )
function GetBusiness_Department_data(fieldValues, business_department, key) {

	var result_data = "";
	switch (business_department) {
		case "AS":
			switch (key) {
				case "Job Function":
					//100323	AS_Authority2(Job Function)
					result_data = GetCustomFiledValue(fieldValues, 100323);
					break;
				case "Business Unit":
					// 100328	//Business Unit_AS
					result_data = GetCustomFiledValue(fieldValues, 100328);
					break;
				case "Seniority":
					// 100219	AS_Authority1(Seniority)  
					result_data = GetCustomFiledValue(fieldValues, 100219);
					break;
				case "Needs":
					// 100215	AS_Needs
					result_data = GetCustomFiledValue(fieldValues, 100215);
					break;
				case "TimeLine":
					// 100221	AS_TimeLine
					result_data = GetCustomFiledValue(fieldValues, 100221);
					break;
				case "Budget":
					// 100221	AS_TimeLine
					result_data = GetCustomFiledValue(fieldValues, 100220);
					break;
				case "Product_Category":
					// 100205	AS_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100205);
					break;
				case "Product_SubCategory":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Product_Model":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Vertical_Level_1":
					//100206	AS_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100206));
					break;
				case "Vertical_Level_2":
					//100345	AS_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100206) ,GetCustomFiledValue(fieldValues, 100345));
					break;
				case "Customer Type":
					//100216	AS_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100216);
					break;
			}
			break;
		case "CLS":
			switch (key) {
				case "Job Function":
					// 100327	CLS_Authority2(Job Function)  
					result_data = GetCustomFiledValue(fieldValues, 100327);
					break;
				case "Business Unit":
					// 100329	//Business Unit_CLS
					result_data = GetCustomFiledValue(fieldValues, 100327);
					break;
				case "Seniority":
					// 100289	CLS_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100289);
					break;
				case "Needs":
					// 100276	CLS_Needs
					result_data = GetCustomFiledValue(fieldValues, 100276);
					break;
				case "TimeLine":
					// 100278	CLS_TimeLine
					result_data = GetCustomFiledValue(fieldValues, 100278);
					break;
				case "Budget":
					// 100279	CLS_Budget
					result_data = GetCustomFiledValue(fieldValues, 100279);
					break;

				case "Product_Category":
					// 100277	CLS_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100277);
					break;
				case "Product_SubCategory":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Product_Model":
					// 필드확인 필요 
					result_data = "";
					break;

				case "Vertical_Level_1":
					//100281	CLS_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100281));
					break;

				case "Vertical_Level_2":
					//100349	CLS_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100281), GetCustomFiledValue(fieldValues, 100349));
					break;
				case "Customer Type":
					//100280	CLS_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100280);
					break;
			}
			break;
		case "CM":
			switch (key) {
				case "Job Function":
					// 100325	CM_Authority2(Job Function)
					result_data = GetCustomFiledValue(fieldValues, 100325);
					break;
				case "Business Unit":
					// 100330	//Business Unit_CM
					result_data = GetCustomFiledValue(fieldValues, 100330);
					break;
				case "Seniority":
					// 100288	CM_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100288);
					break;
				case "Needs":
					// 100282	CM_Needs
					result_data = GetCustomFiledValue(fieldValues, 100282);
					break;
				case "TimeLine":
					// 100284	CM_TimeLine  
					result_data = GetCustomFiledValue(fieldValues, 100284);
					break;
				case "Budget":
					// 100285	CM_Budget
					result_data = GetCustomFiledValue(fieldValues, 100285);
					break;
				case "Category":
					// 100283	CM_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100283);
					break;

				case "Product_Category":
					// 100283	CM_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100283);
					break;
				case "Product_SubCategory":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Product_Model":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Vertical_Level_1":
					//100287	CM_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100287));
					break;
				case "Vertical_Level_2":
					//100350	CM_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100287), GetCustomFiledValue(fieldValues, 100350));
					break;
				case "Customer Type":
					//100286	CM_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100286);
					break;
			}
			break;
		case "ID":
			switch (key) {
				case "Job Function":
					// 100322	ID_Authority2(Job Function)
					result_data = GetCustomFiledValue(fieldValues, 100322);
					break;
				case "Business Unit":
					// 100331	//Business Unit_ID
					result_data = GetCustomFiledValue(fieldValues, 100331);
					break;
				case "Seniority":
					// 100262	ID_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100262);
					break;
				case "Needs":
					// 100254	ID_Needs
					result_data = GetCustomFiledValue(fieldValues, 100254);
					break;
				case "TimeLine":
					// 100255	ID_TimeLine
					result_data = GetCustomFiledValue(fieldValues, 100255);
					break;
				case "Budget":
					// 100256	ID_Budget
					result_data = GetCustomFiledValue(fieldValues, 100256);
					break;
				case "Product_Category":
					// 100257	ID_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100257);
					break;
				case "Product_SubCategory":
					// 100258	ID_Product_Sub-Category
					result_data = GetCustomFiledValue(fieldValues, 100258);
					break;
				case "Product_Model":
					// 100259	ID_Product_ModelName
					result_data = GetCustomFiledValue(fieldValues, 100259);
					break;
				case "Vertical_Level_1":
					//100261	ID_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100261));
					break;
				case "Vertical_Level_2":
					//100346	ID_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100261), GetCustomFiledValue(fieldValues, 100346));
					break;
				case "Customer Type":
					//100260	ID_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100260);
					break;
			}
			break;
		case "IT":
			switch (key) {
				case "Job Function":
					// 100214	IT_Authority2(Job Function)
					result_data = GetCustomFiledValue(fieldValues, 100214);
					break;
				case "Business Unit":
					// 100332	//Business Unit_IT
					result_data = GetCustomFiledValue(fieldValues, 100332);
					break;
				case "Seniority":
					// 100269	IT_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100269);
					break;
				case "Needs":
					// 100264	IT_Needs
					result_data = GetCustomFiledValue(fieldValues, 100264);
					break;
				case "TimeLine":
					// 100265	IT_TimeLine
					result_data = GetCustomFiledValue(fieldValues, 100265);
					break;
				case "Budget":
					// 100266	IT_Budget
					result_data = GetCustomFiledValue(fieldValues, 100266);
					break;
				case "Product_Category":
					// 100263	IT_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100263);
					break;
				case "Product_SubCategory":
					// 100296	IT_Product Subcategory
					result_data = GetCustomFiledValue(fieldValues, 100296);
					break;
				case "Product_Model":
					// 100306	IT_Product_ModelName
					result_data = GetCustomFiledValue(fieldValues, 100306);
					break;
				case "Vertical_Level_1":
					//100268	IT_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100268));
					break;
				case "Vertical_Level_2":
					//100347	IT_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100268), GetCustomFiledValue(fieldValues, 100347));
					break;
				case "Customer Type":
					//100267	IT_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100267);
					break;
			}
			break;
		case "Solar":
			switch (key) {
				case "Job Function":
					//100324	Solar_Authority2(Job Function)  
					result_data = GetCustomFiledValue(fieldValues, 100324);
					break;
				case "Business Unit":
					//100333	Business Unit_Solar
					result_data = GetCustomFiledValue(fieldValues, 100333);
					break;
				case "Seniority":
					// 100290	Solar_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100290);
					break;
				case "Needs":
					// 100291	Solar_Needs
					result_data = GetCustomFiledValue(fieldValues, 100291);
					break;
				case "TimeLine":
					// 100272	Solar_TimeLine  
					result_data = GetCustomFiledValue(fieldValues, 100272);
					break;
				case "Budget":
					// 100273	Solar_Budget
					result_data = GetCustomFiledValue(fieldValues, 100266);
					break;

				case "Product_Category":
					// 100271	Solar_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100271);
					break;
				case "Product_SubCategory":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Product_Model":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Vertical_Level_1":
					//100275	Solar_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100275));
					break;
				case "Vertical_Level_2":
					//100348	Solar_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100275), GetCustomFiledValue(fieldValues, 100348));
					break;
				case "Customer Type":
					//100274	Solar_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100274);
					break;
			}
			break;
		case "Solution":
			switch (key) {
				case "Job Function":
					// 100321 Solution_Authority2(Job Function)  
					result_data = GetCustomFiledValue(fieldValues, 100321);
					break;
				case "Business Unit":
					//100335	Business Unit_Solution
					result_data = GetCustomFiledValue(fieldValues, 100335);
					break;
				case "Seniority":
					//100228	Solution_Authority1(Seniority)
					result_data = GetCustomFiledValue(fieldValues, 100228);
					break;
				case "Needs":
					//100222	Solution_Needs
					result_data = GetCustomFiledValue(fieldValues, 100222);
					break;
				case "TimeLine":
					//100223	Solution_Timeline
					result_data = GetCustomFiledValue(fieldValues, 100223);
					break;
				case "Budget":
					//100224	Solution_Budget
					result_data = GetCustomFiledValue(fieldValues, 100224);
					break;
				case "Product_Category":
					//100225	Solution_Product Category
					result_data = GetCustomFiledValue(fieldValues, 100225);
					break;
				case "Product_SubCategory":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Product_Model":
					// 필드확인 필요 
					result_data = "";
					break;
				case "Vertical_Level_1":
					//100227	Solution_Business Sector(Lv1) // Vertical_Level_1
					result_data = checkVerticalType1Code(GetCustomFiledValue(fieldValues, 100227));
					break;
				case "Vertical_Level_2":
					//100351	IT_Business Sector(Lv2) // Vertical_Level_2
					result_data = checkVerticalType2Code(GetCustomFiledValue(fieldValues, 100227), GetCustomFiledValue(fieldValues, 100351));
					break;
				case "Customer Type":
					//100226	Solution_Customer Type
					result_data = GetCustomFiledValue(fieldValues, 100226);
					break;
			}
			break;
	}
	return result_data;
}


function GetCustomFiledValue(contacts_customfields, customfieldID) {

	var result_data = "";

	for (var fieled_index in contacts_customfields) {
		var fieldValue_id = contacts_customfields[fieled_index].id;
		var fieldValue_value = contacts_customfields[fieled_index].value;

		if (fieldValue_id == customfieldID) {
			if (fieldValue_value != undefined) {
				result_data = fieldValue_value;
				break;
			}
			else {
				result_data = "";
				break;
			}
		}
	}
	return result_data;
}


function GetCustomObjectValue(filed_id, element, type) {
	var return_value = "";


	for (i = 0; i < element.fieldValues.length; i++) {
		if (element.fieldValues[i].id == filed_id) {
			if (type == "N")
				return_value = element.fieldValues[i].value;
			else {
				moment.locale('kr');
				return_value = moment(element.fieldValues[i].value).add(13, 'Hour').format("YYYY-MM-DD HH:mm:ss");
			}
		}
	}
	return return_value;
}

function lpad(str, padLen, padStr) {
	if (padStr.length > padLen) {
		console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
		return str;
	}
	str += ""; // 문자로
	padStr += ""; // 문자로
	while (str.length < padLen)
		str = padStr + str;
	str = str.length >= padLen ? str.substring(0, padLen) : str;
	return str;
}

function req_res_logs(filename, business_name , folderName, data) {
	// filename : request , response 
	// business_name : 사업부별 name
	// data : log 저장할 데이터

	var today = moment().tz('Asia/Seoul').format("YYYYMMDD") + "_" + folderName;
	var dirPath = utils.logs_makeDirectory(today);

	fs.writeFile(dirPath + filename + "_" + business_name + ".txt", JSON.stringify(data), 'utf8', function (error) {
		if (error) {
			console.log(error);
		} else {
		}
	});
}

pipe_global_lead_update = async function (req, res, next) {

	let status = "prd"
	let access_token_data = await utils.getPipe_AccessToken(status);

	let send_url ; 

	
	switch(status){
		//LG전자 파이프라인 개발 URL
		case "dev" : send_url = "https://lge--dev.my.salesforce.com/services/apexrest/mat/eloqua/lead/number";
		break;

		//LG전자 파이프라인 스테이징 URL
		case "stg" : send_url  = "https://lge--sb.my.salesforce.com/services/apexrest/mat/eloqua/lead/number";
		break;

		//LG전자 파이프라인 실전검증 URL 
		case "fullstg" : send_url  = "https://lge--fs.my.salesforce.com/services/apexrest/mat/eloqua/lead/number";
		break;

		//LG전자 파이프라인 운영 URL
		case "prd" : send_url = "https://lge.my.salesforce.com/services/apexrest/mat/eloqua/lead/number";
		break;
	}

	// const parentId = 46;  // B2B GERP GLOBAL CustomObject ID
	const parent_id = 146;  // SFDC B2B GERP GLOBAL CustomObject ID
	
	console.log("Pipeline pipe_global_lead_update");

	let token_data = {};

	try{
		token_data = JSON.parse(access_token_data);
	}catch (error){
		if(error) error.stack();
	}
	let token_type = token_data.token_type ? token_data.token_type : undefined;
	let token = token_data.access_token ? token_data.access_token : undefined;
	
	// console.log("send_url : " + send_url);
	// console.log("token_type : " + token_type)
	// console.log("token : " + token)
	if(!token_type || !token) return;
	var headers = {
		'Content-Type': "application/json",
		'Authorization' : token_type + " " + token
	}

	// 당일 전송된 MQL에 대하여 LeadNumber 업데이트
	var yesterday_Object = utils.yesterday_getDateTime();
	console.log(yesterday_Object.end)
	let options = {
		url: send_url + "?convertedDate=" + yesterday_Object.end,
		// url: send_url + "?convertedDate=2022-04-26" ,
		method: "get",
		headers: headers,
		// body: { ContentList: update_data },
		// pipe test 를 위해 주석 처리
		// params : { convertedDate: "2022-04-19" },
		json: true
	};

	
	let getLeadnumberResponse_list = await getResponseLeadData(options);
	// res.json(getLeadnumberResponse_list);

	// 테스트용 ===== body 데이터로만 업데이트
	// getLeadnumberResponse_list = req.body;
	// 테스트용 ===== body 데이터로만 업데이트

	if (getLeadnumberResponse_list.resultCount > 0) {

		for (var resItem of getLeadnumberResponse_list.contentList) {
			var updateForm = {};

			updateForm.fieldValues = [
                {
                    "type": "FieldValue",
                    // "id": "525",  // CDO LEAD_NUMBER id
                    "id": "1342",  // TEST CDO LEAD_NUMBER id
                    "value": resItem.leadSeq
                }, 
				{
                    "type": "FieldValue",
                    // "id": "526",  // CDO LEAD_CREATE_DATE id
                    "id": "1343",  // TEST CDO LEAD_CREATE_DATE id
                    "value": utils.timeConverter("GET_UNIX" , resItem.leadCreateDate )
                }
            ];

			lge_eloqua.data.customObjectData.update(parent_id, resItem.customObjectId, updateForm).then((result) => {
		
				if (result.data && result.data.total > 0) {
					console.log('update 완료 : ' + result.data);
				}

			}).catch((err) => {
				console.log(err.message);
			});
		}

		console.log('업데이트 요청 완료');

	} else {
		console.log(getLeadnumberResponse_list.message);
		console.log('데이터 조회결과 0건');
	}
}

async function getLeadnumberData(parent_id) {
	var yesterday_Object = utils.yesterday_getDetailDateTime();


	console.log(yesterday_Object.start);
	console.log(yesterday_Object.end);
	// 2022-02-01 00:00:00 to unix time : 1643641200
	var queryString = {
		depth: "complete",
		search : "?LEAD_NUMBER1=''ATTRIBUTE_17_Privacy_Policy_Date_1>'" + yesterday_Object.start + "'ATTRIBUTE_17_Privacy_Policy_Date_1<'" + yesterday_Object.end +"'"
		// search : "?LEAD_NUMBER1=''ATTRIBUTE_17_Privacy_Policy_Date_1>'1643641200'ATTRIBUTE_17_Privacy_Policy_Date_1<'1683641200'" 
		// search : "?LEAD_NUMBER1=''ATTRIBUTE_17_Privacy_Policy_Date_1>'2022-04-19 01:00:00'ATTRIBUTE_17_Privacy_Policy_Date_1<'2022-04-21 24:00:00'" 
		// search : "?LEAD_NUMBER1=''ATTRIBUTE_17_Privacy_Policy_Date_1>'1643641200'"
	}
	let return_data ;
	console.log(1234);
	// console.log(lge_eloqua.assets.customObjects);
	await lge_eloqua.data.customObjects.data.get( parent_id , queryString).then((result) => {
		// console.log(result.data);
		return_data = result.data;
	}).catch((err) => {
		console.error(err.message);
	});

	return return_data;
}

async function ConvertLeadtoJSON(data_list){

	let lead_list = [];

	for(let i = 0 ; i < data_list.length ; i ++){
		let lead_data = {};

		lead_data.EloquaId = data_list[i].contactId
		lead_data.LeadSeq = "";
		lead_data.LeadCreateDate = ""; 
		lead_data.CustomobjectId = data_list[i].id

		await lead_list.push(lead_data);
	}

	return lead_list;
}


async function getResponseLeadData(options){

	let response_data ;
	await request_promise.get(options, async function (error, response, body) {
		if (error) {
			console.log(0);
			console.log("에러에러(wise 점검 및 인터넷 연결 안됨)");
			console.log(error);
			req_res_logs("error", "GET_LEAD", "PIPELINE_GLOBAL", []);
		}
		else if(!error && response.statusCode != 200 ){
			console.log(1);
			req_res_logs("notget", "GET_LEAD", "PIPELINE_GLOBAL", []);
		}
		else if (!error && response.statusCode == 200) {
			console.log(body);
			req_res_logs("response", "GET_LEAD", "PIPELINE_GLOBAL", body);
			console.log(2);
			response_data = body;
		}
	});

	return response_data;
}

async function mappedGlobalLeadData(data) {
	
	var result_list = [];
	
		for (var item of data) {

			var resultItem = {};
			resultItem.id = item.CUSTOMOBJECT_ID;
			var fieldValuesItem = [];

			fieldValuesItem.push({
				"id": "496",
				"value": item.ELOQUA_ID
			});

			fieldValuesItem.push({
				"id": "525",
				"value": item.LEAD_SEQ
			});

			fieldValuesItem.push({
				"id": "526",
				"value": utils.timeConverter("GET_UNIX" , item.LEAD_CREATE_DATE )
			});

			resultItem.fieldValues = fieldValuesItem;
			result_list.push(resultItem);
		}

	return result_list;	
}

function GetDataValue(contacts_fieldvalue) {
	try {
		if (contacts_fieldvalue != undefined) {
			return contacts_fieldvalue;
		}
		else {
			return "";
		}
	}
	catch (e) {
		console.log(e);
		return "";
	}
}


function checkVerticalType1Code(_Business_Sector_Name) {
	let result = "";
	let value = ['Retail','Hotel & Accomodation', 'Hospital & Health Care', 'Residential (Home)', 'Corporate / Office', 'Transportation', 'Education', 'Public Facility'
,'Government Department', 'Factory', 'Power plant / Renewable energy', 'Special Purpose']

	result = value.includes(_Business_Sector_Name) ? _Business_Sector_Name : ""
	return result;
}

function checkVerticalType2Code(_Business_Sector_Name, _Business_Sector_Vertival2_Name) {

	let result = "";
	switch (checkVerticalType1Code(_Business_Sector_Name)) {

		case "Retail":
			let Retail_Vertival2 = [
				'Restaurant,F&B(Food and Beverage)'
				,'QSR(Quick Service Restaurant)'
				,'Fashion'
				,'Pharmacy'
				,'Bookstore'
				,'Sports Entertainment'
				,'Real-Estate Agency'
				,'Luxury(Watch/Jewelry Shop)'
				,'Car dealership'
				,'Electronics & Telco'
				,'Cosmetics'
				,'Gas Station'
				,'Travel Agency'
				,'CVS (Convenience store)'
				,'Duty Free Shop'
				,'Hyper market & grocery'
				,'Shopping mall'
				,'Other Stores'
			]			
			result = Retail_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Hotel & Accomodation":
			let Hotel_Vertival2 = [
				'Hotel'
				,'Resort'
				,'Casino Resort'
				,'Cruise'
				,'Dormitory'
				,'Others'
			]			
			result = Hotel_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;
			
		case "Hospital & Health Care":
			let Hospital_Vertival2 = [
				'General Hospital'
				,'Hospital'
				,'Clinic'
				,'LTC(Long-Term Care)'
				,'Fitness'
				,'Others'
			]			
			result = Hospital_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Residential (Home)":
			let Residential_Vertival2 = [
				'Apartment'
				,'Officetel'
				,'Villa / Single-Family Home'
				,'Townhouse'
				,'Others'
			]			
			result = Residential_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Corporate / Office":
			let Corporate_Vertival2 = [
				'Advertising'
				,'Aerospace'
				,'Airline'
				,'Agriculture'
				,'Banking'
				,'Broadcasting & Media'
				,'Construction'
				,'Consulting'
				,'Developer/Property'
				,'Entertainment'
				,'Energy'
				,'Engineering'
				,'Finance'
				,'Healthcare'
				,'Holdings'
				,'Insurance'
				,'Investment'
				,'IT/Software'
				,'Logistics'
				,'Law Firm'
				,'Manufacturing'
				,'Mining'
				,'Network/Cabling'
				,'Pharmaceutical'
				,'Telecommunication'
				,'Distribution Center'
				,'Others'
			]			
			result = Corporate_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Transportation":
			let Transportation_Vertival2 = [
				'Airport / Airfield / Helipad'
				,'Bus Terminal'
				,'Railway & Metro Station'
				,'Sea Passenger Terminal / Port'
				,'Others'

			]			
			result = Transportation_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;
		case "Education":
			let Education_Vertival2 = [
				'K12 Kindergarten & Schools'
				,'Higher Education (College & University)'
				,'Institute & Academy'
				,'Others'
			]			
			result = Education_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Public Facility":
			let Public_Vertival2 = [
				'Museum / Gallery'
				,'Exhibition / Convention Center'
				,'Cinema /Theater'
				,'Sports'
				,'Religious Facility'
				,'Outdoor Advertisement'
				,'Others'
			]			
			result = Public_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Government Department":
			let Government_Vertival2 = [
				'General Government Office'
				,'Military'
				,'Police / Fire station'
				,'Welfare facilities'
				,'Others'
			]			
			result = Government_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Factory":
			let Factory_Vertival2 = [
				'Manufacturing factory / Plant'
				,'Chemical factory / Plant'
				,'Pharmaceutical factory'
				,'Others'
			]			
			result = Factory_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;
		case "Power plant / Renewable energy":
			let Powerplant_Vertival2 = [
				'Power plant'
				,'Renewable energy'
				,'Energy Storage & Saving'
				,'Others'
			]			
			result = Powerplant_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;

		case "Special Purpose":
			let Special_Vertival2 = [
				'Mixed-use (Multi Complex)'
				,'Botanical Garden / Green House'
				,'Telecom base station / Data, Call'
				,'Others'
			]			
			result = Special_Vertival2.includes(_Business_Sector_Vertival2_Name) ? _Business_Sector_Vertival2_Name : ""
			break;
			
	}
	return result;
}

// function GetConvertVerticalType1Code(_Business_Sector_Name) {
// 	// 코드	값
// 	// 01	4. Corporate (Office/Work Spaces)
// 	// 02	6. Education
// 	// 03	9. Factory
// 	// 04	8. Government Department
// 	// 05	2. Hospitality
// 	// 08	7. Public Facility
// 	// 09	1. Retail
// 	// 10	11. Special Purpose
// 	// 11	5. Transportation
// 	// 15	3. Residential (Home)
// 	// 16	10. Power plant/Renewable energy

// 	var result = "";
// 	switch (_Business_Sector_Name) {
// 		case "Corporate":
// 			result = "01";
// 			break;
// 		case "Education":
// 			result = "02";
// 			break;
// 		case "Factory":
// 			result = "03";
// 			break;
// 		case "Government Department":
// 			result = "04";
// 			break;
// 		case "Hospitality":
// 			result = "05";
// 			break;
// 		case "Public Facility": //Eloqua value값 추가 필요
// 			result = "08";
// 			break;
// 		case "Retail":
// 			result = "09";
// 			break;
// 		case "Special purpose": //Eloqua value값 추가 필요
// 			result = "10";
// 			break;
// 		case "Transportation":
// 			result = "11";
// 			break;
// 		case "Residential":  //Eloqua valuer값 추가 필요
// 			result = "15";
// 			break;
// 		//case "Power plant / Renewable energy":  //Eloqua valuer값 추가 필요
// 		case "Power plant":  //Eloqua valuer값 추가 필요
// 			result = "16";
// 			break;
// 	}
// 	return result;
// }



// function GetConvertVerticalType2Code(_Business_Sector_Name, _Business_Sector_Vertival2_Name) {
// 	// 코드	값
// 	// 0910	1-1. Restaurant / F&B / QSR
// 	// 0914	1-2. Specialty store
// 	// 0907	1-3. Hyper market & grocery
// 	// 0911	1-4. Shopping mall
// 	// 0913	1-5. Other Stores
// 	// 0503	2-1. Hotel / Resort / Casino
// 	// 0501	2-2. Cruise
// 	// 0502	2-3. Hospital
// 	// 0504	2-4. LTC (Long-Term Care)
// 	// 0508	2-5. Dormitory
// 	// 0509	2-6. Fitness
// 	// 0507	2-7. Others
// 	// 1501	3-1. Apartment
// 	// 1502	3-2. Officetel
// 	// 1503	3-3. Townhouse
// 	// 1504	3-4. Villa / Single-Family Home
// 	// 1505	3-5. Others
// 	// 0113	4-1. Office
// 	// 0114	4-2. Conference/Meeting Room/Collaboration spaces
// 	// 0115	4-3. Auditorium
// 	// 0116	4-4. Control/Command room
// 	// 0106	4-5. Broadcasting/Studio
// 	// 0117	4-6. Traning/Experience center
// 	// 0118	4-7. Show room/Briefing center
// 	// 0119	4-8. Common spaces 
// 	// 0120	4-9. Client interaction venue/space﻿
// 	// 0121	4-10. Others
// 	// 1101	5-1. Air Transport
// 	// 1104	5-2. Road
// 	// 1103	5-3. Railway & Metro
// 	// 1102	5-4. Sea
// 	// 1105	5-5. Others
// 	// 0201	6-1. K12 (Kindergarten & Schools)
// 	// 0202	6-2. HigherEd (College & University)
// 	// 0205	6-3. Institute & Academy
// 	// 0204	6-4. Others
// 	// 0816	7-1. Culture
// 	// 0813	7-2. Sports
// 	// 0817	7-3. Religious facility
// 	// 0818	7-4. Outdoor Advertisement
// 	// 0815	7-5. Others
// 	// 0403	8-1. General Government Office
// 	// 0404	8-2. Military
// 	// 0406	8-3. Police/Fire station
// 	// 0402	8-4. Welfare facilities 
// 	// 0410	8-5. Others
// 	// 0309	9-1. Manufacturing factory
// 	// 0310	9-2. Chemical factory
// 	// 0311	9-3. Pharmaceutical factory
// 	// 0301	9-4. Others
// 	// 1601	10-1. Power plant
// 	// 1602	10-2. Renewable energy
// 	// 1603	10-3. Energy Storage & Saving
// 	// 1604	10-4. Others
// 	// 1011	11-1. Mixed-use (Multi Complex)
// 	// 1009	11-2. Botanical Garden / Green House
// 	// 1005	11-3.Telecom base station / Data, Call center
// 	// 1010	11-4. Others

// 	var result = "";
// 	switch (GetConvertVerticalType1Code(_Business_Sector_Name)) {
// 		case "09":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Restaurant / F&B / QSR":
// 					result = "0910"; break;

// 				case "Specialty store":
// 					result = "0914"; break;

// 				case "Hyper market & grocery":
// 					result = "0907"; break;

// 				case "Shopping mall":
// 					result = "0911"; break;

// 				case "Other Stores":
// 					result = "0913"; break;
// 			}
// 			break;

// 		case "05":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Hotel / Resort / Casino":
// 					result = "0503"; break;

// 				case "Cruise":
// 					result = "0501"; break;

// 				case "Hospital":
// 					result = "0502"; break;

// 				case "LTC (Long-Term Care)":
// 					result = "0504"; break;

// 				case "Dormitory":
// 					result = "0508"; break;

// 				case "Fitness":
// 					result = "0509"; break;

// 				case "Others":
// 					result = "0507"; break;
// 			}
// 			break;

// 		case "15":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Apartment":
// 					result = "1501"; break;

// 				case "Officetel":
// 					result = "1502"; break;

// 				case "Townhouse":
// 					result = "1503"; break;

// 				case "Villa / Single-Family Home":
// 					result = "1504"; break;

// 				case "Others":
// 					result = "1505"; break;
// 			}
// 			break;

// 		case "01":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Office":
// 					result = "0113"; break;

// 				case "Conference/Meeting Room/Collaboration spaces":
// 					result = "0114"; break;

// 				case "Auditorium":
// 					result = "0115"; break;

// 				case "Control/Command room":
// 					result = "0116"; break;

// 				case "Broadcasting/Studio":
// 					result = "0106"; break;

// 				case "Training/Experience center":
// 					result = "0117"; break;

// 				case "Show room/Briefing center":
// 					result = "0118"; break;

// 				case "Common spaces ":
// 					result = "0119"; break;

// 				case "Client interaction venue/space":
// 					result = "0120"; break;

// 				case "Others":
// 					result = "0121"; break;
// 			}
// 			break;

// 		case "11":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Air Transport":
// 					result = "1101"; break;

// 				case "Road":
// 					result = "1104"; break;

// 				case "Railway & Metro":
// 					result = "1103"; break;

// 				case "Sea":
// 					result = "1102"; break;

// 				case "Others":
// 					result = "1105"; break;
// 			}
// 			break;

// 		case "02":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "K12 (Kindergarten & Schools)":
// 					result = "0201"; break;

// 				case "HigherEd (College & University)":
// 					result = "0202"; break;

// 				case "Institute & Academy":
// 					result = "0205"; break;

// 				case "Others":
// 					result = "0204"; break;
// 			}
// 			break;

// 		case "08":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Culture":
// 					result = "0816"; break;

// 				case "Sports":
// 					result = "0813"; break;

// 				case "Religious facility":
// 					result = "0817"; break;

// 				case "Outdoor Advertisement":
// 					result = "0818"; break;

// 				case "Others":
// 					result = "0815"; break;
// 			}
// 			break;

// 		case "04":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "General Government Office":
// 					result = "0403"; break;

// 				case "Military":
// 					result = "0404"; break;

// 				case "Police/Fire station":
// 					result = "0406"; break;

// 				case "Welfare facilities ":
// 					result = "0402"; break;

// 				case "Others":
// 					result = "0410"; break;
// 			}
// 			break;

// 		case "03":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Manufacturing factory":
// 					result = "0309"; break;

// 				case "Chemical factory":
// 					result = "0310"; break;

// 				case "Pharmaceutical factory":
// 					result = "0311"; break;

// 				case "Others":
// 					result = "0301"; break;
// 			}
// 			break;

// 		case "16":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Power plant":
// 					result = "1601"; break;

// 				case "Renewable energy":
// 					result = "1602"; break;

// 				case "Energy Storage & Saving":
// 					result = "1603"; break;

// 				case "Others":
// 					result = "1604"; break;
// 			}
// 			break;

// 		case "10":
// 			switch (_Business_Sector_Vertival2_Name) {
// 				case "Mixed-use (Multi Complex)":
// 					result = "1011"; break;

// 				case "Botanical Garden / Green House":
// 					result = "1009"; break;

// 				case "Telecom base station / Data, Call center":
// 					result = "1005"; break;

// 				case "Others":
// 					result = "1010"; break;
// 			}
// 			break;
// 	}
// 	return result;
// }

module.exports = router;
module.exports.pipe_global_bant_send = pipe_global_bant_send;
module.exports.pipe_global_lead_update = pipe_global_lead_update;
