
const { wooApi, salesforce, env } = require('../config/config');
const { getSFToken } = require("../helpers/authenticator.helper");
const { switchProductInfo } = require("../helpers/productsHelper");
const jsforce = require('jsforce');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(JSON.parse(process.env.ADMIN_CRED).token);

const clientId = JSON.parse(process.env.SALESFORCE_JWT).clientId;
const privateKey = require('fs').readFileSync(JSON.parse(process.env.SALESFORCE_JWT).privateKey, 'utf8');
const username = JSON.parse(process.env.SALESFORCE_JWT).username;

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Mustache = require('mustache');
const fs = require('fs');

function getHospitalCodeOrId(req, res) {
    return new Promise(resolve => {
        getSFToken(clientId, privateKey, username).then(keys => {
            let accessToken = JSON.parse(keys).access_token;
            let instanceUrl = JSON.parse(keys).instance_url;
            let sfConnection = new jsforce.Connection({
                instanceUrl: instanceUrl,
                accessToken: accessToken
            });
            let basis = typeof req.query['hospital_unique_cd'] !== "undefined"? 'HospitalCode__c' : 'HospitalID__c';
            let basisVal = typeof req.query['hospital_unique_cd'] !== "undefined"? req.query['hospital_unique_cd'] : ""+parseInt(req.query['hid']);
            sfConnection.query("SELECT HospitalID__c, HospitalCode__c, Name FROM Hospitalinformations__c WHERE " + basis + " = '" + basisVal + "'", function (err, results) {
                if(!err && results.records.length > 0) {
                    resolve(results.records[0])
                }
                else{
                    console.log(err)
                    resolve({
                        HospitalID__c : "",
                        HospitalCode__c: "",
                        Name: ""
                    });
                }
            });
        });
    });
}

