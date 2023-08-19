var productService = {
    getProduct: async function(slug){
        return (await(await fetch("/product-detail/" + slug)).json());
    },
    getProductBySKU: async function(sku){
        return (await(await fetch("/product-detail/" + sku + "?key=sku")).json());
    },
    getProductVariant: async function(product_id){
        return await (await fetch('/products/price/'+product_id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        })).json();
    },
    getProductsByCategory: async function(category_id){
        return await (await fetch("/products/category/" + category_id)).json();
    },
    getProductReviews: async function(prod_id, current_page){
        return await(await fetch('/review/' + prod_id + '/' + current_page)).json();
    },
    getCarouselProducts: async function(){
        console.log('im at service')
        return await (await fetch('/get-carousel-products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        })).json();
        
    }
}

export { productService }