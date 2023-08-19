"use strict"

const { wooApi, twilioClient } = require('../config/config');
const { jwtr, checkToken } = require('../helpers/authenticator.helper');
// const { PasswordHash } = require('node-phpass')
const Cryptr = require('cryptr');
const { switchProductInfo } = require('../helpers/productsHelper');
const cryptr = new Cryptr(JSON.parse(process.env.ADMIN_CRED).token);
const { debug } = require('../helpers/log.helper');
const hasher = require('wordpress-hash-node');


async function authPlugin(fastify, options) {
    fastify.post('/auth', async function (req, res) {

        const connection = await fastify.mysql.getConnection();
        let [rows, field] = await connection.query(`SELECT id, user_pass FROM b2c_users WHERE user_email = "` + req.body.username + `"`);
        connection.release();
        if (rows[0] != null && hasher.CheckPassword(req.body.password, rows[0].user_pass)) {
            if(req.body.username.startsWith("del_" + rows[0].id)){
                res.status(403).send({
                    success: false,
                    message: "Not Authorized"
                })
                return;
            }
            jwtr.sign({
                jti: req.body.username
            },
                JSON.parse(process.env.ADMIN_CRED).token, { expiresIn: "30d" })
                .then((token) => {
                    jwtr.verify(token, JSON.parse(process.env.ADMIN_CRED).token).then(async () => {
                        let response = await wooApi.get("customers/" + rows[0].id);
                        let ordered_samples_index = response.data.meta_data.findIndex(r => r.key == "_v_ordered_samples");
                        let orderedSamples = ordered_samples_index > -1 ? response.data.meta_data[ordered_samples_index].value : [];
                        let user_meta_products_index = response.data.meta_data.findIndex(r => r.key == "user_meta_products");
                        let user_meta_products = user_meta_products_index > -1 ? response.data.meta_data[user_meta_products_index].value : [];
                        orderedSamples = ordered_samples_index > -1 ?
                            (typeof response.data.meta_data[ordered_samples_index].value == "string" ?
                                response.data.meta_data[ordered_samples_index].value.split(",") :
                                response.data.meta_data[ordered_samples_index].value).map(function (item) { return parseInt(item, 10); })
                            : [];
                        let type_index = -1;
                        //let isPremiumUser = false;
                        //orderedSamples = orderedSamples.split(",").map(function(item) { return parseInt(item, 10); });
                        res.clearCookie('token', { path: '/', sameSite: 'lax' })
                        res.clearCookie('user_id', { path: '/', sameSite: 'lax' })

                        res.setCookie('token', token, { path: '/', sameSite: 'lax' })
                        res.setCookie('user_id', cryptr.encrypt(rows[0].id), { path: '/', sameSite: 'lax' })
                        res.setCookie('first_name', response.data.first_name, { path: '/', sameSite: 'lax' })
                        res.setCookie('last_name', response.data.last_name, { path: '/', sameSite: 'lax' })
                        res.setCookie('user_meta_products', JSON.stringify(user_meta_products), { path: '/', sameSite: 'lax' })

                        if (response.data.meta_data.findIndex(r => r.key == "_v_customer_type") > -1) {
                            type_index = response.data.meta_data.findIndex(r => r.key == "_v_customer_type");
                            response.data.meta_data[type_index]
                            //res.setCookie('isPremiumUser', (response.data.meta_data[type_index].value === "A" || response.data.meta_data[type_index].value === "B").toString(), {path: '/', sameSite: 'lax'})
                        }

                        let cart_items = typeof req.cookies.cart_items == "undefined" ? [] : JSON.parse(req.cookies.cart_items);
                        let cart_later_items = typeof req.cookies.cart_later_items == "undefined" ? [] : JSON.parse(req.cookies.cart_later_items);
                        let cart_subscription = typeof req.cookies.cart_subscription == "undefined" ? [] : JSON.parse(req.cookies.cart_subscription);
                        let user_id = rows[0].id;
                        let cart_temporary = typeof req.cookies.cart_temporary == "undefined" ? [] : JSON.parse(req.cookies.cart_temporary);
                        if (cart_temporary.length > 0 && (response.data.meta_data[type_index].value === "A" || response.data.meta_data[type_index].value === "B")) {
                            cart_temporary.forEach(function (ct) {
                                if (cart_items.findIndex(r => r.product_id == ct.product_id) == -1)
                                    cart_items.push(ct);
                            });
                        }
                        res.clearCookie('cart_temporary', { path: '/', httpOnly: false, sameSite: 'lax' });
                        if (token != null) {
                            debug.log(cart_subscription);
                            if (cart_subscription.length > 0) {
                                let connection = await fastify.mysql.getConnection();
                                if (type_index > -1) {
                                    if (response.data.meta_data[type_index].value === "A" || response.data.meta_data[type_index].value === "B") {
                                        let orig_product = (await wooApi.get("products/" + cart_subscription[0].product_id)).data;
                                        let premium_product = await switchProductInfo(response.data, orig_product);
                                        cart_subscription[0].product_id = premium_product.id;
                                    }
                                }
                                let [rows, fields] = await connection.query(`SELECT  * FROM b2c_cart_subscription WHERE user_id = ?`, [user_id]);
                                if (rows.length === 0) {
                                    await connection.query(`INSERT INTO b2c_cart_subscription (user_id, product_id, quantity, buylater, frequency) VALUES (?,?,?,?,?)`, [user_id, cart_subscription[0].product_id, cart_subscription[0].quantity, cart_subscription[0].buylater, cart_subscription[0].frequency]);
                                } else {
                                    await connection.query(`DELETE FROM b2c_cart_subscription WHERE user_id = ?`, [user_id]);
                                    await connection.query(`INSERT INTO b2c_cart_subscription (user_id, product_id, quantity, buylater, frequency) VALUES (?,?,?,?,?)`, [user_id, cart_subscription[0].product_id, cart_subscription[0].quantity, cart_subscription[0].buylater, cart_subscription[0].frequency]);
                                }
                                res.setCookie('cart_subscription', JSON.stringify(rows), { path: '/', sameSite: 'lax' });
                                connection.release();
                            } else {
                                let [rows, fields] = await connection.query(`SELECT  * FROM b2c_cart_subscription WHERE user_id = ?`, [user_id]);
                                res.setCookie('cart_subscription', JSON.stringify(rows), { path: '/', sameSite: 'lax' });
                                connection.release();
                            }
                            if (cart_items.length > 0) {
                                let count = 0;
                                cart_items.forEach(async function (item) {
                                    let connection = await fastify.mysql.getConnection();
                                    if (type_index > -1) {
                                        if (response.data.meta_data[type_index].value === "A" || response.data.meta_data[type_index].value === "B") {
                                            let orig_product = (await wooApi.get("products/" + item.product_id)).data;
                                            let premium_product = await switchProductInfo(response.data, orig_product);
                                            item.product_id = premium_product.id;
                                        }
                                    }
                                    let [rows, fields] = await connection.query(`SELECT  * FROM b2c_cart WHERE user_id = ? AND product_id = ? AND buylater = 0`, [user_id, item.product_id]);
                                    if (rows.length === 0) {
                                        await connection.query(`INSERT INTO b2c_cart (user_id, product_id, quantity, buylater) VALUES (?,?,?,?)`, [user_id, item.product_id, item.quantity, item.buylater]);
                                        count++;
                                    } else {
                                        await connection.query(`UPDATE b2c_cart SET quantity = ? WHERE user_id = ? AND product_id = ?`, [item.quantity, item.user_id, item.product_id]);
                                        count++;
                                    }

                                    if (orderedSamples.findIndex(r => parseInt(r) == parseInt(item.product_id))) {
                                        try {
                                            let product_detail = (await wooApi.get('products/' + item.product_id)).data;
                                            if (product_detail.categories.findIndex(r => r.slug.includes("sample")) > -1) {
                                                await connection.query(`DELETE from b2c_cart WHERE user_id = ? AND product_id = ?`, [user_id, item.product_id]);
                                            }
                                        } catch (e) {

                                        }
                                    }
                                    if (cart_items.length == count) {
                                        if (cart_later_items.length > 0) {
                                            for (let i = 0; i < cart_later_items.length; i++) {
                                                connection = await fastify.mysql.getConnection();
                                                [rows, fields] = await connection.query(`SELECT * FROM b2c_cart WHERE user_id = ? AND product_id = ? AND buylater = 1`, [user_id, cart_later_items[i].product_id]);
                                                if (rows.length === 0) {
                                                    await connection.query(`INSERT INTO b2c_cart (user_id, product_id, quantity, buylater) VALUES (?,?,?,?)`, [user_id, cart_later_items[i].product_id, cart_later_items[i].quantity, cart_later_items[i].buylater]);
                                                } else {
                                                    await connection.query(`UPDATE b2c_cart SET quantity = ? WHERE user_id = ? AND product_id = ?`, [cart_later_items[i].quantity, user_id, cart_later_items[i].product_id]);
                                                }
                                                connection.release();
                                            }
                                            // cart_later_items.forEach(async function(item, index){
                                            //     connection = await fastify.mysql.getConnection();
                                            //     [rows, fields] = await connection.query(`SELECT * FROM b2c_cart WHERE user_id = ? AND product_id = ? AND buylater = 1` , [user_id, item.product_id]);
                                            //     if(rows.length === 0) {
                                            //         await connection.query(`INSERT INTO b2c_cart (user_id, product_id, quantity, buylater) VALUES (?,?,?,?)`, [user_id, item.product_id, item.quantity, item.buylater]);
                                            //     } else {
                                            //         await connection.query(`UPDATE b2c_cart SET quantity = ? WHERE user_id = ? AND product_id = ?`, [item.quantity, user_id, item.product_id]);
                                            //     }
                                            //     connection.release();
                                            // });
                                        }
                                        [rows] = await connection.query(`SELECT id, user_id, product_id, buylater, quantity FROM b2c_cart WHERE user_id = ? AND buylater = 0`, [user_id]);
                                        let [rows2] = await connection.query(`SELECT id, user_id, product_id, buylater, quantity FROM b2c_cart WHERE user_id = ? AND buylater = 1`, [user_id]);
                                        //if(rows[0].qty_total > 0)
                                        res.setCookie('cart_items', JSON.stringify(rows), { path: '/', sameSite: 'lax' });
                                        res.setCookie('cart_later_items', JSON.stringify(rows2), { path: '/', sameSite: 'lax' });
                                        res.status(200).send({
                                            success: true,
                                            message: "Auth Success!",
                                            token: token
                                        })
                                    }
                                    connection.release();
                                });
                            } else {
                                const connection = await fastify.mysql.getConnection();
                                if (cart_later_items.length > 0) {
                                    for (let i = 0; i < cart_later_items.length; i++) {
                                        let [rows, fields] = await connection.query(`SELECT * FROM b2c_cart WHERE user_id = ? AND product_id = ? AND buylater = 1`, [user_id, cart_later_items[i].product_id]);
                                        if (rows.length === 0) {
                                            await connection.query(`INSERT INTO b2c_cart (user_id, product_id, quantity, buylater) VALUES (?,?,?,?)`, [user_id, cart_later_items[i].product_id, cart_later_items[i].quantity, cart_later_items[i].buylater]);
                                        } else {
                                            await connection.query(`UPDATE b2c_cart SET quantity = ? WHERE user_id = ? AND product_id = ?`, [cart_later_items[i].quantity, user_id, cart_later_items[i].product_id]);
                                        }
                                    }
                                }
                                let [rows] = await connection.query(`SELECT id, user_id, product_id, buylater, quantity FROM b2c_cart WHERE user_id = ? AND buylater = 0`, [user_id]);
                                let [rows2] = await connection.query(`SELECT id, user_id, product_id, buylater, quantity FROM b2c_cart WHERE user_id = ? AND buylater = 1`, [user_id]);
                                connection.release();
                                if (rows.reduce(function (a, b) { return parseInt(b.quantity) + parseInt(a) }, 0) > 0)
                                    res.setCookie('cart_items', JSON.stringify(rows), { path: '/', sameSite: 'lax' });
                                res.setCookie('cart_later_items', JSON.stringify(rows2), { path: '/', sameSite: 'lax' });
                                res.status(200).send({
                                    success: true,
                                    message: "Auth Success!",
                                    token: token
                                })
                            }
                        }
                    }).catch((err) => {
                        console.error(err);
                        res.status(403).send({
                            success: false,
                            message: "Not Authorized"
                        })
                    })
                })
                .catch((error) => {
                    console.error(error);
                    res.status(403).send({
                        success: false,
                        message: "Not Authorized"
                    });
                });
        } else {
            res.status(403).send("Not Authorized");
        }
    })

    fastify.post('/auth/new', async function (req, res) {
        try {
            let response = await wooApi.post("customers", req.body); //await connection.query(`INSERT INTO b2c_users (user_login, user_email, user_nicename, user_pass) VALUES (?,?,?,?)`, [user_login, user_email, user_nicename, user_pass]);

            res.clearCookie('hospital_id', { path: '/', sameSite: 'lax' })
            res.clearCookie('hospital_name', { path: '/', sameSite: 'lax' })
            res.clearCookie('hospital_code', { path: '/', sameSite: 'lax' })
            res.setCookie('new_registered', "true", { path: '/', sameSite: 'lax' })
            response.data.success = true;
            res.status(200).send(response.data);
        } catch (e) {
            // console.error(e);
            res.status(500).send(e);
        }
        //}
    })

    fastify.post('/auth/expire', async function (req, res) {
        try {
            res.clearCookie('token', { path: '/', sameSite: 'lax' })
            res.clearCookie('user_id', { path: '/', sameSite: 'lax' })
            res.clearCookie('first_name', { path: '/', sameSite: 'lax' })
            res.clearCookie('last_name', { path: '/', sameSite: 'lax' })
            res.clearCookie('cart_items', { path: '/', sameSite: 'lax' })
            res.clearCookie('cart_later_items', { path: '/', sameSite: 'lax' })
            res.clearCookie('cart_subscription', { path: '/', sameSite: 'lax' })
            //res.clearCookie('isPremiumUser', {path: '/', sameSite: 'lax'})
            res.clearCookie('user_meta_products', { path: '/', sameSite: 'lax' })
            res.clearCookie('checked_products', { path: '/', sameSite: 'lax' })
            res.clearCookie('hasSampleInCart', { path: '/', sameSite: 'lax' });
            res.clearCookie('_v_timesale_slug', { path: '/', sameSite: 'lax' });
            res.clearCookie('cart_temporary', { path: '/', sameSite: 'lax' })

            let token = req.headers.authorization.slice(7, req.headers.authorization.length)
            let tokenDetails = await jwtr.verify(token, JSON.parse(process.env.ADMIN_CRED).token)
            await jwtr.destroy(tokenDetails.jti);
            return ({
                success: true,
                message: "User logged out"
            });
        } catch (err) {
            console.error(err)
            return ({
                success: false,
                message: "Invalid Token"
            });
        }
    })

    fastify.get('/auth/token', {preHandler: checkToken}, async function (req, res){
        res.status(200).send(req.headers);
    })

    fastify.post('/pwreset', async function (req, res) {
        let response = await (await (fetch(JSON.parse(process.env.MISC).wordpress_url + '/wc/v3/pwreset', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        }))).json();
        res.status(200).send({ success: response.success });
    });

}

module.exports = authPlugin