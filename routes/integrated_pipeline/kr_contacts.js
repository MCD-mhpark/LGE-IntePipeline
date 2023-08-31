var express = require('express');
var router = express.Router();
var request_promise = require('request-promise');
var utils = require('../common/utils');
var moment = require('moment');
var kr_seq_cnt = 0;
var fs = require("mz/fs");

router.get('/inte_pipeline_kr', async function (req, res, next) {
	await pipe_kr_bant_send(req, res);
});

router.post('/namefieldtest', async function (req, res, next) {
	var COD_list = await GetKR_CustomDataSearch(39, "init");
	var B2B_GERP_KR_DATA = await Convert_B2BGERP_KR_DATA(COD_list);
	res.json(B2B_GERP_KR_DATA);
})


//=====================================================================================================================
// SFDC 전송 
//=====================================================================================================================

pipe_kr_bant_send = async function (req, res) {
	console.log("Pipeline pipe_kr_bant_send");
	var parentId = 39;  // 한국영업본부 온라인 견적문의 커스텀 오브젝트 ID

	//var parentId = 149;  // 한국영업본부 온라인 견적문의 테스트 커스텀 오브젝트 ID

	var COD_list = await GetKR_CustomDataSearch(parentId, "get");

	// console.log(COD_list);
	//Pipe Line 테스트를 위해 주석 처리
	var B2B_GERP_KR_DATA = await Convert_B2BGERP_KR_DATA(COD_list);
	//var B2B_GERP_KR_DATA = await TEST_Convert_B2BGERP_KR_DATA(COD_list);
	let status = "prd"
	let access_token_data = await utils.getPipe_AccessToken(status);

	let send_url;

	switch (status) {
		//LG전자 파이프라인 개발 URL
		case "dev": send_url = "https://lge--dev.my.salesforce.com/services/apexrest/mat/eloqua/lead/kr";
			break;

		//LG전자 파이프라인 스테이징 URL
		case "stg": send_url = "https://lge--sb.my.salesforce.com/services/apexrest/mat/eloqua/lead/kr";
			break;

		//LG전자 파이프라인 실전검증 URL 
		case "fullstg": send_url = "https://lge--fs.my.salesforce.com/services/apexrest/mat/eloqua/lead/kr";
			break;

		//LG전자 파이프라인 운영 URL
		case "prd": send_url = "https://lge.my.salesforce.com/services/apexrest/mat/eloqua/lead/kr";
			break;
	}

	// console.log(access_token_data)

	if (B2B_GERP_KR_DATA != null && B2B_GERP_KR_DATA.length > 0) {

		let token_data = {};

		try {
			token_data = JSON.parse(access_token_data);
		} catch (error) {
			if (error) error.stack();
		}
		let token_type = token_data.token_type ? token_data.token_type : undefined;
		let token = token_data.access_token ? token_data.access_token : undefined;

		// console.log("send_url : " + send_url);
		// console.log("token_type : " + token_type)
		// console.log("token : " + token)
		if (!token_type || !token) return;
		var headers = {
			'Content-Type': "application/json",
			'Authorization': token_type + " " + token
		}



		options = {
			url: send_url,
			method: "POST",
			headers: headers,
			// body: { ContentList: update_data },
			// pipe test 를 위해 주석 처리
			body: { ContentList: B2B_GERP_KR_DATA },
			json: true
		};

		console.log(B2B_GERP_KR_DATA);

		req_res_logs("reqRequest_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", options);
		req_res_logs("reqEloqua_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", COD_list);
		req_res_logs("reqConvert_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", B2B_GERP_KR_DATA);
		// req_res_logs("reqTotal" , business_name , total_logs );


		//   var bant_result_list = await setBant_Update( business_name , bant_update_list );
		//   req_res_logs("bantResult" , business_name , bant_result_list );
		//   res.json(bant_result_list);


		await request_promise.post(options, async function (error, response, body) {

			if (error) {
				console.log("에러에러(wise 점검 및 인터넷 연결 안됨)");
				// console.log(error);
				let errorData = {
					errorCode: response.statusCode,
					errorMsg: error.message
				}
				req_res_logs("responseError_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", errorData);
			} else if (!error && response.statusCode != 200) {

				let errorData = {
					errorCode: response.statusCode,
					errorMsg: "Error Object Not Found & Response Code Not 200",
					errorDetailMsg: response.body
				}
				req_res_logs("responseError_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", errorData);
				req_res_logs("requestObject_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", response);

			} else if (!error && response.statusCode == 200) {
				req_res_logs("response_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", body);

				// if(B2B_GERP_KR_DATA.length > 0 ) {

				// 	console.log("첫번쨰 로그로그 >>", B2B_GERP_KR_DATA);
				//     //Pipe Line 테스트를 위해 주석 처리
				let trans_up_list = await getTransfer_UpdateData(COD_list.elements, "get");
				// 	console.log("두번째로그로그 >>" ,trans_up_list[0].fieldValues);
				await sendTransfer_Update(parentId, trans_up_list);

				// }   
			}
		});
	}
	else {
		let noneData = {
			errorInfo: null,
			errorMessage: "보낼 데이터가 없습니다."
		}
		req_res_logs("noneData_" + moment().tz('Asia/Seoul').format("HH시mm분"), "KR", "PIPELINE_KR", noneData);

	}


}


