const fs = require('fs');
const path = require('path');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const RedisServer = require('redis-server');
const gitlog = require("gitlog").default;

const env = 
        fs.existsSync('./config/config.prod.json')? "prod" : 
        fs.existsSync('./config/config.development.json')? "development" :
        fs.existsSync('./config/config.uat.json')? "uat" :
        "local";
var config 
var envConfig
var jsVersionFile

try {
    if (env === 'production' || env === 'prod'){
        config = require('./config.prod.json');
    } else if (env === 'development'){
        config = require('./config.development.json');
    }  else if (env === 'uat'){
        config = require('./config.uat.json');
    } 
    else {
        config = require('./config.json');
    }
    
    envConfig = config[env];
    Object.keys(envConfig).forEach((key) => {
         process.env[key] = ((typeof envConfig[key] === 'object')? JSON.stringify(envConfig[key]) : envConfig[key]);
    });
    const server = new RedisServer(6379);
 
    const options = {
        repo: __dirname,
        number: 1,
        execOptions: { maxBuffer: 1000 * 1024 },
      };
    
    if(fs.existsSync(path.join(__dirname, "../templates/js-version.json"))){
        try{
            const commits = gitlog(options);
            let fileChanges = commits[0].files;
            jsVersionFile = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/js-version.json")));
            if(!jsVersionFile.authorDate && jsVersionFile.authorDate != commits[0].authorDate){
                if(fileChanges.findIndex(r => r.includes("account.js")) > -1)
                    (parseFloat(++jsVersionFile.account)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("cart.js")) > -1)
                    (parseFloat(++jsVersionFile.cart)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("checkout.js")) > -1)
                    (parseFloat(++jsVersionFile.checkout)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("product.js")) > -1)
                    (parseFloat(++jsVersionFile.product)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("wordpress.js")) > -1)
                    (parseFloat(++jsVersionFile.wordpress)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("account.service.js")) > -1)
                    (parseFloat(++jsVersionFile.accountService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("auth.service.js")) > -1)
                    (parseFloat(++jsVersionFile.authService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("cart.service.js")) > -1)
                    (parseFloat(++jsVersionFile.cartService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("checkout.service.js")) > -1)
                    (parseFloat(++jsVersionFile.checkoutService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("cookie.service.js")) > -1)
                    (parseFloat(++jsVersionFile.cookieService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("product.service.js")) > -1)
                    (parseFloat(++jsVersionFile.productService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("salesforce.service.js")) > -1)
                    (parseFloat(++jsVersionFile.salesforceService)).toFixed(1);
                if(fileChanges.findIndex(r => r.includes("wordpress.service.js")) > -1)
                    (parseFloat(++jsVersionFile.wordpressService)).toFixed(1);
                jsVersionFile.date = commits[0].authorDate;
            }

            fs.writeFileSync(path.join(__dirname, "../templates/js-version.json"), JSON.stringify(jsVersionFile))
        } catch(e){
            console.log(e)
        }
    } else{
        jsVersionFile = {
            "account": 1,
            "cart": 1,
            "checkout": 1,
            "product": 1,
            "wordpress": 1,
            "accountService": 1,
            "authService": 1,
            "cartService": 1,
            "checkoutService": 1,
            "cookieService": 1,
            "productService": 1,
            "salesforceService": 1,
            "wordpressService": 1,
            "authorDate": '2021-06-10 18:46:30 +0800'
        }
        fs.writeFileSync(path.join(__dirname, "../templates/js-version.json"), JSON.stringify(jsVersionFile))
    }

    server.open((err) => {
        if (err === null) {
        }
    });

 
} catch(e) {
    console.log(e);
    
    console.log('Error: Could not find configuration file. Please create config.json file, base it from config.json.example');
    process.exit(1);
}

const wooApi = new WooCommerceRestApi(JSON.parse(process.env.WC_CREDS));
const twilioClient = require('twilio')(JSON.parse(process.env.TWILIO).accountSid, JSON.parse(process.env.TWILIO).authToken);

