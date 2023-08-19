const fetch = require('node-fetch');

let smartConnectUrl = JSON.parse(process.env.SMART_CONNECT).baseURL;
let smartConnectKey = JSON.parse(process.env.SMART_CONNECT).apiKey;

async function getOneEmployeeFromSC(id){
    let searchResult = (await(await fetch(smartConnectUrl + "/api/employees/userSearch",{
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + smartConnectKey,
                   'Content-Type': 'application/json',
                   "loggedInUserPersonId": "0",
                   "searchedText":  id,
                   "pageNumber": "1"
                },
    })).json());
    let resultIndex = searchResult.userProfiles.findIndex(r => r.workEmail.toLowerCase() == id.toLowerCase() && r.personId != null);
    searchResult = searchResult.userProfiles[resultIndex];
    if(resultIndex == -1){
        return null;
    }
    return {
        employee_id: searchResult.personGid + "",
        person_id: searchResult.personId + "",
        employee_email: searchResult.workEmail,
        employee_mobile: searchResult.mobile,
        employee_name: searchResult.personDisplayName,
        department: searchResult.departmentName != null? searchResult.departmentName : searchResult.jobName
    };
}

async function getEmployeesFromSC(keywordSC, page="1"){
    let searchResult = (await(await fetch(smartConnectUrl + "/api/employees/userSearch",{
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + smartConnectKey,
                   'Content-Type': 'application/json',
                   "loggedInUserPersonId": "0",
                   "searchedText":  keywordSC,
                   "pageNumber": page,
                },
    })).json());
    return searchResult;
}

module.exports = { getOneEmployeeFromSC, getEmployeesFromSC }