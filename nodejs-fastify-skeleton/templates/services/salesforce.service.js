var salesforceService = {
    getHospitalDetails: async function (sfType, sfId) {
        return await (await fetch('/sf-hospital/' + sfType + '/' + sfId)).json();
    }
}

export { salesforceService }