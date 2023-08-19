import { checkoutService } from '/services/checkout.service.js';

let checkout = {
    coupon_code: '',
    coupons: [],
    cod_fee: 0,
    items: [],
    selected_coupon: -1,
    isPremiumUser: false,
    postcode: '',
    shipping_fee: 0,
    total_price: 0,
    tax_value: 0,
    final_price: 0,
    raw_price: 0,
    payment_method: "imogmopg",
    postage_name: '',
    coupon_applied: false,
    coupon_err_msg: null,
    getCoupons: async function (code, validate){
       return checkoutService.getCoupons(code, validate);
    },
    getPostal: async function(postal){
        return await checkoutService.getPostal(postal);
    },
    computePrice: async function(hasSelected){
        let product_found = false;    
        let coupon_code = checkout.coupon_code;
        let coupons = checkout.coupons;
        let cod_fee = checkout.cod_fee;
        let items = checkout.items;
        let selected_coupon = checkout.selected_coupon;
        let isPremiumUser = checkout.isPremiumUser;
        let shipping_fee = checkout.shipping_fee;
        let total_price = checkout.total_price;
        let tax_value = checkout.tax_value;
        let final_price = checkout.final_price;
        let postcode = checkout.postcode;
        let coupon_applied = false;
        checkout.coupon_err_msg = null
        checkout.coupon_applied = false;

        if(this.payment_method == "cod"){
            let raw_price = items.reduce(function(a,b){ return b.quantity * b.price + a }, 0);
            if (raw_price >= 1 && raw_price <= 9999)
               cod_fee = 300;
            else if (raw_price >= 10000 && raw_price <= 30000)
               cod_fee = 400;
            else if (raw_price >= 30001 && raw_price <= 100000)
               cod_fee = 600;
            else if (raw_price >= 100001 && raw_price <= 300000)
               cod_fee = 1000;
            final_price = raw_price;
        } else{
            cod_fee = 0;
        }

        if (hasSelected) {
            if (selected_coupon !== -1 && final_price >= (parseFloat(coupons[selected_coupon].min) || 0) && coupons[selected_coupon].count > 0) {
                let total_sub = 0;
                let total = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0))
                let total_quantity = parseFloat(items.reduce(function (a, b) { return b.quantity + a }, 0));
                let diff = 0;
                let category_found = false;
                let product_found_list = [];
                let raw_price = total;
                let isValid = true;
                let quantity = 0;

                items.forEach(function (item) {
                    //TODO: change display price here
                    //document.getElementById("item_price_" + item.cart_id).innerHTML = ((item.price * item.quantity)).toLocaleString() + "円";
                });
                if (coupons[selected_coupon].products.length != 0) {
                    //Apply coupon for selected product
                    items.forEach(function (item) {
                        if (coupons[selected_coupon].products.findIndex(row => row == item.id) > -1) {
                        total_sub += parseFloat(item.price) * item.quantity;
                        product_found = true;
                        product_found_list.push({ cart_id: item.cart_id, price: parseFloat(item.price) * item.quantity })
                        }
                    });
                    if (!product_found) {
                        isValid = false;
                        checkout.coupon_err_msg = 'クーポンが適用できる該当商品が入っていません。';
                    }
                } else if (coupons[selected_coupon].categories.length != 0) {
                    items.forEach(function (item) {
                        //Apply coupon for applicable category
                        for (var i = 0; i < item.categories.length; i++) {
                            if (coupons[selected_coupon].categories.findIndex(row => row == item.categories[i].id) > -1) {
                                total_sub += parseFloat(item.price) * item.quantity;
                                quantity += item.quantity;
                                category_found = true;
                                break;
                            }
                        }
                        if (!category_found) {
                            // isValid = false;
                            isValid = false;
                            checkout.coupon_err_msg = 'クーポンが適用できるカテゴリ商品が入っていません。';
                        } else {
                            if (quantity < (parseInt(coupons[selected_coupon].quantity) || 0)) {
                                isValid = false;
                                checkout.coupon_err_msg = 'クーポンが適用できるカテゴリ商品の数量を満たしていません。';
                            } else {
                                isValid = true;
                                return;
                            }
                        }
                    });
                }
                if (coupons[selected_coupon].expiry) {
                    if (new Date() > new Date(coupons[selected_coupon].expiry.date)) {
                        isValid = false;
                        checkout.coupon_err_msg = 'クーポンの有効期限が切れています。';
                    }
                }
                if (!isPremiumUser && coupons[selected_coupon].customer_type == "premium") {
                    isValid = false;
                    checkout.coupon_err_msg = 'このクーポンを使用できる権限がありません。';
                }
                if (coupons[selected_coupon].count <= 0) {
                    isValid = false;
                    checkout.coupon_err_msg = '先着順クーポンの使用できる上限数に達しました。';
                }
                if (coupons[selected_coupon].categories.length == 0 && (total_quantity < (parseInt(coupons[selected_coupon].quantity) || 0))) {
                    isValid = false;
                    checkout.coupon_err_msg = 'クーポンが適用できるカテゴリ商品の数量を満たしていません。';
                }

                if (!isValid) {
                    coupon_code = '';
                    let postage = (await checkoutService.getPostage({
                        postcode: postcode,
                        total: parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)),
                        samples: false
                    }));
                    shipping_fee = postage.cost;
                    checkout.postage_name = postage.name;
                    /*
                    Display error in this area
                    */
                    let total = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)) +
                    parseFloat(cod_fee) + parseFloat(shipping_fee);
                    tax_value = Math.round(total * 0.1);
                    final_price = total + tax_value;
                    //Display computed price here
                    checkout.shipping_fee = shipping_fee;
                    checkout.cod_fee = cod_fee;
                    checkout.tax_value = tax_value;
                    checkout.final_price = final_price;
                    checkout.raw_price = raw_price;
                    return {
                        shipping_fee: shipping_fee,
                        cod_fee: cod_fee,
                        tax_value: tax_value,
                        final_price: final_price,
                        raw_price: raw_price,
                        discount: coupon_applied? coupons[selected_coupon].amount : 0
                    };
                }
                if (total_sub > parseFloat(coupons[selected_coupon].amount)) {
                    diff = total - total_sub;
                }

                console.log('product_found:', product_found);
                console.log('category_found:', category_found);
                console.log('coupons[selected_coupon].categories:', coupons[selected_coupon].categories);
                console.log('coupons[selected_coupon].products:', coupons[selected_coupon].products);
                console.log('coupons[selected_coupon].min:', coupons[selected_coupon].min);