async function addToCart(fastify, req, res){
    const connection = await fastify.mysql.getConnection();
    let isSample = false;
    try {
        let productResponse = (await wooApi.get('products/' + req.query["add-to-cart"])).data;
        let categories = productResponse.categories;
        let id = req.cookies.user_id !== null && typeof req.cookies.user_id !== "undefined"? cryptr.decrypt(req.cookies.user_id) : '';
        let isPremiumUser = false;
        let customer_meta = {meta_data:[]};
        let cart_timesale = (req.cookies.cart_timesale !== null && typeof req.cookies.cart_timesale !== "undefined")? JSON.parse(req.cookies.cart_timesale) : [];
        let cart_temporary = typeof req.cookies.cart_temporary == "undefined"? [] : JSON.parse(req.cookies.cart_temporary);
        req.isTPInCart = false;
        req.rerouteToMyPage = false;

        if (productResponse.parent_id != 0) {
            categories = (await wooApi.get('products/' + productResponse.parent_id)).data.categories;
        }
        if(id !== '') {
            customer_meta =  (await wooApi.get('customers/' + id)).data;
            let cust_type_index = customer_meta.meta_data.findIndex(r => r.key === '_v_customer_type')
            let cust_type = cust_type_index > -1? customer_meta.meta_data[cust_type_index].value : "N";
            isPremiumUser = (cust_type == "A" || cust_type == "B" )? true : false;
        }
        
        if(!isPremiumUser && (productResponse.sku == "" || categories.findIndex(r => r.slug.includes("premium-care")) > -1)) {
            req.rerouteToMyPage = true;
            if(typeof req.query['ts'] != "undefined") {
                res.setCookie('_v_timesale_slug', req.query['ts'] , {path: '/', httpOnly: false, sameSite: 'lax'});
                req.cookies._v_timesale_slug = req.query['ts'] ;
            }
            if(cart_temporary.findIndex(r => r.product_id == productResponse.id) == -1)
                cart_temporary.push({
                    id: productResponse.id,
                    product_id: parseInt(req.query['add-to-cart']),
                    quantity: parseInt(req.query['quantity']),
                    buylater: 0
                });
            res.setCookie('cart_temporary', JSON.stringify(cart_temporary) , {path: '/', httpOnly: false, sameSite: 'lax'});
            return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
        } else if (categories.findIndex(r => r.slug.includes("premium-care")) == -1){
            productResponse = await switchProductInfo(customer_meta, productResponse);
            req.query["add-to-cart"] = productResponse.id;
        } 
        
        if(categories.findIndex(r => r.slug.includes("sample")) > -1 ){
            if(isPremiumUser){
                isSample = true;
                let cart_items = typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
                //if(req.cookies.hasSampleInCart == "true")
                if(cart_items.findIndex(r => parseInt(r.product_id) == parseInt(req.query["add-to-cart"])) > -1) {
                    return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
                }
            } else {
                return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
            }
        }
        if(productResponse.status != "publish" || 
           productResponse.stock_status != "instock"/* ||
           productResponse.categories.findIndex(r => r.slug.includes("bundle")) > -1*/){
            return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
        }
        let cts_id = cart_timesale.findIndex(r => r.pid == productResponse.id) ;
        if(cts_id > -1 && cart_timesale[cts_id].ts != req.query['ts'] && typeof req.query['ts'] !== 'undefined') {
            req.isTPInCart = true;
            return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
        }
    } catch(err){
        console.log(err);
        return typeof req.cookies.cart_items == "string"? JSON.parse(req.cookies.cart_items) : [];
    }
    
    try {
        let user_id = req.cookies.user_id !== null && typeof req.cookies.user_id !== "undefined"? cryptr.decrypt(req.cookies.user_id) : '';
        let [item, fields] = await connection.query(`SELECT  * FROM b2c_cart WHERE user_id = ? AND product_id = ?` , [user_id, req.query["add-to-cart"]]);
        let cart_items = typeof req.cookies.cart_items == "undefined"? [] : JSON.parse(req.cookies.cart_items);

        if(typeof req.query['ts'] != "undefined") {
            res.setCookie('_v_timesale_slug', req.query['ts'] , {path: '/', httpOnly: false, sameSite: 'lax'});
            req.cookies._v_timesale_slug = req.query['ts'] ;
        } else{
            res.clearCookie('_v_timesale_slug', {path: '/', httpOnly: false, sameSite: 'lax'});
        }
        if(item.length === 0) {
            let response = await connection.query(`INSERT INTO b2c_cart (user_id, product_id, quantity, buylater) VALUES (?,?,?,?)`, [user_id, req.query["add-to-cart"], isSample? 1 : req.query.quantity, 0]);
            cart_items.push({
                id: response[0].insertId,
                product_id: parseInt(req.query['add-to-cart']),
                quantity: isSample? 1 : parseInt(req.query['quantity']),
                buylater: 0
            });
            if(isSample)
                res.setCookie('hasSampleInCart', (isSample).toString(), {path: '/', httpOnly: false, sameSite: 'lax'});
            res.setCookie('cart_items',JSON.stringify(cart_items), {path: '/', httpOnly: false, sameSite: 'lax'});
        } else {
            const cart_index = cart_items.findIndex(row => row.product_id == req.query['add-to-cart']);
            let response = await connection.query(`UPDATE b2c_cart SET quantity = ? WHERE user_id = ? AND product_id = ?`, [isSample? 1 : item[0].quantity + (parseInt(req.query.quantity)), user_id, req.query["add-to-cart"]]);
            cart_items[cart_index].quantity = isSample? 1: cart_items[cart_index].quantity + parseInt(req.query['quantity']);
            cart_items[cart_index].buylater =  0;
            res.setCookie('cart_items',JSON.stringify(cart_items), {path: '/', httpOnly: false, sameSite: 'lax'});
        }
        connection.release();
        return cart_items;
    } catch (e) {
        connection.release();
        let cart_items = typeof req.cookies.cart_items == "undefined"? [] : JSON.parse(req.cookies.cart_items);
        const cart_index = cart_items.findIndex(row => row.product_id ===  parseInt(req.query["add-to-cart"]));
           
        if(cart_index > -1) {
            cart_items[cart_index].quantity = isSample? 1 : cart_items[cart_index].quantity  + parseInt(req.query["quantity"]);
            cart_items[cart_index].buylater =  0;
        } else {
            cart_items.push({
                id: cart_items.length + 1,
                product_id: parseInt(req.query["add-to-cart"]),
                quantity: isSample? 1 :parseInt(req.query["quantity"]),
                buylater: 0
            });
            if(isSample)
                res.setCookie('hasSampleInCart', (isSample).toString(), {path: '/', httpOnly: false, sameSite: 'lax'});
        }
        console.log("Add to cookie")
        res.setCookie('cart_items',JSON.stringify(cart_items), {path: '/', httpOnly: false, sameSite: 'lax'});
        return cart_items;
        //throw e;
    }
}

