const express = require('express');
const userController = require('../api/controllers/user.controller');
const wrap = require('../util/route-wrapper');

const apiUser = express.Router();

apiUser.post('/search-users', wrap(async (req, res) => userController.searchUsers(req, res)));
apiUser.post('/add-user', wrap(async (req, res) => userController.addUser(req, res)));
apiUser.post('/modify-user/:users_id', wrap(async (req, res) => userController.editUser(req, res)));
apiUser.post('/delete-user/:users_id', wrap(async (req, res) => userController.deleteUser(req, res)));

module.exports = apiUser;