//{id: 30097, code: "LINE5690", description: "LINEクーポン9", product_group: "", customer_type: "none", …}
// amount: 0
// categories: []
// code: "LINE5690"
// count: 1
// customer_type: "none"
// description: "LINEクーポン9"
// expiry: {date: "2021-07-31 00:00:00.000000", timezone_type: 3, timezone: "Asia/Tokyo"}
// id: 30097
// min: ""
// product_group: ""
// products: []
// usecount: 0
// usemax: 1
// __proto__: Object
                // if (category_found && total_sub > (parseFloat(coupons[selected_coupon].amount) || 0)) {
                if (category_found || product_found || (coupons[selected_coupon].categories.length === 0 && coupons[selected_coupon].products.length == 0 && total >= (parseFloat(coupons[selected_coupon].min) || 0))) {
                    console.log('total', total);
                    console.log('total_sub', total_sub);
                    console.log('coupons[selected_coupon] 1:', coupons[selected_coupon]);
                    if (!category_found && !product_found) total_sub = total;
                    // diff = total - total_sub;
                    let postage = (await checkoutService.getPostage({
                        postcode: postcode,
                        total: total,
                        samples: false
                    }));
                    shipping_fee = postage.cost;
                    checkout.postage_name = postage.name;
                    if (total_sub < parseFloat(coupons[selected_coupon].amount)) {
                        coupons[selected_coupon].amount = total_sub;
                    }
                    console.log('coupons[selected_coupon] 2:', coupons[selected_coupon]);
                    total_sub -= parseFloat(coupons[selected_coupon].amount);
                    console.log('total', total);
                    console.log('total_sub', total_sub);
                    tax_value = Math.round((total_sub + parseFloat(cod_fee) + parseFloat(shipping_fee)) * 0.1);
                    final_price = (total_sub + parseFloat(cod_fee) + parseFloat(shipping_fee) + tax_value);
                    // tax_value = Math.round((total_sub + diff + parseFloat(cod_fee) + parseFloat(shipping_fee)) * 0.1);
                    // final_price = (total_sub + diff + parseFloat(cod_fee) + parseFloat(shipping_fee) + tax_value);
                    coupon_applied = true;
                    checkout.coupon_applied = coupon_applied;
                // } else if (product_found && total_sub >= (parseFloat(coupons[selected_coupon].amount) || 0)) { 
                //     if (total_sub >= parseFloat(coupons[selected_coupon].amount))
                //     diff = total - total_sub;
                //     let postage = (await checkoutService.getPostage({
                //         postcode: postcode,
                //         total: total_sub + diff,
                //         samples: false
                //     }));
                //     shipping_fee = postage.cost;
                //     checkout.postage_name = postage.name;
                //     total_sub -= parseFloat(coupons[selected_coupon].amount);
                //     tax_value = Math.round((total_sub + diff + parseFloat(cod_fee) + parseFloat(shipping_fee)) * 0.1);
                //     final_price = (total_sub + diff + parseFloat(cod_fee) + parseFloat(shipping_fee) + tax_value);
                //     product_found_list.forEach(function (product) {
                //         //change price for applicable products
                //     //document.getElementById("item_price_" + product.cart_id).innerHTML = (product.price - coupons[selected_coupon].amount) + "円";
                //     });
                //     coupon_applied = true;
                //     checkout.coupon_applied = true;
                // } else if (coupons[selected_coupon].categories.length === 0 && coupons[selected_coupon].products.length == 0 && total >= (parseFloat(coupons[selected_coupon].min) || 0)) { // total >= (parseFloat(coupons[selected_coupon].min) || 0)
                //     let postage = (await checkoutService.getPostage({
                //         postcode: postcode,
                //         total: total,
                //         samples: false
                //     }));
                //     shipping_fee = postage.cost;
                //     checkout.postage_name = postage.name;
                //     // total -= parseFloat(coupons[selected_coupon].amount);
                //     if (total_sub < parseFloat(coupons[selected_coupon].amount)) {
                //         coupons[selected_coupon].amount = total_sub;
                //     }
                //     total_sub -= parseFloat(coupons[selected_coupon].amount);                    
                //     tax_value = Math.round((total_sub + parseFloat(cod_fee) + parseFloat(shipping_fee)) * 0.1);
                //     final_price = (total_sub + parseFloat(cod_fee) + parseFloat(shipping_fee) + tax_value);
                //     coupon_applied = true;
                //     checkout.coupon_applied = true;
                } else {
                    coupon_code = '';
                    let total = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)) +
                    parseFloat(cod_fee) + parseFloat(shipping_fee);
                    tax_value = Math.round(total * 0.1);
                    final_price = total + tax_value;
                    /* 
                    Display error and reset price here
                    */
                    checkout.checkIfPaymentIsNotApplicable(final_price);

                    checkout.shipping_fee = shipping_fee;
                    checkout.cod_fee = cod_fee;
                    checkout.tax_value = tax_value;
                    checkout.final_price = final_price;

                    return {
                        shipping_fee: shipping_fee,
                        cod_fee: cod_fee,
                        tax_value: tax_value,
                        final_price: final_price,
                        raw_price: raw_price,
                        discount: coupon_applied? coupons[selected_coupon].amount : 0
                    };
                }
                if (final_price < 0) {
                    final_price = 0;
                    tax_value = 0;
                }
              /* 
              Display price here
              */
            } else {
                checkout.coupon_err_msg = '使用できる合計金額の条件を満たしていないか、所持していないクーポンです。';
                coupon_code = '';
                let postage = (await checkoutService.getPostage({
                    postcode: postcode,
                    total: parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)),
                    samples: false
                }));
                shipping_fee = postage.cost;
                checkout.postage_name = postage.name;
                /*
                Display error in this area
                */
                let total = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)) +
                    parseFloat(cod_fee) + parseFloat(shipping_fee);
                tax_value = Math.round(total * 0.1);
                final_price = total + tax_value;
                /* 
                Display reset price here
                */
            }
        } else {
            checkout.coupon_code = '';
            let raw_price = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0));
            let postage = (await checkoutService.getPostage({
                postcode: postcode,
                total: raw_price,
                samples: false
            }));
            shipping_fee = postage.cost;
            checkout.postage_name = postage.name;

            let total = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0)) +
                parseFloat(cod_fee) + parseFloat(shipping_fee);
            tax_value = Math.round(total * 0.1);
            final_price = total + tax_value;
            /* 
            Display price here
            */

        }
        if (!product_found)
           checkout.checkIfPaymentIsNotApplicable(final_price);
        
        checkout.shipping_fee = shipping_fee;
        checkout.cod_fee = cod_fee;
        checkout.tax_value = tax_value;
        checkout.final_price = final_price;
        checkout.raw_price = parseFloat(items.reduce(function (a, b) { return b.quantity * b.price + a }, 0));
        return {
            shipping_fee: shipping_fee,
            cod_fee: cod_fee,
            tax_value: tax_value,
            final_price: final_price,
            raw_price: checkout.raw_price,
            discount: coupon_applied? coupons[selected_coupon].amount : 0
        };
    },
    checkIfPaymentIsNotApplicable: async function(final_price) {
        if (parseFloat(final_price) == 0) {
            //Select payment method to na
           checkout.payment_method = "na";
           //Disallow change delivery date
           //document.getElementById("change-delivery-date").disabled = true;
        } else {
            //Allow change delivery date
            //document.getElementById("change-delivery-date").disabled = true;
            //Check if COD or imogmopg
            if(checkout.payment_method != "cod")
                checkout.payment_method = "imgmopg";
            // document.getElementById("payment_method_na").checked = "false";
        }
    },
    checkout: async function(data, cc_response, isPaidSample=false){
        let checkout_data = {
            customer_id: data.user_id,
            payment_method: data.payment_method,
            payment_method_title: data.payment_method_title,
            set_paid: false, //payment_method == "cod"? true : false,
            status: data.status,
            customer_note: data.customer_note,
            billing: data.billing,
            meta_data: [{
               key: "_v_delivery_date",
               value: data.del_date
            }, {
               key: "_v_delivery_time",
               value: data.del_time
            }, {
               key: data.sf_status,
               value: data.sf_date
            }, {
               key: "_v_user_agent",
               value: window.navigator.userAgent
            }],
            shipping: data.shipping,
            line_items: data.line_items,
            shipping_lines: [{
               method_id: "flat_rate",
               method_title: data.postage_name,
               total: data.shipping_fee + ''
            }],
            fee_lines: [{
               name: "代引手数料",
               tax_class: "",
               tax_status: "taxable",
               total: data.cod_fee + ''
            }]
        };
        console.log(checkout_data,isPaidSample,"--")
        
        checkout_data.coupon_lines = [];

        if (data.coupon_lines.length > 0) {
            checkout_data.coupon_lines = [];
            data.coupon_lines.forEach(function(coupon){
                checkout_data.coupon_lines.push({
                    code: coupon
                })
            })
        }

        if (data.timesale_coupons.length > 0) {
            data.timesale_coupons.forEach(function (ts_coupon) {
               checkout_data.coupon_lines.push(ts_coupon);
            });
         }
         if (data.timesale_slug != "") {
            checkout_data.meta_data.push({
               key: "_v_timesale_slug",
               value: data.timesale_slug
            })
        }
        if(data.payment_method != "cod")
            delete checkout_data.fee_lines;

        if(isPaidSample){
            checkout_data.meta_data.push({
                key: "_v_paid_sample",
                value: 1
            })
            checkout_data.fee_lines =  [{
                name: "配送・手数料",
                tax_class: "",
                tax_status: "taxable",
                total: "350",
                total_tax: "35"
            }]
        }
        return await checkoutService.createNewOrder(checkout_data.customer_id, checkout_data, cc_response);
    },
    checkoutSubscription: async function(data, cc_response){
        data.frequency = (!isNaN(data.frequency))? data.frequency : 30;
        var checkout_data = {
            customer_id: data.user_id,
            payment_method: data.payment_method,
            payment_method_title: data.payment_method_title,
            set_paid: false, //payment_method == "cod"? true : false,
            status: data.status,
            customer_note: data.customer_note,
            billing: data.billing,
            meta_data: [{
               key: "_v_delivery_date",
               value: data.del_date
            }, {
               key: "_v_delivery_time",
               value: data.del_time
            }, {
               key: data.sf_status,
               value: data.sf_date
            }, {
               key: "_v_user_agent",
               value: window.navigator.userAgent
            }, {
                key: "_v_subscription_flag",
                value: true
            }],
            shipping: data.shipping,
            line_items: data.line_items,
            shipping_lines: [{
               method_id: "flat_rate",
               method_title: data.postage_name,
               total: data.shipping_fee + ''
            }],
            fee_lines: [{
               name: "代引手数料",
               tax_class: "",
               tax_status: "taxable",
               total: data.cod_fee + ''
            }],
         };

        if (data.coupon_lines.length > 0) {
            checkout_data.coupon_lines = [];
            data.coupon_lines.forEach(function(coupon){
                checkout_data.coupon_lines.push({
                    code: coupon
                })
            })
        }

         if (data.timesale_slug != "") {
            checkout_data.meta_data.push({
               key: "_v_timesale_slug",
               value: data.timesale_slug
            })
        }
        if(data.payment_method != "cod")
            delete checkout_data.fee_lines;
        return await checkoutService.createNewSubscription(checkout_data.customer_id, checkout_data, cc_response, data.del_date, data.del_time, data.frequency);
    }
}
export { checkout };