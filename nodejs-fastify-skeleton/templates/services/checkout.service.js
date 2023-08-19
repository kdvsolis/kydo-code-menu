import { cookieService } from '/services/cookie.service.js';

var checkoutService = {
    paymentMethod: 'imgmopg',
    getCoupons: async function (code, validate){
        let query_params = "";
        if(typeof code !== "undefined" && code)
            query_params += query_params == ""? "?code=" + code.toUpperCase() : "&code=" + code.toUpperCase();
        if(typeof validate !== "undefined" && validate)
            query_params += query_params == ""? "?validate=" + validate : "&validate=" + validate;
        return (await(await fetch("/coupons" + query_params)).json());
    },
    createNewOrder: async function(user_id, data, cc_response){
        try{
            let user_token = cookieService.getCookieValue('token');
            let order_response = await (await fetch('/orders/new/' + user_id, {
                method: 'POST',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({
                    data: data,
                    cc_response: cc_response
                 })
            })).json();
            return order_response;
        } catch(e){
            return { success: false }
        }
    },
    createNewSubscription: async function(user_id, data, cc_response, del_date, del_time, frequency){
        try{
            let user_token = cookieService.getCookieValue('token');
            let order_response = await (await fetch('/orders-subscription/new/' + user_id, {
                method: 'POST',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({
                    data: data,
                    cc_response: cc_response,
                    del_date: del_date,
                    del_time: del_time,
                    frequency: frequency
                 })
            })).json();
            return order_response;
        } catch(e){
            return { success: false }
        }
    },
    getPostage: async function(data){
        try{
            let postage_response = await (await fetch('/postage', {
                method: 'POST',
                headers: {
                   'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            })).json(); 
            return postage_response; 
        } catch(e){
            return { success: false }
        }
    },
    getPostal: async function(postal){
        try{
            const response = await (await fetch('/checkout/address/' + postal)).json();
            return {
                success: true,
                response: response
            }
        } catch(e){
            console.error(e);
            return {
                success: false
            }
        }
    }
}

export { checkoutService }