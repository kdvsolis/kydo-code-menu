import { cartService } from '/services/cart.service.js';
import { cookieService } from '/services/cookie.service.js';

let cart = {
    updateCartItem: async function(user_id, product_id, quantity, buylater=0, direction="+"){
        let cart_items = cookieService.getCookieValue('cart_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_items'))) : [];
        let cart_later_items = cookieService.getCookieValue('cart_later_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_later_items'))) : [];
        let cart_item_index = cart_items.findIndex(r => r.product_id == product_id);
        let cart_later_item_index = cart_later_items.findIndex(r => r.product_id == product_id);
        let new_quantity = cart_item_index > -1? cart_items[cart_item_index].quantity : cart_later_item_index > -1? cart_later_items[cart_later_item_index].quantity : 0;
        const data = {
            user_id: user_id,
            data: {
                product_id: product_id
            },
            quantity: direction != "r"? (new_quantity + (direction == "+"? quantity : -quantity)) : quantity,
            buylater: buylater
        };
        if(data.quantity <= 0)
            data.quantity = 0;
        await cartService.updateCart(data);
        return cookieService.getCookieValue('cart_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_items'))) : [];
    },
    updateCartSubscriptionItem: async function(user_id, product_id, quantity, frequency=30, buylater=0, direction="r"){
        console.log(cookieService.getCookieValue('cart_subscription'))
        let cart_subscription = cookieService.getCookieValue('cart_subscription') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_subscription'))) : [];
        let cart_subscription_index = cart_subscription.findIndex(r => r.product_id == product_id);
        let new_quantity = cart_subscription_index > -1? cart_subscription[cart_subscription_index].quantity : 0;
        const data = {
            user_id: user_id,
            data: {
                product_id: product_id
            },
            quantity: direction != "r"? (new_quantity + (direction == "+"? quantity : -quantity)) : quantity,
            buylater: buylater,
            frequency: frequency
        };
        if(data.quantity <= 0)
            data.quantity = 0;
        await cartService.updateCartSubscription(data);
        return cookieService.getCookieValue('cart_subscription') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_subscription'))) : [];
    },
    addToCartByParams: async function(productId, quantity){
        return cartService.addToCartByParams(productId, quantity);
    },
    deleteCartItem: async function(cart_id, product_id){
        let cart_items = cookieService.getCookieValue('cart_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_items'))) : [];
        let cart_item_index = cart_items.findIndex(r => r.product_id == product_id);
        if(cart_item_index < 0)
            return { deleted: "0" }
        const data = {
            cart_id: cart_id,
            product_id: product_id
        };
        return await cartService.deleteToCart(data);
    },
    deleteCartItemLater: async function(cart_id, product_id){
        let cart_items = cookieService.getCookieValue('cart_later_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_later_items'))) : [];
        let cart_item_index = cart_items.findIndex(r => r.product_id == product_id);
        if(cart_item_index < 0)
            return { deleted: "0" }
        const data = {
            cart_id: cart_id,
            product_id: product_id
        };
        return await cartService.deleteToCartLater(data);
    },
    getCartContents: function(){
        return cookieService.getCookieValue('cart_items') != ''? JSON.parse(decodeURIComponent(cookieService.getCookieValue('cart_items'))) : [];
    },
    getCartDetails: function(){
        return cartService.getCartDetails();
    },
    getTotalCartQuantity: function(){
        let cart_items = (cookieService.getCookieValue("cart_items") == "" ? [] : JSON.parse(unescape(cookieService.getCookieValue("cart_items"))));
        return cart_items.reduce(function (a, b) { return parseInt(b.quantity) + parseInt(a) }, 0);
    },
    reloadCartUpperWidget: function(){
        let cart_contents = cart.getCartContents();
        let total_quantity = parseFloat(cart_contents.reduce(function (a, b) { return parseFloat(b.quantity) + a }, 0));
        document.querySelectorAll(".cart-qty-badge").forEach(e=>{e.innerHTML = total_quantity == 0? "" : total_quantity})
    },
    clearCart: async function(){
        return await cartService.clearCart();
    },
    //To change this portion according to mustache template
    modalParams: function(modal, message, button1, button2){           
        document.getElementById(message.eId).innerHTML = message.value 
        document.getElementById(button1.eId).innerHTML = button1.value;
        if(document.getElementById(button1.eId).attr && typeof document.getElementById(button1.eId).attr !== 'undefined'){
            document.getElementById(button1.eId).setAttribute("href", document.getElementById(button1.eId).attr)
        }
        document.getElementById(button2.eId).innerHTML = button2.value;
        if(document.getElementById(button2.eId).attr && typeof document.getElementById(button2.eId).attr !== 'undefined'){
            document.getElementById(button2.eId).setAttribute("href", document.getElementById(button2.eId).attr)
        }
        $(modal).modal('show');
    }
}
export { cart };