//CustomObject 기간 조회 Eloqua API Version 1.0
async function GetKR_CustomDataSearch(_parentId, type) {
	var return_data = {};
	var parentId = _parentId;

	var queryString = {};

	// if(type == 'get') queryString += "?search=B2B_GERP_KR_____1=''"
	// if(type == 'init')  queryString += "?search=B2B_GERP_KR_____1='Y'"

	// if(type == 'get') queryString += "?search=B2B_GERP_KR_____1=''"
	// if(type == 'init')  queryString += "?search=B2B_GERP_KR_____1='Y'"

	// // Get 요청하기 
	// const options = {
	// 	uri: "https://secure.p03.eloqua.com/api/REST/1.0/data/customObject/" + parentId + queryString
	// 	, headers: {
	// 		'Authorization': 'Basic ' + 'TEdFbGVjdHJvbmljc1xMZ19hcGkuQjJiX2tyOlFXZXIxMjM0IUA='
	// 	}
	// };

	// await request_promise.get(options, function (error, response, body) {
	// 	return_data = JSON.parse(body);
	// });



	if (type == 'get') queryString['search'] = "?B2B_GERP_KR_____1=''"
	if (type == 'init') queryString['search'] = "?B2B_GERP_KR_____1='Y'"

	console.log(_parentId);
	console.log(queryString);
	await lge_eloqua.data.customObjects.data.get(_parentId, queryString).then((result) => {
		if (result.data && result.data.total > 0) {
			return_data = result.data;
		}
	}).catch((err) => {
		console.log(err);
	})

	return return_data;
}


//=====================================================================================================================
// 한국영업본부 B2B GERP KR 전송
//=====================================================================================================================

function B2B_GERP_KR_ENTITY() {
	this.customObjectId = "";
	this.contactId = "";
	this.interfaceId = "";
	this.estimationId = ""; //견적번호 X
	this.estimationSeqNo = ""; //견적상세번호 X
	this.customerName = ""; //고객명 X
	this.bizRegisterNo = ""; //사업자등록번호 X
	this.corpRegisterNo = ""; //법인등록번호 X
	this.postalCode = ""; //우편번호
	this.baseAddr = ""; //기본주소
	this.detailAddr = ""; //상세주소
	this.phoneNo = ""; //전화번호
	this.emailAddr = ""; //전자우편주소

	this.contactName = ""; //담당자명
	this.lastName = "";  //담당자명 이름
	this.firstName = ""; //담당자명 성
	this.contactPhoneNo = ""; //담당자 전화번호
	this.contactCellularNo = ""; //담당자 이동전화번호
	this.contactEmailAddr = ""; //담당자 전자우편주소
	this.modelCode = ""; //모델코드
	this.custRemark = ""; //고객요청사항
	this.registerDate = ""; //등록일자
	this.productDesc = ""; //제품설명


	this.addr = ""; //제품설치지역 도시 
	this.dtlAddr = ""; //제품설치지역 시군구
	this.b2bBillToCode = ""; //B2B 전문점 코드
	this.categoryName = ""; //카테고리명
	this.dtlCategoryName = ""; //상세 카테고리 명
	this.typeName = ""; //타입명
	this.unifyId = ""; //통합회원 유니크 아이디
	this.sector = ""; //업종
	this.dtlSector = ""; //상세업종

	this.LGE_MarketingEvent__c = ""//마케팅 이벤트

	this.privacyPolicyYn = "";
	this.privacyPolicyDate = "";
	this.thirdPartyAgreementYn = "";
	this.thirdPartyAgreementDate = "";
	this.transferThirdCountriesYn = "";
	this.transferThirdCountriesDate = "";
	this.marketingAgreementYn = "";
	this.marketingAgreementDate = "";
	this.leadSource = "";

	/*{2023-08-22} 신규 파라미터 생성*/
	this.budget				//예산
	this.jobFunction		//주요업무
	this.marketingEvent 	//마케팅이벤트
	this.seniority 			//직책/직위
	this.timeline  			//구매시기
	this.purchaseQuantity	//구매수량

	// this.ATTRIBUTE_10 = "";
	// this.ATTRIBUTE_11 = "";
	// this.ATTRIBUTE_12 = "";

	//this.platformActivity = ""; //Platform & Activity
	this.leadName = "";

}


