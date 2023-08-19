import { cookieService } from '/services/cookie.service.js';

var cartService = {
    updateCart: async function(data){
        return await (await fetch('/cart/update', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        })).json();
    },
    updateCartSubscription: async function(data){
        return await (await fetch('/cart-subscription/update', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        })).json();
    },
    addToCartByParams: async function(productId, quantity=1){
        return await (await fetch('/json-add-to-cart?add-to-cart=' + productId + "&quantity=" + quantity)).json();
    },
    deleteToCart: async function(data){
        return await (await fetch('/cart/' + data.cart_id, {
            method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                product_id: data.product_id
            })
        })).json();
    },
    deleteToCartLater: async function(data){
        return await (await fetch('/cart-later/' + data.cart_id, {
            method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                product_id: data.product_id
            })
        })).json();
    },
    clearCart: async function(){
        let user_token = cookieService.getCookieValue('token');
        var response = await fetch('/cart/all', {
            method: 'DELETE',
            body: '{}',
            headers: {
            'Authorization': 'Bearer ' + user_token
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        });
        response = await response.json();
        return { success: response.deleted != null };
    },
    getCartDetails: async function(){
        return await (await fetch('/cart-details', {
            method: 'GET'
        })).json();
    },
}

export { cartService }