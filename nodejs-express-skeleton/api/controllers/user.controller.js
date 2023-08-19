var AccountService = require('../../services/account.service');

class UserController {
    constructor() {
        this.accountService = new AccountService();
    }

    async searchUsers(req, res) {
        try{
            let userInfo = await this.accountService.searchUsersInSC(req.body.keyword, req.body.page);
            if(Object.keys(userInfo).length === 0){
                userInfo = await this.accountService.searchUsersInDB(req.body.keyword, req.body.page)
            }
            res.status(200).send({ success: true, result: userInfo });
        } catch(e){
            console.error(e);
            res.status(400).send({ success: false, reason: "Bad Request" });
        }
    }

    async addUser(req, res) {
        try{
            let userInfo = await this.accountService.addUser(req.body);
            res.status(200).send(userInfo.code > -1? { success: true, result: userInfo } : { success: false, reason: "Bad Request" });
        } catch(e){
            console.error(e);
            res.status(400).send({ success: false, reason: "Bad Request" });
        }
    }

    async editUser(req, res) {
        try{
            let userInfo = await this.accountService.editUser(req.params.users_id, req.body);
            res.status(200).send(userInfo.code > -1? { success: true, result: userInfo } : { success: false, reason: "Bad Request" });
        } catch(e){
            console.error(e);
            res.status(400).send({ success: false, reason: "Bad Request" });
        }
    }

    async deleteUser(req, res) {
        try{
            let userInfo = await this.accountService.deleteUser(req.params.users_id);
            res.status(200).send(userInfo.code > -1? { success: true, result: userInfo } : { success: false, reason: "Bad Request" });
        } catch(e){
            console.error(e);
            res.status(400).send({ success: false, reason: "Bad Request" });
        }
    }
}

const userController = new UserController();

module.exports = userController;