async function generateCategories(){            
    if(typeof process.env["CATEGORIES"] == "undefined"){
        let all_normal_categories = (await wooApi.get("products/categories?search=normal&per_page=99")).data;
        let all_premium_categories = (await wooApi.get("products/categories?search=premium&per_page=99")).data;
        let all_sample_categories = (await wooApi.get("products/categories?search=sample&per_page=99")).data;

        let normal_health_cat = all_normal_categories.findIndex(r => r.slug == "normal-health-cat");
        let normal_dental_cat  = all_normal_categories.findIndex(r => r.slug == "normal-dental-cat");
        let normal_supplement_cat  = all_normal_categories.findIndex(r => r.slug == "normal-supplement-cat");
        let normal_skincare_cat  = all_normal_categories.findIndex(r => r.slug == "normal-skincare-cat");
        let normal_feliway  = all_normal_categories.findIndex(r => r.slug == "normal-feliway");
        let normal_snack_cat  = all_normal_categories.findIndex(r => r.slug == "normal-snack-cat");

        let normal_health_dog = all_normal_categories.findIndex(r => r.slug == "normal-health-dog");
        let normal_dental_dog  = all_normal_categories.findIndex(r => r.slug == "normal-dental-dog");
        let normal_supplement_dog  = all_normal_categories.findIndex(r => r.slug == "normal-supplement-dog");
        let normal_skincare_dog  = all_normal_categories.findIndex(r => r.slug == "normal-skincare-dog");
        let normal_snack_dog  = all_normal_categories.findIndex(r => r.slug == "normal-snack-dog");

        let premium_health_cat = all_premium_categories.findIndex(r => r.slug == "premium-health-cat");
        let premium_care_cat = all_premium_categories.findIndex(r => r.slug == "premium-care-cat");
        let premium_dental_cat  = all_premium_categories.findIndex(r => r.slug == "premium-dental-cat");
        let premium_supplement_cat  = all_premium_categories.findIndex(r => r.slug == "premium-supplement-cat");
        let premium_skincare_cat  = all_premium_categories.findIndex(r => r.slug == "premium-skincare-cat");
        let premium_feliway  = all_premium_categories.findIndex(r => r.slug == "premium-feliway");
        let premium_snack_cat  = all_premium_categories.findIndex(r => r.slug == "premium-snack-cat");

        let premium_health_dog = all_premium_categories.findIndex(r => r.slug == "premium-health-dog");
        let premium_care_dog = all_premium_categories.findIndex(r => r.slug == "premium-care-dog");
        let premium_dental_dog  = all_premium_categories.findIndex(r => r.slug == "premium-dental-dog");
        let premium_supplement_dog  = all_premium_categories.findIndex(r => r.slug == "premium-supplement-dog");
        let premium_skincare_dog  = all_premium_categories.findIndex(r => r.slug == "premium-skincare-dog");
        let premium_snack_dog  = all_premium_categories.findIndex(r => r.slug == "premium-snack-dog");
        
        let sample_dental_cat = all_sample_categories.findIndex(r => r.slug == "sample-dental-cat");
        let sample_health_cat = all_sample_categories.findIndex(r => r.slug == "sample-health-cat");
        let sample_feliway = all_sample_categories.findIndex(r => r.slug == "sample-feliway");
        let sample_dental_dog = all_sample_categories.findIndex(r => r.slug == "sample-dental-dog");
        let sample_health_dog = all_sample_categories.findIndex(r => r.slug == "sample-health-dog");
    
        process.env["CATEGORIES"] = JSON.stringify({

            normal_health_cat: all_normal_categories[normal_health_cat].id,
            normal_dental_cat: all_normal_categories[normal_dental_cat].id,
            normal_supplement_cat: all_normal_categories[normal_supplement_cat].id,
            normal_skincare_cat: all_normal_categories[normal_skincare_cat].id,
            normal_feliway: all_normal_categories[normal_feliway].id,
            normal_snack_cat: all_normal_categories[normal_snack_cat].id,

            normal_health_dog: all_normal_categories[normal_health_dog].id,
            normal_dental_dog: all_normal_categories[normal_dental_dog].id,
            normal_supplement_dog: all_normal_categories[normal_supplement_dog].id,
            normal_skincare_dog: all_normal_categories[normal_skincare_dog].id,
            normal_snack_dog: all_normal_categories[normal_snack_dog].id,

            premium_health_cat: all_premium_categories[premium_health_cat].id,
            premium_care_cat: all_premium_categories[premium_care_cat].id,
            premium_dental_cat: all_premium_categories[premium_dental_cat].id,
            premium_supplement_cat: all_premium_categories[premium_supplement_cat].id,
            premium_skincare_cat: all_premium_categories[premium_skincare_cat].id,
            premium_feliway: all_premium_categories[premium_feliway].id,
            premium_snack_cat: all_premium_categories[premium_snack_cat].id,

            premium_health_dog: all_premium_categories[premium_health_dog].id,
            premium_care_dog: all_premium_categories[premium_care_dog].id,
            premium_dental_dog: all_premium_categories[premium_dental_dog].id,
            premium_supplement_dog: all_premium_categories[premium_supplement_dog].id,
            premium_skincare_dog: all_premium_categories[premium_skincare_dog].id,
            premium_snack_dog: all_premium_categories[premium_snack_dog].id,

            sample_health_cat: all_sample_categories[sample_health_cat].id,
            sample_dental_cat: all_sample_categories[sample_dental_cat].id,
            sample_feliway: all_sample_categories[sample_feliway].id,
            sample_dental_dog: all_sample_categories[sample_dental_dog].id,
            sample_health_dog: all_sample_categories[sample_health_dog].id,
        });
        console.log("Categories Loaded!");
    }
};

