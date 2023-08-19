"use strict"

require("./config/config");

const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const pluginPaths = './plugins/'
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { env, wooApi, jsVersionFile } = require('./config/config');
const { addToCart, getHospitalCodeOrId } = require('./helpers/hooks.helper')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(JSON.parse(process.env.ADMIN_CRED).token);
const { switchProductInfo } = require('./helpers/productsHelper')
const { htmlMeta, generateCommonTemplate, cacheFile } = require('./helpers/client.helper');

module.exports = async function (fastify, opts) {

    //fastify.register(require('fastify-url-data'));

    fastify.register(require('fastify-mysql'), JSON.parse(process.env.DB));
    
    fastify.register(require('fastify-file-upload'))

    // fastify.register(require('point-of-view'), {
    //     engine: {
    //       ejs: require('ejs')
    //     },
    //     root: path.resolve(__dirname,'templates'),
    //     layout: 'index.ejs',
    //     options: {
    //         filename: path.resolve(__dirname,'templates'),
    //     },
    //     defaultContext: {
    //         baseURL: process.env.host + process.env.port
    //     }
    // })

    fastify.register(require('fastify-cookie'), {
        secret: "tok", // for cookies signature
        parseOptions: {}     // options for parsing cookies
    })
    
    // fastify.register(require('fastify-session'), {
    //     secret: JSON.parse(process.env.ADMIN_CRED).token
    // });

    // fastify.addHook('preHandler', (request, reply, next) => {
    //     if(request.session.user == null)
    //         request.session.user = {name: Math.random()};
    //     next();
    // });

    fastify.register(require('fastify-static'), {
        root: path.join(__dirname, 'templates')
    })

    fs.readdirSync(pluginPaths).forEach(function(file) {
        try{
            fastify.register(require(pluginPaths + file));
        } catch(err){
            console.log(file,"----err", err);
        }
    });

    fastify.addHook('onRequest', (req, res, next) => {
        (async () => {
            let query_refs = '(add-to-cart=)|(ref=)|(refcd=)|(hospital_unique_cd=)|(hospital_id=)|(hospital_name=)';
            if((typeof req.headers.referer == "undefined" || typeof req.headers.origin == "undefined") && !(req.url.match(query_refs))){
                next();
                return;
            }
            if(!req.url.match(/[.]jpg|[.]png|[.]js|[.]css|[.]ico|[.]svg/g) && !req.raw.headers.host.includes("localhost")){
                console.log(req.url, process.memoryUsage());
            }
            if(Object.entries(req.query).length > 0 && req.raw.method == "GET" && (req.url.match(query_refs))) {
                if (!req.raw.originalUrl.includes('/product') && !req.raw.originalUrl.includes('/news')&& !req.raw.originalUrl.includes('/pet-qa')) {
                    let cart_items = [];
                    if(typeof req.query['add-to-cart'] != "undefined") {
                        req.query['quantity'] = typeof req.query['quantity'] === "undefined" || req.query['quantity'] === null? 1 : req.query['quantity'] ;
                        cart_items = await addToCart(fastify, req, res);
                        req.cookies.cart_items = JSON.stringify(cart_items);
                    }
                    
                    if(typeof req.query['ref'] != "undefined") {
                        res.setCookie('ref', req.query['ref'], {path: '/', httpOnly: false, sameSite: 'lax'});
                    }
                    
                    if(typeof req.query['refcd'] != "undefined") {
                        var refcd = req.query['refcd'].replace(/uid\[(.*?)\]/g, "$1").replace(/^0+(\d)/gm, '$1');
                        res.setCookie('refcd', refcd, {path: '/', httpOnly: false, sameSite: 'lax'});
                    }
                    if(typeof req.query['hospital_unique_cd'] != "undefined" || typeof req.query['hid'] != "undefined") {
                        let result = await getHospitalCodeOrId(req, res);
                        if(typeof result !== "undefined") {
                            res.setCookie('hospital_code', result.HospitalCode__c, {path: '/', httpOnly: false, sameSite: 'lax'});
                            res.setCookie('hospital_id', parseInt(result.HospitalID__c), {path: '/', httpOnly: false, sameSite: 'lax'});
                            res.setCookie('hospital_name', result.Name, {path: '/', httpOnly: false, sameSite: 'lax'});
                        }
                    }
                }
            }
            next();
        })();
    });

    fastify.setErrorHandler(function (error, request, reply) {
        console.log(error)

        let html_meta_title = htmlMeta('title', '404');
        let html_meta_keyword = htmlMeta('keyword', '404');
        let html_meta_description = htmlMeta('description', '404');
        let html_meta_follow = htmlMeta('follow', '404');
        let { header, footer } = generateCommonTemplate([
            '/components/account/auth.mhtml',
            '/components/account/account.mhtml'
        ], [
        ], {
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description,
            html_meta_follow: html_meta_follow
        },{});

        var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/404.mhtml', 'utf8');

        let data = {
            header: header,
            footer: footer,
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description
        }

        var content = Mustache.render(template, data)
        reply.status(200).header('Content-Type', 'text/html').send(content);
    })

    fastify.setNotFoundHandler({
        preHandler: (req, reply, next) => {
            req.body.beforeHandler = true
            next()
        }
    }, function (request, reply) {
          // Default not found handler with beforeHandler hook
    })

    fastify.register(function (instance, options, next) {
        instance.setNotFoundHandler(function (request, reply) {
            let html_meta_title = htmlMeta('title', '404');
            let html_meta_keyword = htmlMeta('keyword', '404');
            let html_meta_description = htmlMeta('description', '404');
            let html_meta_follow = htmlMeta('follow', '404');

            let { header, footer } = generateCommonTemplate([
                '/components/account/auth.mhtml',
                '/components/account/account.mhtml'
            ], [
            ], {
                html_meta_title: html_meta_title,
                html_meta_keyword: html_meta_keyword,
                html_meta_description: html_meta_description,
                html_meta_follow: html_meta_follow
            }, {});
    
            var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/404.mhtml', 'utf8');
            let data = {
                header: header,
                footer: footer,
                html_meta_title: html_meta_title,
                html_meta_keyword: html_meta_keyword,
                html_meta_description: html_meta_description
            }
    
            var content = Mustache.render(template, data)
            reply.status(200).header('Content-Type', 'text/html').send(content);
        })
        next()
    }, { prefix: '/' })

    fastify.get('/', async (req, reply) => {
        req.log.info('トップページ');
        let cachedTemplate = await cacheFile("top-page.mhtml", "");
        if(cachedTemplate.success){
            console.log('Using cached file')
            reply.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        console.log('No cached file')
        try {
            let base_url = (req.headers.host.includes("localhost")? "http://" : "https://") + req.headers.host;
            let home_url = base_url;
            //let checked_products = [];
            let featured_products = [];
            //let checked_products_ids = typeof req.cookies.checked_products == 'undefined' ? [] : JSON.parse(req.cookies.checked_products);
            let id = (req.cookies.user_id != null && typeof req.cookies.user_id !== "undefined" ? cryptr.decrypt(req.cookies.user_id) : '');
            let customer_meta = { meta_data: [] }
            let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
            let qa_list = await (await (fetch(domain + '/wp/v2/qanda?per_page=5&orderby=date&order=desc'))).json();
            //let header_content =[];
            for (let i = 0; i < qa_list.length; i++) {
                qa_list[i].date = qa_list[i].date.substr(0, 10);
                let cat_ids = qa_list[i].categories.join();
                let categories = await (await (fetch(domain + '/wp/v2/categories?include=' + cat_ids))).json();
                qa_list[i].categories = categories.map(function (categ) { return {id: categ.id, slug: categ.slug, name: categ.name}; });
                qa_list[i].category = qa_list[i].categories.length > 1 ? qa_list[i].categories[1] : qa_list[i].categories[0];
                qa_list[i].type = qa_list[i].categories.length > 0 ? qa_list[i].categories[0] : 'dog';
                // let tag_ids = qa_list[i].tags.join();
                // let tags = await (await (fetch(domain + '/wp/v2/tags?include=' + tag_ids))).json();
                // qa_list[i].tags = tags.map(function (tag) { return {id: tag.id, slug: tag.slug, name: tag.name}; });

                // let header_content_object = {
                // id: qa_list[i].id,
                // html_meta_h1: qa_list[i].html_meta_h1,
                // html_meta_title: qa_list[i].html_meta_title,
                // html_meta_keyword: qa_list[i].html_meta_keyword,
                // html_meta_description: qa_list[i].html_meta_description
                // }
                // header_content.push(header_content_object);
            }
            let dog_tag_list = await (await (fetch(domain + '/wp/v2/tags?per_page=100&search=dog_'))).json();
            let cat_tag_list = await (await (fetch(domain + '/wp/v2/tags?per_page=100&search=cat_'))).json(); 
            dog_tag_list = dog_tag_list.filter((item) => item.count > 0);
            cat_tag_list = cat_tag_list.filter((item) => item.count > 0);

            if (env !== 'production' && env !== 'prod') {
                home_url += "";
            }
            if (!base_url.includes("localhost:")) {
                base_url = base_url.replace("http:", "https:");
                home_url = home_url.replace("http:", "https:");
            }

            var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/index.mhtml', 'utf8');

            if (id !== '') {
                customer_meta = (await wooApi.get('customers/' + id)).data;
            }
            try {
                let feat_product_response = (await wooApi.get("products?featured=true"));
                feat_product_response = feat_product_response.data;
                for (let i = 0; i < feat_product_response.length; i++) {
                    let featured_product = await switchProductInfo(customer_meta, feat_product_response[i]);
                    if (featured_product.categories.findIndex(r => r.slug.includes("bundle")) < 0 && featured_product.status == "publish") {
                        featured_products.push({
                            "id": featured_product.id,
                            "slug": featured_product.slug,
                            "name": featured_product.name,
                            "img": featured_product.images[0].src
                        });
                    }
                }
            } catch (e) {
                console.log(e)
            }
            new Promise((resolve, reject) => {
                resolve();
                // if (checked_products_ids.length == 0)
                //     resolve();
                // checked_products_ids.forEach(async function (product_id, index) {
                //     try {
                //         let response = await wooApi.get("products/" + product_id);
                //         response.data = await switchProductInfo(customer_meta, response.data);
                //         if (checked_products.findIndex(r => r.id == response.data.id) < 0) {
                //             checked_products.push({
                //                 "id": response.data.id,
                //                 "slug": response.data.slug,
                //                 "name": response.data.name,
                //                 "img": response.data.images[0].src
                //             });
                //         }
                //     } catch (e) {
                //         reply.clearCookie('checked_products', { path: '/', sameSite: 'lax' })
                //         resolve();
                //     }

                //     if (true || checked_products.length == checked_products_ids.length) {
                //         resolve();
                //     }
                // });
            }).then(async () => {
                let protocol = env === "local" ? "http" : "https";
                let posts = []
                try {
                    let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
                    posts = await (await fetch(domain + "/wp/v2/posts?per_page=5&orderby=date&order=desc")).json()
                    if (posts.statusCode !== 404) {
                        let post_holder = [];
                        for (let i = 0; i < posts.length; i++) {
                            post_holder.push({
                                id: posts[i].id,
                                slug: posts[i].slug,
                                date: posts[i].date.substr(0, 10),
                                title: posts[i].title.rendered,
                            });
                        }
                        posts = post_holder;
                    }
                } catch (e) {
                    console.log(e);
                }
                let cust_type_index = customer_meta.meta_data.findIndex(r => r.key === '_v_customer_type')
                let cust_type = cust_type_index > -1 ? customer_meta.meta_data[cust_type_index].value : "N";
                let isPremiumUser = (cust_type == "A" || cust_type == "B") ? true : false;

                let user_id = req.cookies.user_id !== null && typeof req.cookies.user_id !== "undefined" ? cryptr.decrypt(req.cookies.user_id) : '';

                //posts = JSON.stringify(posts,null, 1)
                //qa_list = JSON.stringify(qa_list,null, 1)

                let html_meta_title = htmlMeta('title', 'index');
                let html_meta_keyword = htmlMeta('keyword', 'index');
                let html_meta_description = htmlMeta('description', 'index');
                let html_meta_follow = htmlMeta('follow', 'index');

                
                let cart_items = typeof req.cookies.cart_items == "undefined" ? [] : JSON.parse(req.cookies.cart_items);
                let cart_count = cart_items.reduce(function (a, b) { return parseInt(b.quantity) + parseInt(a) }, 0);
                let { header, footer } = generateCommonTemplate([
                    '/components/account/account.mhtml'
                ], [

                ], {
                    accountVersion: jsVersionFile.account,
                    productVersion: jsVersionFile.product,
                    title: "ビルバックサービス｜ビルバックジャパンの公式通販サイト",
                    user_id: user_id, is_premium_user: isPremiumUser,
                    token: req.cookies.token,
                    base_url: base_url,
                    home_url: home_url,
                    cart_count: cart_count,
                    html_meta_h1: '',
                    html_meta_title: html_meta_title,
                    html_meta_keyword: html_meta_keyword,
                    html_meta_description: html_meta_description,
                    html_meta_follow: html_meta_follow
                }, {});


                let data = {
                    token: req.cookies.token,
                    featured_products: featured_products,
                    posts: posts,
                    qa_list: qa_list,
                    dog_tag_list: dog_tag_list,
                    cat_tag_list: cat_tag_list,
                    user_id: user_id,
                    is_premium_user: isPremiumUser,
                    header: header,
                    footer: footer,
                    base_url: base_url,
                    home_url: home_url,
                    cart_count: cart_count,
                    html_meta_h1: '',
                    html_meta_title: html_meta_title,
                    html_meta_keyword: html_meta_keyword,
                    html_meta_description: html_meta_description,
                    page_content: { title: "ビルバックサービス｜ビルバックジャパンの公式通販サイト" }
                };

                var content = Mustache.render(template, data);
                await cacheFile("top-page.mhtml", content);
                reply.status(200).header('Content-Type', 'text/html').send(content)
            });
        } catch (e) {
            console.log(e)
        }
    });
}

module.exports.options = {
    logger: {
        level: 'debug',
        file: '/var/log/nginx/transaction.log'
    },
    maxParamLength: 1000,
    ignoreTrailingSlash: true
}
