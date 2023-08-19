"use strict"

const { Op, Sequelize } = require("sequelize");

const db = require('./db.service');
const { getEmployeesFromSC } = require("../util/smart-connect-handler");

class Account {

    constructor() {
        //This is intentional
    }

    async searchUsersInSC(keyword, page){
        let smartConnectData =  await getEmployeesFromSC(keyword, page);
        return smartConnectData;
    }

    async searchUsersInDB(keyword, page, page_size = 10){
        let employeeDetails =  await db.users.findAll({
            attributes: ['employee_id', 'employee_name', 'employee_email', 'department'], 
            limit: page_size,
            offset: (parseInt(page) - 1)*page_size, 
            where: {
                [Op.or]: [{
                    employee_id: keyword
                },{
                    employee_name: keyword
                },{
                    employee_email: keyword
                },{
                    department: keyword
                }]
            },
        });
        let employeeDetailsCount =  await db.users.count({
            where: {
                [Op.or]: [{
                    employee_id: keyword
                },{
                    employee_name: keyword
                },{
                    employee_email: keyword
                },{
                    department: keyword
                }]
            }
        });
        return {
            totalCount: employeeDetailsCount,
            userProfiles: employeeDetails,
            resultsPerPage: employeeDetailsCount/10
        };
    }

    async addUser(body){
        let addUserResponse = await db.users.create(body);
        if(addUserResponse != null){
            return {
                "code": 0,
                "type": "user",
                "message": "success"
            }
        } else {
            return {
                "code": -1,
                "type": "user",
                "message": "fail"
            }
        }
    }

    async editUser(users_id, body){
        let updateResponse = await db.users.update(body, {
            where: {
                users_id: users_id
            }
        });
        if(updateResponse != null){
            return {
                "code": 0,
                "type": "user",
                "message": "success"
            }
        } else {
            return {
                "code": -1,
                "type": "user",
                "message": "fail"
            }
        }
    }

    async deleteUser(users_id){
        let deleteUserResponse = await db.users.destroy({
            where: {
                users_id: users_id
            }
        });
        if(deleteUserResponse != null){
            return {
                "code": 0,
                "type": "user",
                "message": "success"
            }
        } else {
            return {
                "code": -1,
                "type": "user",
                "message": "fail"
            }
        }
    }
}

module.exports = Account;