// DEPRECATED: DO NOT USE!!!
async function generateTags(){            
    if(typeof process.env["TAGS"] == "undefined"){

        let all_cat_data = (await wooApi.get("products/tags?search=cat-&per_page=99")).data;
        let all_dog_data = (await wooApi.get("products/tags?search=dog-&per_page=99")).data;
        
        let cat_neutered = all_cat_data.findIndex(r => r.slug == "cat-neutered");
        let cat_weight =  all_cat_data.findIndex(r => r.slug == "cat-weight" );
        let cat_kidneysupport =  all_cat_data.findIndex(r  =>  r.slug == "cat-kidneysupport");
        let cat_renalsupport =  all_cat_data.findIndex(r  =>  r.slug == "cat-renalsupport" );
        let cat_dental =  all_cat_data.findIndex(r  =>  r.slug == "cat-dental" );
        let cat_anshin =  all_cat_data.findIndex(r  =>  r.slug == "cat-anshin" );
        
        let dog_neutered = all_dog_data.findIndex(r => r.slug == "dog-neutered");
        let dog_care = all_dog_data.findIndex(r => r.slug == "dog-care");
        let dog_weight = all_dog_data.findIndex(r => r.slug == "dog-weight");
        let dog_kidney = all_dog_data.findIndex(r => r.slug == "dog-kidney");
        let dog_digestion = all_dog_data.findIndex(r => r.slug == "dog-digestion");
        let dog_allergy = all_dog_data.findIndex(r => r.slug == "dog-allergy");
        let dog_skin = all_dog_data.findIndex(r => r.slug == "dog-skin");
        let dog_renalsupport = all_dog_data.findIndex(r  => r.slug == "dog-renalsupport");
        let dog_dental = all_dog_data.findIndex(r => r.slug == "dog-dental");

        process.env["TAGS"] = JSON.stringify({

            cat_neutered: all_cat_data[cat_neutered].id,
            cat_weight: all_cat_data[cat_weight].id,
            cat_kidneysupport: all_cat_data[cat_kidneysupport].id,
            cat_renalsupport: all_cat_data[cat_renalsupport].id,
            cat_dental: all_cat_data[cat_dental].id,
            cat_anshin: all_cat_data[cat_anshin].id,

            dog_neutered: all_dog_data[dog_neutered].id,
            dog_care: all_dog_data[dog_care].id,
            dog_weight: all_dog_data[dog_weight].id,
            dog_kidney: all_dog_data[dog_kidney].id,
            dog_digestion: all_dog_data[dog_digestion].id,
            dog_allergy: all_dog_data[dog_allergy].id,
            dog_skin: all_dog_data[dog_skin].id,
            dog_renalsupport: all_dog_data[dog_renalsupport].id,
            dog_dental: all_dog_data[dog_dental].id,
        });
        console.log("Tags Loaded!");
    }
};
async function generateQACategories(){           
    if(typeof process.env["QACATEGORIES"] == "undefined"){
        let domain = JSON.parse(process.env.MISC).wordpress_url;
        let qa_categories = await (await (fetch(domain + '/wp/v2/categories?slug=cat,dog'))).json();
        let qa_cat_index = qa_categories.findIndex(r => r.slug == 'cat');
        let qa_dog_index = qa_categories.findIndex(r => r.slug == 'dog');
        let category_json = {};
        if(qa_dog_index > -1){
            category_json.cat = qa_categories[qa_cat_index].id;
        }
        if(qa_dog_index > -1){
            category_json.dog = qa_categories[qa_dog_index].id;
        }
        process.env["QACATEGORIES"] = JSON.stringify(category_json);
    }       
};
async function generateQATags(){      
    if(typeof process.env["QATAGS"] == "undefined"){
        process.env["QATAGS"] = JSON.stringify({
        });
    }
};
module.exports = { config, env, wooApi, twilioClient, jsVersionFile, generateCategories, generateTags, generateQACategories, generateQATags };