var kr_seq_cnt = 0;
//Eloqua Data B2B GERP Global Mapping 데이터 생성
function TEST_Convert_B2BGERP_KR_DATA(_cod_data) {
	var cod_elements = _cod_data.elements;
	var result_data = [];

	if (!cod_elements) return;
	for (var i = 0; i < cod_elements.length; i++) {
		try {
			var result_item = {};



			moment.locale('kr');

			result_item.customObjectId = cod_elements[i].id;
			result_item.contactId = cod_elements[i].contactId;
			result_item.interfaceId = moment().format('YYYYMMDD') + "8";
			result_item.estimationId = GetCustomObjectValue(1349, cod_elements[i], "N"); //견적번호 X
			result_item.estimationSeqNo = GetCustomObjectValue(1350, cod_elements[i], "N"); //견적상세번호 X
			result_item.customerName = GetCustomObjectValue(1351, cod_elements[i], "N"); //고객명 X
			result_item.bizRegisterNo = GetCustomObjectValue(1352, cod_elements[i], "N"); //사업자등록번호 X
			result_item.corpRegisterNo = GetCustomObjectValue(1353, cod_elements[i], "N"); //법인등록번호 X
			result_item.postalCode = GetCustomObjectValue(1354, cod_elements[i], "N"); //우편번호
			result_item.baseAddr = GetCustomObjectValue(1355, cod_elements[i], "N"); //기본주소
			result_item.detailAddr = GetCustomObjectValue(1356, cod_elements[i], "N"); //상세주소
			result_item.phoneNo = GetCustomObjectValue(1357, cod_elements[i], "N"); //전화번호
			result_item.emailAddr = GetCustomObjectValue(1358, cod_elements[i], "N"); //전자우편주소
			// result_item.CONTACT_NAME = GetCustomObjectValue(277, cod_elements[i], "N"); //담당자명

			result_item.firstName = GetCustomObjectValue(1388, cod_elements[i], "N"); //담당자명 이름
			result_item.lastName = GetCustomObjectValue(1389, cod_elements[i], "N") == "" ? "None" : GetCustomObjectValue(1389, cod_elements[i], "N"); //담당자명 성
			result_item.contactName = (result_item.lastName + " " + result_item.firstName).trim(); //담당자명
			result_item.contactPhoneNo = GetCustomObjectValue(1360, cod_elements[i], "N"); //담당자 전화번호
			result_item.contactCellularNo = GetCustomObjectValue(1361, cod_elements[i], "N"); //담당자 이동전화번호
			result_item.contactEmailAddr = GetCustomObjectValue(1362, cod_elements[i], "N"); //담당자 전자우편주소
			result_item.modelCode = GetCustomObjectValue(1363, cod_elements[i], "N"); //모델코드
			result_item.custRemark = GetCustomObjectValue(1364, cod_elements[i], "N"); //고객요청사항
			result_item.registerDate = moment().format('YYYY-MM-DD hh:mm:ss'); //등록일자
			result_item.productDesc = GetCustomObjectValue(1365, cod_elements[i], "N"); //제품설명


			result_item.addr = GetCustomObjectValue(1378, cod_elements[i], "N"); //제품설치지역 도시 
			result_item.dtlAddr = GetCustomObjectValue(1379, cod_elements[i], "N"); //제품설치지역 시군구
			result_item.b2bBillToCode = GetCustomObjectValue(1367, cod_elements[i], "N"); //B2B 전문점 코드
			result_item.categoryName = GetCustomObjectValue(1368, cod_elements[i], "N"); //카테고리명
			result_item.dtlCategoryName = GetCustomObjectValue(1369, cod_elements[i], "N"); //상세 카테고리 명
			result_item.typeName = GetCustomObjectValue(1370, cod_elements[i], "N"); //타입명
			result_item.unifyId = GetCustomObjectValue(1375, cod_elements[i], "N"); //통합회원 유니크 아이디
			result_item.sector = GetCustomObjectValue(1376, cod_elements[i], "N"); //업종
			result_item.dtlSector = GetCustomObjectValue(1377, cod_elements[i], "N"); //상세업종

			result_item.privacyPolicyYn = GetCustomObjectValue(1371, cod_elements[i], "N") == "Yes" ? "Y" : "N"; //개인정보 수집 및 이용동의 여부
			let Privacy_Policy_Date = utils.timeConverter("GET_DATE", GetCustomObjectValue(1380, cod_elements[i], "N"));
			result_item.privacyPolicyDate = Privacy_Policy_Date == null ? "" : Privacy_Policy_Date; //개인정보 수집 및 이용동의 일자

			result_item.thirdPartyAgreementYn = GetCustomObjectValue(1372, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //개인정보 위탁 처리 동의 여부
			let Third_Party_AgreementDate = utils.timeConverter("GET_DATE", GetCustomObjectValue(1381, cod_elements[i], "N"));
			result_item.thirdPartyAgreementDate = Third_Party_AgreementDate == null ? "" : Third_Party_AgreementDate; //개인정보 위탁 처리 동의 날짜

			result_item.transferThirdCountriesYn = GetCustomObjectValue(1373, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //개인정보 국외 이전 동의 여부
			let Transfer_Third_CountriesDate = utils.timeConverter("GET_DATE", GetCustomObjectValue(1382, cod_elements[i], "N"));
			result_item.transferThirdCountriesDate = Transfer_Third_CountriesDate == null ? "" : Transfer_Third_CountriesDate; //개인정보 국외 이전 동의 일자

			result_item.marketingAgreementYn = GetCustomObjectValue(1374, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //LG전자 마케팅 정보 수신 동의 여부
			let Marketing_AgreementYn = utils.timeConverter("GET_DATE", GetCustomObjectValue(1383, cod_elements[i], "N"));
			result_item.marketingAgreementDate = Marketing_AgreementYn == null ? "" : Marketing_AgreementYn; //LG전자 마케팅 정보 수신 동의 일자

			result_item.leadSource = GetCustomObjectValue(1909, cod_elements[i], "N"); //리드원천

			// result_item.ATTRIBUTE_10 = "";
			// result_item.ATTRIBUTE_11 = "";
			// result_item.ATTRIBUTE_12 = "";

			//result_item.platformActivity = GetCustomObjectValue(1385, cod_elements[i], "N"); //Platform & Activity // SFDC만 리드원천으로 변경
			result_item.leadName = GetCustomObjectValue(1384, cod_elements[i], "N") + "_" + moment().format('YYYYMMDD') + "_" + GetCustomObjectValue(1351, cod_elements[i], "N");
			//Leadname 조합 MarketingEvent_YYYYMMDD_고객명w



			result_data.push(result_item);

			kr_seq_cnt++;

		} catch (e) {
			console.log(e);
		}
	}
	return result_data;
}


async function Convert_B2BGERP_KR_DATA(_cod_data) {
	var cod_elements = _cod_data.elements;
	var result_data = [];

	if (!cod_elements) return;
	for (var i = 0; i < cod_elements.length; i++) {
		try {
			var result_item = new B2B_GERP_KR_ENTITY();



			moment.locale('kr');

			result_item.customObjectId = cod_elements[i].id;
			result_item.contactId = cod_elements[i].contactId;
			result_item.interfaceId = moment().format('YYYYMMDD') + "8";
			result_item.estimationId = GetCustomObjectValue(267, cod_elements[i], "N"); //견적번호 X
			result_item.estimationSeqNo = GetCustomObjectValue(268, cod_elements[i], "N"); //견적상세번호 X
			result_item.customerName = GetCustomObjectValue(269, cod_elements[i], "N"); //고객명 X
			result_item.bizRegisterNo = GetCustomObjectValue(270, cod_elements[i], "N"); //사업자등록번호 X
			result_item.corpRegisterNo = GetCustomObjectValue(271, cod_elements[i], "N"); //법인등록번호 X
			result_item.postalCode = GetCustomObjectValue(272, cod_elements[i], "N"); //우편번호
			result_item.baseAddr = GetCustomObjectValue(273, cod_elements[i], "N"); //기본주소
			result_item.detailAddr = GetCustomObjectValue(274, cod_elements[i], "N"); //상세주소
			result_item.phoneNo = GetCustomObjectValue(275, cod_elements[i], "N"); //전화번호
			result_item.emailAddr = GetCustomObjectValue(276, cod_elements[i], "N"); //전자우편주소
			// result_item.CONTACT_NAME = GetCustomObjectValue(277, cod_elements[i], "N"); //담당자명

			result_item.firstName = GetCustomObjectValue(395, cod_elements[i], "N"); //담당자명 이름
			result_item.lastName = GetCustomObjectValue(396, cod_elements[i], "N") == "" ? "None" : GetCustomObjectValue(396, cod_elements[i], "N"); //담당자명 성
			result_item.contactName = (result_item.lastName + " " + result_item.firstName).trim(); //담당자명
			result_item.contactPhoneNo = GetCustomObjectValue(278, cod_elements[i], "N"); //담당자 전화번호
			result_item.contactCellularNo = GetCustomObjectValue(279, cod_elements[i], "N"); //담당자 이동전화번호
			result_item.contactEmailAddr = GetCustomObjectValue(280, cod_elements[i], "N"); //담당자 전자우편주소
			result_item.modelCode = GetCustomObjectValue(281, cod_elements[i], "N"); //모델코드
			result_item.custRemark = GetCustomObjectValue(282, cod_elements[i], "N"); //고객요청사항
			result_item.registerDate = moment().format('YYYY-MM-DD hh:mm:ss'); //등록일자
			result_item.productDesc = GetCustomObjectValue(283, cod_elements[i], "N"); //제품설명


			result_item.addr = GetCustomObjectValue(296, cod_elements[i], "N"); //제품설치지역 도시 
			result_item.dtlAddr = GetCustomObjectValue(297, cod_elements[i], "N"); //제품설치지역 시군구
			result_item.b2bBillToCode = GetCustomObjectValue(285, cod_elements[i], "N"); //B2B 전문점 코드
			result_item.categoryName = GetCustomObjectValue(286, cod_elements[i], "N"); //카테고리명
			result_item.dtlCategoryName = GetCustomObjectValue(287, cod_elements[i], "N"); //상세 카테고리 명
			result_item.typeName = GetCustomObjectValue(288, cod_elements[i], "N"); //타입명
			result_item.unifyId = GetCustomObjectValue(293, cod_elements[i], "N"); //통합회원 유니크 아이디
			result_item.sector = GetCustomObjectValue(294, cod_elements[i], "N"); //업종
			result_item.dtlSector = GetCustomObjectValue(295, cod_elements[i], "N"); //상세업종

			/*{2023-08-28} 317번 키값 변경 {'LGE_MarketingEvent__c' => 'marketingEvent'}*/
			//result_item.LGE_MarketingEvent__c = GetCustomObjectValue(317, cod_elements[i], "N"); //마케팅 이벤트
			result_item.marketingEvent = GetCustomObjectValue(317, cod_elements[i], "N"); //마케팅 이벤트

			result_item.privacyPolicyYn = GetCustomObjectValue(289, cod_elements[i], "N") == "Yes" ? "Y" : "N"; //개인정보 수집 및 이용동의 여부
			let Privacy_Policy_Date = utils.timeConverter("GET_DATE", GetCustomObjectValue(298, cod_elements[i], "N"));
			result_item.privacyPolicyDate = Privacy_Policy_Date == null ? "" : Privacy_Policy_Date; //개인정보 수집 및 이용동의 일자

			result_item.thirdPartyAgreementYn = GetCustomObjectValue(290, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //개인정보 위탁 처리 동의 여부
			let Third_Party_AgreementDate = utils.timeConverter("GET_DATE", GetCustomObjectValue(299, cod_elements[i], "N"));
			result_item.thirdPartyAgreementDate = Third_Party_AgreementDate == null ? "" : Third_Party_AgreementDate; //개인정보 위탁 처리 동의 날짜

			result_item.transferThirdCountriesYn = GetCustomObjectValue(291, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //개인정보 국외 이전 동의 여부
			let Transfer_Third_CountriesDate = utils.timeConverter("GET_DATE", GetCustomObjectValue(300, cod_elements[i], "N"));
			result_item.transferThirdCountriesDate = Transfer_Third_CountriesDate == null ? "" : Transfer_Third_CountriesDate; //개인정보 국외 이전 동의 일자

			result_item.marketingAgreementYn = GetCustomObjectValue(292, cod_elements[i], "N") == "Yes" ? "Y" : "N";; //LG전자 마케팅 정보 수신 동의 여부
			let Marketing_AgreementYn = utils.timeConverter("GET_DATE", GetCustomObjectValue(301, cod_elements[i], "N"));
			result_item.marketingAgreementDate = Marketing_AgreementYn == null ? "" : Marketing_AgreementYn; //LG전자 마케팅 정보 수신 동의 일자

			result_item.leadSource = GetCustomObjectValue(1904, cod_elements[i], "N"); //리드원천

			// result_item.ATTRIBUTE_10 = "";
			// result_item.ATTRIBUTE_11 = "";
			// result_item.ATTRIBUTE_12 = "";

			//result_item.platformActivity = GetCustomObjectValue(318, cod_elements[i], "N"); //Platform & Activity
			result_item.leadName = "민수SYS_[B2B사이트]" + "_" + moment().format('YYYYMMDD') + "_" + GetCustomObjectValue(269, cod_elements[i], "N");
			//Leadname 조합 MarketingEvent_YYYYMMDD_고객명


			/*{2023-08-22} 신규 파라미터 생성*/
			result_item.budget = GetCustomObjectValue(2549, cod_elements[i], "N");				//예산
			result_item.jobFunction = GetCustomObjectValue(2545, cod_elements[i], "N");			//주요업무
			result_item.seniority = GetCustomObjectValue(2546, cod_elements[i], "N");			//직책/직위
			result_item.timeline = GetCustomObjectValue(2547, cod_elements[i], "N");			//구매시기
			result_item.purchaseQuantity = GetCustomObjectValue(2548, cod_elements[i], "N");	//구매수량

			result_data.push(result_item);

			kr_seq_cnt++;

		} catch (e) {
			console.log(e);
		}
	}
	return result_data;
}


async function getTransfer_UpdateData(TRANS_KR_LIST, type) {

	let return_list = [];
	let trans_check = "";
	if (type == 'get') trans_check = 'Y'
	else if (type == 'init') trans_check = ''


	for (const kr_data of TRANS_KR_LIST) {

		for (let i = 0; i < kr_data.fieldValues.length; i++) {

			if (kr_data.fieldValues[i].id == "483") { kr_data.fieldValues[i].value = trans_check }

			// 테스트시에 개인정보 활용 관련된 컬럼 4개 (ex 개인정보 국외이전 동의) 가 온라인 견적문의 데이터가 들어왔을 때 자동으로 마킹 되는지 체크 한번 부탁 드립니다.
			// if(kr_data.fieldValues[i].id == "301" || kr_data.fieldValues[i].id == "300" || kr_data.fieldValues[i].id == "299" || kr_data.fieldValues[i].id == "298"){ 
			//  	kr_data.fieldValues[i].value = utils.timeConverter("GET_UNIX" , kr_data.fieldValues[i].value ) 
			// }

		}

		return_list.push(kr_data);
	}

	return return_list;
}


async function sendTransfer_Update(parentId, KR_DATA_LIST) {

	for (let item of KR_DATA_LIST) {
		await lge_eloqua.data.customObjects.data.update(parentId, item.id, item).then((result) => {
			console.log("result>>>>", result.data);
			return_data = result;
		}).catch((err) => {
			// console.error(err);
			console.error(err.message);
			return_data = err;
		});
	}
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


function req_res_logs(filename, business_name, folderName, data) {
	// filename : request , response 
	// business_name : 사업부별 name
	// data : log 저장할 데이터

	var today = moment().tz('Asia/Seoul').format("YYYYMMDD") + "_" + folderName;
	var dirPath = utils.logs_makeDirectory(today);
	console.log("fileWrite Path : " + dirPath);

	fs.writeFile(dirPath + filename + "_" + business_name + ".txt", JSON.stringify(data), 'utf8', function (error) {
		if (error) {
			console.log(error);
		} else {
			console.log('write end');
		}
	});
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


module.exports = router;
module.exports.pipe_kr_bant_send = pipe_kr_bant_send;
