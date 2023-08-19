"use strict"

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const Mustache = require('mustache');
const { readFileSync } = require('fs');
const path = require('path');

const { env, generateQACategories, jsVersionFile } = require('../config/config');
const { htmlMeta, generateCommonTemplate, cacheFile } = require('../helpers/client.helper');
const { get_news } = require('../helpers/hooks.helper');
const { debug } = require('../helpers/log.helper');

async function wordpressPlugin (fastify, options) {

    /***************UI ROUTES*****************/

    fastify.get('/sample', async function (req, res) {
        res.redirect('/sample-products');
    });

    fastify.get('/:slug', async function (req, res) {
        if(req.params.slug.match(/[.]jpg|[.]png|[.]js|[.]css|[.]ico|[.]svg/g)){
            return;
        }
        let cachedTemplate = await cacheFile("wordpress." + req.params.slug + ".mhtml", "");
        if(cachedTemplate.success){
            res.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        try {
            if(req.params.slug == "sitemap.xml"){
               let sitemap = fs.readFileSync(path.join(JSON.parse(process.env.MISC).mustache_dir, "../sitemap.xml"), 'utf8');
               return res.status(200).header('Content-Type', 'application/xml').send(sitemap);
            }
            let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
            let page_content = await (await (fetch(domain + '/wp/v2/pages?slug=' + req.params.slug))).json();
            let index = 0;
            let base_url = (req.headers.host.includes("localhost")? "http://" : "https://") + req.headers.host;
            let home_url = base_url;
            let media = page_content[index].featured_media == 0 ? '' : await (await (fetch(domain + '/wp/v2/media/' + page_content[index].featured_media))).json();

            let featured_media = (media == '') ? '' : media.media_details.sizes.shop_single.source_url
            let main_content = {
                title: page_content[index].title.rendered,
                content: page_content[index].content.rendered,
                next_page: index < page_content.length - 1 ? page_content[index + 1].id : null,
                previous_page: index > 0 ? page_content[index - 1].id : null
            }
            if (env !== 'production' && env !== 'prod') {
                home_url += "";
            }
            if (!base_url.includes("localhost:")) {
                base_url = base_url.replace("http:", "https:");
                home_url = home_url.replace("http:", "https:");
            }
            let { header, footer } = generateCommonTemplate([
                '/components/account/account.mhtml'
            ], [

            ], {
                title: "ビルバックサービス｜ビルバックジャパンの公式通販サイト",
                base_url: base_url,
                home_url: home_url,
                html_meta_h1: page_content[index].html_meta_h1,
                html_meta_title: page_content[index].html_meta_title,
                html_meta_keyword: page_content[index].html_meta_keyword,
                html_meta_description: page_content[index].html_meta_description,
                accountVersion: jsVersionFile.account,


            }, {});
            var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + "/page.mhtml", 'utf8');

            var data = {
                token: req.cookies.token,
                page_content: main_content,
                header: header,
                footer: footer,
                featured_media: featured_media
            }
            var content = Mustache.render(template, data)
            res.status(200).header('Content-Type', 'text/html').send(content)

        } catch (e) {
            console.error(e);
            throw "Not found";
        }
    });

    fastify.get('/news', async (req, res) => {
        //let news_list = await get_news(20);
        let cachedTemplate = await cacheFile("news.mhtml", "");
        if(cachedTemplate.success){
            res.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        let protocol = env === "local" ? "http" : "https";
        let posts = []
        var news_list = [];
    
        let base_url = (req.headers.host.includes("localhost")? "http://" : "https://") + req.headers.host;
            let home_url = base_url;

        let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
        
        posts = await (await fetch(domain + `/wp/v2/posts?per_page=100&orderby=date&order=desc`)).json()
        if (posts.statusCode !== 404) {
            
            for (let i = 0; i < posts.length; i++) {
                news_list.push({
                    id: posts[i].id,
                    slug: posts[i].slug,
                    date: posts[i].date.substr(0, 10),
                    title: posts[i].title.rendered,
                    content: posts[i].content.rendered,
                    html_meta_h1: posts[i].html_meta_h1,
                    html_meta_title: posts[i].html_meta_title,
                    html_meta_keyword: posts[i].html_meta_keyword,
                    html_meta_description: posts[i].html_meta_description,
                    featured_media: posts[i].featured_media,
                });
            }
            
        }
        
        let page = 1
        news_list.forEach((e,i) => {
            
            if (i % 10 == 0 && i != 0){
                page++;
            }
            e.data_page = page;
        })

        debug.log("Check Here:",news_list)

        if (env !== 'production' && env !== 'prod') {
            home_url += "";
        }

        if (!base_url.includes("localhost:")) {
            base_url = base_url.replace("http:", "https:");
            home_url = home_url.replace("http:", "https:");
        }

        let html_meta_title = htmlMeta('title', 'news-list');
        let html_meta_keyword = htmlMeta('keyword', 'news-list');
        let html_meta_description = htmlMeta('description', 'news-list');
        let html_meta_follow = htmlMeta('follow', 'news-list');  

        let { header, footer } = generateCommonTemplate([], [], {
                html_meta_title: html_meta_title,
                html_meta_keyword: html_meta_keyword,
                html_meta_description: html_meta_description,
                html_meta_follow: html_meta_follow
            }, {});
        let template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/news-list.mhtml', 'utf8');
        let media = []

        // for (const e of news_list) {
        //     if(e.featured_media != 0 ){
        //         let feature = await (await (fetch(domain + '/wp/v2/media/' + e.featured_media))).json()
        //         media.push(feature.media_details.sizes.shop_single.source_url)
        //     }
        //     else{
        //         media.push('');
        //     }
        // }

        let data = {
            header: header,
            footer: footer,
            news_list: news_list,
            html_meta_h1: '',
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description,
            featured_media: media,
            news_length: news_list.length,
            base_url: base_url,
            home_url: home_url
        }

        var content = Mustache.render(template, data);
        
        await cacheFile("news.mhtml", content);
        res.status(200).header('Content-Type', 'text/html').send(content);

    });

    fastify.get('/news/:slug', async function (req, res) {
        let cachedTemplate = await cacheFile("news." + req.params.slug + ".mhtml", "");
        if(cachedTemplate.success){
            res.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        var news_list = await get_news(20);
        var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/news.mhtml', 'utf8');
        let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
        let index = news_list.findIndex(row => decodeURI(row.slug) === decodeURI(req.params.slug));
        let base_url = (req.headers.host.includes("localhost")? "http://" : "https://") + req.headers.host;
        let home_url = base_url;

        let media = news_list[index].featured_media == 0 ? '' : await (await (fetch(domain + '/wp/v2/media/' + news_list[index].featured_media))).json();

        let featured_media = (media == '') ? '' : media.media_details.sizes.shop_single.source_url
        

        if (env !== 'production' && env !== 'prod') {
            home_url += "";
        }
        if (!base_url.includes("localhost:")) {
            base_url = base_url.replace("http:", "https:");
            home_url = home_url.replace("http:", "https:");
        }

        let { header, footer } = generateCommonTemplate([
            '/components/account/account.mhtml'
        ], [

        ], {
            title: "ビルバックサービス｜ビルバックジャパンの公式通販サイト",
            token: req.cookies.token,
            base_url: base_url,
            home_url: home_url,
            html_meta_h1: news_list[index].html_meta_h1,
            html_meta_title: news_list[index].html_meta_title,
            html_meta_keyword: news_list[index].html_meta_keyword,
            html_meta_description: news_list[index].html_meta_description,
            accountVersion: jsVersionFile.account,
        }, {});

        var page_content = {
            date: news_list[index].date,
            title: news_list[index].title,
            content: news_list[index].content,
            next_page: index < news_list.length - 1 ? news_list[index + 1].slug : null,
            previous_page: index > 0 ? news_list[index - 1].slug : null
        }

        var data = {
            header: header,
            footer: footer,
            page_content: page_content,
            featured_media: featured_media
        }
        var content = Mustache.render(template, data);
        
        await cacheFile("news." + req.params.slug + ".mhtml", content);
        res.status(200).header('Content-Type', 'text/html').send(content);
    });

    async function category_tag_lists(domain) {
        try {
            let category_list = await (await (fetch(domain + '/wp/v2/categories?per_page=100'))).json();
            let dog_category_list = category_list.filter((item) => item.count > 0 && item.slug.startsWith('qa_dog_'));
            let cat_category_list = category_list.filter((item) => item.count > 0 && item.slug.startsWith('qa_cat_'));
            let category_map = category_list.reduce((map, c) => { map[c.slug] = c.id; return map }, {});
            let dog_category_map = dog_category_list.reduce((map, c) => { map[c.id.toString()] = {slug: c.slug, name: c.name}; return map }, {});
            let cat_category_map = cat_category_list.reduce((map, c) => { map[c.id.toString()] = {slug: c.slug, name: c.name}; return map }, {});
            let dog_tag_list = await (await (fetch(domain + '/wp/v2/tags?per_page=100&search=dog_'))).json();
            let dog_tag_map = dog_tag_list.reduce((map, c) => { map[c.id.toString()] = c.slug; return map }, {});
            let cat_tag_list = await (await (fetch(domain + '/wp/v2/tags?per_page=100&search=cat_'))).json();
            let cat_tag_map = cat_tag_list.reduce((map, c) => { map[c.id.toString()] = c.slug; return map }, {});
            return {
                category_list: category_list,
                dog_category_list: dog_category_list,
                cat_category_list: cat_category_list,
                category_map: category_map,
                dog_category_map: dog_category_map,
                cat_category_map, cat_category_map,
                dog_tag_list, dog_tag_list,
                dog_tag_map, dog_tag_map,
                cat_tag_list, cat_tag_list,
                cat_tag_map, cat_tag_map
            };
        } catch(e) {
            debug.log('category_tag_lists error', e);
            return {};
        }
    }

    fastify.get('/pet-qa', async (req, res) => {
        let cachedTemplate = await cacheFile("petqa.mhtml", "");
        if(cachedTemplate.success){
            res.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
        let lists = await category_tag_lists(domain);
        let dog_category_list = lists['dog_category_list'];
        let cat_category_list = lists['cat_category_list'];
        let category_map = lists['category_map'];
        let dog_category_map = lists['dog_category_map'];
        let cat_category_map = lists['cat_category_map'];
        let dog_tag_list = lists['dog_tag_list'];
        let dog_tag_map = lists['dog_tag_map'];
        let cat_tag_list = lists['cat_tag_list'];
        let cat_tag_map = lists['cat_tag_map'];

        let dog_list = await (await (fetch(domain + '/wp/v2/qanda?categories=' + category_map['dog'] + '&per_page=5&orderby=date&order=desc'))).json();
        
        let html_meta_title = htmlMeta('title', 'qa-list');
        let html_meta_keyword = htmlMeta('keyword', 'qa-list');
        let html_meta_description = htmlMeta('description', 'qa-list');
        let html_meta_follow = htmlMeta('follow', 'qa-list');  
        
        let { header, footer } = generateCommonTemplate([], 
        [
            '/components/wordpress/qa-search.mhtml' 
        ], {
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description,
            html_meta_follow: html_meta_follow
            
        }, {
            wordpressVersion: jsVersionFile.wordpress,
        });

        dog_list = dog_list.map((item) => {
            item.tag = item.tags.length > 0 ? dog_tag_map[item.tags[0].toString()] : '';
            item.category = item.categories.length > 1 ? dog_category_map[item.categories[1].toString()] : dog_category_map[item.categories[0].toString()];
            return item;
        });
        let cat_list = await (await (fetch(domain + '/wp/v2/qanda?categories=' + category_map['cat'] + '&per_page=5&orderby=date&order=desc'))).json();
        cat_list = cat_list.map((item) => {
            item.tag = item.tags.length > 0 ? cat_tag_map[item.tags[0].toString()] : '';
            item.category = item.categories.length > 1 ? cat_category_map[item.categories[1].toString()] : cat_category_map[item.categories[0].toString()];
            return item;
        });
        var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/qa-list.mhtml', 'utf8');
        
        dog_tag_list = dog_tag_list.filter((item) => item.count > 0);
        cat_tag_list = cat_tag_list.filter((item) => item.count > 0);
        
        // for (const e of [].concat(cat_list, dog_list)) {
        //     if(e.featured_media != 0 ){
        //         let feature = await (await (fetch(domain + '/wp/v2/media/' + e.featured_media))).json()
        //         e['featured_media_rendered'] = (feature.media_details.sizes.shop_single.source_url)
        //         console.log(e['featured_media_rendered'])
        //     }
        //     else{
        //         e['featured_media_rendered'] = '';
        //     }
        //     e['date'] = e['date'].substr(0, 10);
        // }

        let dog_cat_list = [].concat(cat_list, dog_list);
        let fm_list = [];
        for (const e of [].concat(cat_list, dog_list)) {
            //let feature = await (await (fetch(domain + '/wp/v2/media/' + e.featured_media))).json();
            if(e.featured_media == 0 ){
                e['featured_media_rendered'] = '';
            }
            e['date'] = e['date'].substr(0, 10);
        }
        dog_cat_list.forEach(function(dc){
            if(dc.featured_media != 0) {
                fm_list.push(dc.featured_media);
            }
        });
        let features = await (await (fetch(domain + '/wp/v2/media?include=' + fm_list.join() + "&per_page=99"))).json();
        features.forEach(function(feature){
            let dog_fm_index = dog_list.findIndex(r => r.featured_media == feature.id); 
            let cat_fm_index = cat_list.findIndex(r => r.featured_media == feature.id);
            if(dog_fm_index > -1){
                dog_list[dog_fm_index]['featured_media_rendered'] = feature.media_details.sizes.shop_single.source_url;
            }
            if(cat_fm_index > -1){
                cat_list[cat_fm_index]['featured_media_rendered'] = feature.media_details.sizes.shop_single.source_url;
            }
        });
        var data = {
            header: header,
            footer: footer,
            dog_list: dog_list,
            cat_list: cat_list,
            test_dog_list: JSON.stringify(dog_list),
            test_cat_list: JSON.stringify(cat_list),
            dog_category_list: dog_category_list,
            cat_category_list: cat_category_list,
            test_dog_tag_list: JSON.stringify(dog_tag_list),
            test_cat_tag_list: JSON.stringify(cat_tag_list),
            dog_tag_list: dog_tag_list,
            cat_tag_list: cat_tag_list,
            html_meta_h1: '',
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description
        }
        var content = Mustache.render(template, data);
        await cacheFile("petqa.mhtml", content);
        res.status(200).header('Content-Type', 'text/html').send(content);
    });

    fastify.get('/pet-qa/:slug', async (req, res) => {
        
        let cachedTemplate = await cacheFile("petqa." + req.params.slug + ".mhtml", "");
        if(cachedTemplate.success){
            res.status(200).header('Content-Type', 'text/html').send(cachedTemplate.contents)
            return;
        }
        let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined" ? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url;
        let lists = await category_tag_lists(domain);
        debug.log('lists', lists);
        let category_map = lists['category_map'];
        let dog_category_map = lists['dog_category_map'];
        let cat_category_map = lists['cat_category_map'];
        let dog_category_list = lists['dog_category_list'];
        let cat_category_list = lists['cat_category_list'];
        let dog_tag_list = lists['dog_tag_list'];
        let cat_tag_list = lists['cat_tag_list'];

        let qa_content = await (await (fetch(domain + '/wp/v2/qanda?slug=' + encodeURI(req.params.slug)))).json();
        var template = fs.readFileSync(JSON.parse(process.env.MISC).mustache_dir + '/qa.mhtml', 'utf8');

        //console.log("qa_content: " + JSON.stringify(qa_content))

        let media = qa_content[0].featured_media == 0 ? '' : await (await (fetch(domain + '/wp/v2/media/' + qa_content[0].featured_media))).json();

        let featured_media = (media == '') ? '' : media.media_details.sizes.full.source_url

        let qa_prev = null;
        try {
            qa_next = await (await (fetch(domain + '/wp/v2/qanda?before=' + qa_content[0].date + '&orderby=date&order=desc&perpage=1'))).json();
            qa_next = qa_next.length > 0 ? qa_next[0] : null;
        } catch(e) {}
        
        let qa_next = null;
        try {
            qa_prev = await (await (fetch(domain + '/wp/v2/qanda?after=' + qa_content[0].date + '&orderby=date&order=asc&perpage=1'))).json();
            qa_prev = qa_prev.length > 0 ? qa_prev[0] : null;
        } catch(e) {}
        
        // https://vdev.impactm.net/b2c/wp-json/wp/v2/qanda?before=2021-01-26T14:16:31&orderby=date&order=desc&perpage=1
        // https://vdev.impactm.net/b2c/wp-json/wp/v2/qanda?after=2021-01-26T14:16:31&orderby=date&order=asc&perpage=1

        let tag_ids = qa_content[0].tags.join();
        let tags = await (await (fetch(domain + '/wp/v2/tags?include=' + tag_ids))).json();
        tags.forEach(t => t.type = t.slug.startsWith('cat') ? 'cat': 'dog');

        let category = qa_content[0].categories.length > 1 ? dog_category_map[qa_content[0].categories[1].toString()] || cat_category_map[qa_content[0].categories[1].toString()] : dog_category_map[qa_content[0].categories[0].toString()] || cat_category_map[qa_content[0].categories[0].toString()];

        // https://vdev.impactm.net/b2c/wp-json/wp/v2/tags?include=311,305,308&perpage=100

        let html_meta_title = qa_content[0].html_meta_title;
        let html_meta_keyword = qa_content[0].html_meta_keyword;
        let html_meta_description = qa_content[0].html_meta_description;
        let html_meta_follow = qa_content[0].html_meta_follow == undefined ? "index, follow": qa_content[0].html_meta_follow;

        qa_content[0].date = qa_content[0].date.substr(0, 10);
        let { header, footer } = generateCommonTemplate([
            '/components/account/account.mhtml'
        ], [
            
        ], {
            accountVersion: jsVersionFile.account,
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description,
            html_meta_follow: html_meta_follow
        }, {

        });
        let data = {
            header: header,
            footer: footer,
            qa_content: qa_content[0],
            qa_prev: qa_prev,
            qa_next: qa_next,
            tags: tags,
            category: category,
            featured_media: featured_media,
            dog_category_list: dog_category_list,
            cat_category_list: cat_category_list,
            dog_tag_list: dog_tag_list,
            cat_tag_list: cat_tag_list,
            html_meta_title: html_meta_title,
            html_meta_keyword: html_meta_keyword,
            html_meta_description: html_meta_description
        }
        var content = Mustache.render(template, data);
        
        await cacheFile("petqa." + req.params.slug + ".mhtml", content);
        res.status(200).header('Content-Type', 'text/html').send(content);
    });
    
    /***************UI ROUTES*****************/
    
    /************* API ROUTES *******************/
    async function campaignEndpoint(req, res) {
        try{
            let domain = typeof JSON.parse(process.env.MISC).wordpress_url === "undefined"? "https://vdev.impactm.net/b2c/wp-json" : JSON.parse(process.env.MISC).wordpress_url
            let post_content = await(await(fetch(domain+ '/wp/v2/timesale?slug=' + req.params.slug))).json();
            let index = 0;

            let start_date = new Date(post_content[index].meta._ts_start_datetime);
            let end_date = new Date(post_content[index].meta._ts_end_datetime);
            let current_date = new Date;

            if(start_date.getTime() > current_date.getTime()){
                throw "Invalid date";
            }

            if(current_date.getTime() > end_date.getTime()){
                post_content[index].content.rendered = post_content[index].excerpt.rendered
            }
            
            let page_content = {
                title: post_content[index].meta._ts_page_title,
                content: post_content[index].content.rendered,
                next_page: null,
                previous_page: null
            }

            var template = readFileSync('/usr/share/nginx/tsale_mustache/' + post_content[index].slug + '.html', 'utf8');   
            var content = Mustache.render(template, page_content);
            res.status(200).header('Content-Type', 'text/html').send(content);

        } catch(e){
            console.error(e);
            throw "Not found";
        }
    }

    fastify.get('/qa-search', async (req, res) => {
        await generateQACategories();
        let domain = JSON.parse(process.env.MISC).wordpress_url;
        let query_string = "?";
        let fields = "_fields=id,slug,type,title,excerpt,featured_media,template,meta,categories,tags,date&per_page=6&page=" + (req.query.page? req.query.page : "1");
        let featured_media = [];
        let query_categories = [];
        let query_tags = [];
        let main_categories = JSON.parse(process.env.QACATEGORIES);
        if (typeof req.query.search != "undefined" && req.query.search) {
            query_string += "search=" + encodeURI(req.query.search) + "&";
        }
        if (typeof req.query.categories != "undefined" && req.query.categories) {
            query_categories = await (await (fetch(domain + '/wp/v2/categories?slug=' + req.query.categories))).json();
            query_string += query_string != "?"? "&" : "";
            query_string += "categories=";
            query_categories.forEach(function(qc){
                query_string += qc.id
            });
        }
        if (typeof req.query.tags != "undefined" && req.query.tags) {
            query_tags = await (await (fetch(domain + '/wp/v2/tags?slug=' + req.query.tags))).json();
            query_string += query_string != "?"? "&" : "";
            query_string += "tags=";
            query_tags.forEach(function(qc){
                query_string += qc.id + ",";
            });
        }
        let qa_list =  (await (fetch(domain + '/wp/v2/qanda' + query_string + (query_string != "?"? "&" : "") + fields)));
        let headers = qa_list.headers.raw();
        let total_query = parseInt(headers["x-wp-total"][0]);
        let total_pages = parseInt(headers["x-wp-totalpages"][0]);
        let category_list = await (await (fetch(domain + '/wp/v2/categories?per_page=100'))).json();
        let category_map = category_list.reduce((map, c) => { map[c.id.toString()] = {slug: c.slug, name: c.name}; return map }, {});
        qa_list = await qa_list.json();
        qa_list.forEach(function(qa, index) {
            qa_list[index].category = qa_list[index].categories.length > 1 ? category_map[qa_list[index].categories[1].toString()] : category_map[qa_list[index].categories[0].toString()];
        });
        qa_list.forEach(function(qa, index){
            qa_list[index].animal_type = qa.categories.findIndex(r => r == main_categories.cat) > -1? "cat" : qa.categories.findIndex(r => r == main_categories.dog) > -1? "dog" : "";
            featured_media.push(qa.featured_media);
        });

        let fm_list = await (await (fetch(domain + '/wp/v2/media?include=' + featured_media.join() + "&_fields=id,guid&per_page=99"))).json();
        qa_list.forEach(function(qa, index){
            qa_list[index].featured_media = fm_list.findIndex(r => r.id == qa.featured_media) > -1? fm_list[fm_list.findIndex(r => r.id == qa.featured_media)].guid.rendered : "";
            qa_list[index]['date'] = qa_list[index]['date'].substr(0, 10);
        });
        res.status(200).send({
            total_query: total_query,
            total_pages: total_pages,
            qa_list: qa_list
        });
    });

    fastify.get('/tsale/:slug', campaignEndpoint);
    fastify.get('/campaign/:slug', campaignEndpoint);

    /************* API ROUTES *******************/
}

module.exports = wordpressPlugin;