async function get_user_info(req, res){
    var user_token = req.cookies.token;
    var user_id = req.cookies.user_id? cryptr.decrypt(req.cookies.user_id) : null;
    let customer_response = req.cookies.user_id !== null && typeof req.cookies.user_id !== "undefined"?  await wooApi.get("customers/" + user_id) : {data:{meta_data:[]}};
    let cust_type_index = customer_response.data.meta_data.findIndex(r => r.key === '_v_customer_type')
    let isPremiumUser =  cust_type_index > -1? customer_response.data.meta_data[cust_type_index].value == "A" ||  customer_response.data.meta_data[cust_type_index].value == "B" : false;
    
    let cart_items = typeof req.cookies.cart_items == "undefined" ? [] : JSON.parse(req.cookies.cart_items);
    let cart_count = cart_items.reduce(function (a, b) { return parseInt(b.quantity) + parseInt(a) }, 0);

    let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined"? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
    var page_content = req.cookies.user_id !== null && typeof req.cookies.user_id !== "undefined"? await(await(fetch(domain + '/wp/v2/pages?slug=terms'))).json() : [{content:"",rendered:""}];

    let header_content ={
        my_page_button_text: user_token? 'マイページ':'ログイン',
        cart_count: cart_count
    }

    //let header = Mustache.render(fs.readFileSync('/home/templates/mhtml/header.mhtml', 'utf8'), header_content);
    //let footer = Mustache.render(fs.readFileSync('/home/templates/mhtml/footer.mhtml', 'utf8'), { test: "test" });

    let header = '';
    let footer = '';


    let product_names = [];
    if(typeof customer_response.data.email !== "undefined"){
        let reviews = await (await wooApi.get('products/reviews?reviewer_email='+customer_response.data.email + "&per_page=99")).data;
        let user_product_index = customer_response.data.meta_data.findIndex(r => r.key === 'user_meta_products');
        let product_ids = user_product_index > -1? customer_response.data.meta_data[user_product_index].value : [];
        let orders = await (await wooApi.get('orders?customer=' + user_id + '&per_page=99&orderby=date&order=desc&status=processing,completed&_fields=date_created,line_items,customer_id&before=' + new Date(new Date().setDate(new Date().getDate() - 3)).toISOString())).data;
        let existing_prod_ids = [];


        reviews.forEach(element => {
            let prod_index = product_ids.findIndex(r => r == element.product_id);
            if(prod_index > -1) {
                product_ids.splice(prod_index, 1);
            }
        });
        orders.forEach(function(order){
            order.line_items.forEach(function(line_items){
                if(product_ids.findIndex(r => r == line_items.product_id) > -1)
                    existing_prod_ids.push(line_items.product_id)
            })
        })
        let products =  existing_prod_ids.length > 0? await (await wooApi.get('products?include=' + existing_prod_ids.join() + "&per_page=99")).data : [];
        products.forEach(function(product){
            product_names.push({
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0].src
            })
        });
    }


    var data ={
        token: user_token,
        id: user_id,
        isPremiumUser: isPremiumUser, 
        first_name: req.cookies.first_name, 
        last_name: req.cookies.last_name,
        tc: page_content[0].content.rendered, 
        product_names: product_names,
        user_meta: customer_response.data.meta_data,
        header: header,
        footer: footer,
    }
    return data;
}


async function get_news(per_page){
    try{
        let protocol = env === "local" ? "http" : "https";
        let posts = []
        var news_list = [];
    
        
        let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
        posts = await (await fetch(domain + `/wp/v2/posts?per_page=${per_page}&orderby=date&order=desc`)).json()
            if (posts.statusCode !== 404) {
                let post_holder = [];
                for (let i = 0; i < posts.length; i++) {
                    post_holder.push({
                        id: posts[i].id,
                        slug: posts[i].slug,
                        date: posts[i].date.substr(0, 10),
                        title: posts[i].title.rendered,
                        content: posts[i].content.rendered,
                        html_meta_h1: posts[i].html_meta_h1,
                        html_meta_title: posts[i].html_meta_title,
                        html_meta_keyword: posts[i].html_meta_keyword,
                        html_meta_description: posts[i].html_meta_description,
                        html_meta_follow: posts[i].html_meta_follow == undefined ? "index, follow": posts[i].html_meta_follow,
                        featured_media: posts[i].featured_media
                    });
                }
                return news_list = post_holder;
            }
        }catch(e){
            console.log(e)
        }
}

module.exports = {addToCart, getHospitalCodeOrId, get_user_info, get_news};
