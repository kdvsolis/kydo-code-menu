import { cookieService } from '/services/cookie.service.js';
import { cart } from '../components/cart/cart.js';

var accountService = {
    userInfo: async function () {
        try {
            if (cookieService.getCookieValue('token') == "") {
                return { success: false };
            }
            let user_token = cookieService.getCookieValue('token');
            let response = (await fetch('/get-user', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer'
            }));
            if (response.status === 200) {
                let ret = response.json();
                // if (ret.user_meta.findIndex('_v_cancel_reason') != -1) {
                //     return { success: false };
                // }
                return ret;
            }
            else if (response.status !== 200) {
                return { success: false };
            }
        } catch (error) {
            return { success: false };
        }

    },
    modifyInfo: async function (user_id, data) {
        try {
            let user_token = cookieService.getCookieValue('token');
            let response = await (await fetch('/my-account/' + user_id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            })).json();
            return response;

        } catch (e) {
            return { success: false };
        }
    },
    orderHistoryCarousel: async function () {
        try {
            let response = (await fetch('/orders/recent-orders'));
            return await response.json();
        } catch (e) {
            return {
                success: false,
                product_list: []
            };
        }
    },
    //cancelUserAccount
    cancelUserAccount: async function (user_id, reason) {
        try {
            let user_token = cookieService.getCookieValue('token');
            let response = await (await fetch('/my-account/cancel/' + user_id, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + user_token
                },
                body: JSON.stringify({
                    key: "_v_cancel_reason",
                    value: reason == ""? "none" : reason
                })
            }));
            if (response.status == 200) {
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                message: 'caught error'
            };
        }
    },
    //reviews
    reviewList: async function (user_email) {
        try {
            let user_token = cookieService.getCookieValue('token');
            
            let response = await (await fetch('/get-user-reviews/'+user_email, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer'
            })).json().then(result);
            return {
                success: true,
                reviews: response
            };
        } catch (error) {
            console.log(error);
            return {
                success: false
            };
        }
    },
    updateReview: async function (review_id,updated_data) {
        try {
            let user_token = cookieService.getCookieValue('token');
            
            let response = await (await fetch('/update-review/'+review_id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: updated_data
            })).json().then(result);
            return {
                success: true,
                reviews: response
            };
        } catch (error) {
            console.log(error);
            return {
                success: false
            };
        }
    },
    checkPhone: async function (phone_number) {
        try {
            let response = await (await fetch('/auth/phone/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phonenumber: phone_number
                })
            }));
            if (response.status === 200) {
                return response.json();
            }
            else if (response.status !== 200) {
                return { success: false };
            }
        } catch (error) {
            console.log(error);
            return { success: false };
        }

    },
    generateTwilioCode: async function (user_number) {
        try {
            let response = await (await fetch('/generate-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                credentials: 'include',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({ phonenumber: user_number, channel: 'sms' })
            }));
            return response.json();
        } catch (error) {
            console.log(error);
        }
    },
    cancelTwilioCode: async function (twilio_sid) {
        try {
            let response = await (await fetch('/update-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                credentials: 'include',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({sid:twilio_sid})
            }));
            return response.json();
        } catch (error) {
            console.log(error);
        }

    },
    verifyTwilioCode: async function(user_number,user_code){
        try {
            let response = await (await fetch('/verify-code?phonenumber=' + user_number + '&code=' + user_code, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
         }));
         return response.json();
        } catch (error) {
            console.log(error);
        }
        
    },
    requestResetPassword: async function(data){
        try{
            let response = await (await fetch('/pwreset', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               redirect: 'follow',
               referrerPolicy: 'no-referrer',
               body: JSON.stringify(data)
            })).json();
            return { success: response.success };
        } catch(e){
            console.log(e);
            return { success: false };
        }
    },
    changePassword: async function(data){
        try{
            let response = await (await fetch('/change-password', {
               method: 'POST',
               headers: {
               'Content-Type': 'application/json'
               },
               redirect: 'follow', 
               referrerPolicy: 'no-referrer',
               body: JSON.stringify(data)
            })).json();
            return { success: response.success };
        } catch(e){
            console.log(e);
            return { success: false };
        }
    },
    //modify subscription
    modifyProductSubscription: async function(subscription_id, meta){
        try {
            let user_token = cookieService.getCookieValue('token');
            const response = await (await fetch('/subscription/' + subscription_id, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer '+ user_token
                },
                body: JSON.stringify({
                    meta: meta
                })
            })).json();
            return { success: response.success };
        } catch(e){
          console.log(e);
          return { success: false };
        }
    },
    modifySubscriptionCreditCard: async function(subscription, token){
        try {
            let user_token = cookieService.getCookieValue('token');
            const cardUpdateResponse = await (await fetch('/subs-update-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({
                    token: token,
                    subscription_id: subscription.id
                })
            }));
            return { success: cardUpdateResponse.status == 200 };
        } catch(e){
            console.log(e);
            return { success: false };
        }
    },
    submitReview: async function (data) {
        try{
            let user_token = cookieService.getCookieValue('token');
            const response = await (await fetch('/products/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            })).json();
            return { success: response.success };
        } catch(e){
            return { success: false };
        }
    },
    validateB2C: async function (type,data) {
        try{
            let user_token = cookieService.getCookieValue('token');
            const response = await (await fetch('/validate-details/'+type, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user_token
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            })).json();
            return { success: response.success, message: response.message };
        } catch(e){
            return { success: false };
        }
    }
    //reviews list
}

export { accountService }