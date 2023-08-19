import { productService } from '/services/product.service.js';
import { cookieService } from '/services/cookie.service.js';
import { account } from '/components/account/account.js';
import { accountService } from '../../services/account.service.js';

let product = {
    getProduct: async function (slug) {
        return await productService.getProduct(slug);
    },
    getProductBySKU: async function (sku) {
        return await productService.getProductBySKU(sku);
    },
    getProductVariant: async function (product_id) {
        return await productService.getProductVariant(product_id);
    },
    getProductsByCategory: async function (category_id) {
        return await productService.getProductsByCategory(category_id);
    },
    getProductReviews: async function (prod_id, current_page) {
        return await productService.getProductReviews(prod_id, current_page);
    },
    stockAvailability: async function (slug) {
        let product_data = await product.getProduct(slug);

        let stock_status = product_data.product.stock_status;
        let product_stock_date =
            (
                product_data.product.meta_data.findIndex(r => r.key == "_im_product_stock_date") > -1
                &&
                product_data.product.meta_data[product_data.product.meta_data.findIndex(r => r.key == "_im_product_stock_date")].value !== ''
            )
                ?
                product_data.product.meta_data[product_data.product.meta_data.findIndex(r => r.key == "_im_product_stock_date")].value
                :
                '';



        switch (stock_status) {
            case 'instock':
                //selects element of product that shows stock status
                // value of that === yes or あり
                document.querySelector('.stock_availability').innerHTML = 'あり';
                break;
            case 'outofstock':
                //if _
                document.querySelector('.stock_availability').innerHTML = product_stock_date ? product_stock_date : 'なし';
                break;

        }
    },
    setCheckedCookies: async function (product) {
        let checked_cookies = await cookieService.getCookieValue('checked_products')
        console.log(typeof checked_cookies, checked_cookies)
        let checked_products = checked_cookies === '' || checked_cookies == null? [] : JSON.parse(decodeURIComponent(checked_cookies));
        console.log('test', checked_products)
        
        if(checked_products.findIndex(r => r.id == product.id )< 0) {
            if(checked_products.length == 12) {
                checked_products.splice(0, 1);
            }
            checked_products.unshift(product)
        }
        cookieService.setCookie('checked_products', encodeURIComponent(JSON.stringify(checked_products)), 7)
    },
    checkedProducts_carousel: async function () {
        let cookie = cookieService.getCookieValue('checked_products');
        let cookieProducts = cookie != '' ? JSON.parse(decodeURIComponent(cookie)) : [];


        if (cookieProducts.length !== 0) {

            //IN CASE ITS NEEDED
            let list = product.makeCarouselList(cookieProducts, 'js-itemList--history');
            if (document.querySelector('.carousel--history')) {
                document.querySelector('.carousel--history').appendChild(list);
            }
            return cookieProducts;
        } else {
            document.querySelector('.p-lower__section--history')
            ? 
            document.querySelector('.p-lower__section--history').style.display = 'none'
            :
            document.querySelector('.p-home__section--history').style.display = 'none'
            return { hasProducts: false }
        }
    },
    orderedProducts_carousel: async function () {
        let recentOrders = await accountService.orderHistoryCarousel();


        if (recentOrders.product_list.length !== 0) {

            //IN CASE ITS NEEDED
            let list = product.makeCarouselList(recentOrders.product_list, 'js-itemList--reorder');
            document.querySelector('.carousel--reorder').insertBefore(list, document.querySelector('.carousel--reorder').childNodes[2]);
            return recentOrders;
        } else {
            document.querySelector('.p-lower__section--reorder')
            ? 
            document.querySelector('.p-lower__section--reorder').style.display = 'none'
            :
            document.querySelector('.p-home__section--reorder').style.display = 'none'
            return { hasProducts: false }
        }
    },
    makeCarouselList: function (products, switcher) {
        console.log('start', products)
        var list = document.createElement('ol');
        list.setAttribute('class', 'c-itemList '+ switcher);
        for (let i = 0; i < products.length; i++) {
            var item = document.createElement('li');
            item.setAttribute('class', 'c-itemList__item');
            
            let a = document.createElement('a');
            a.setAttribute('href', '/product/' + products[i].type + '/' + products[i].slug);
            a.setAttribute('class', 'c-itemList__link')
            let div_img = document.createElement('div');
            div_img.setAttribute('class', 'c-itemList__image');
            let img = document.createElement('img');
            img.setAttribute('src', products[i].img);
            img.setAttribute('alt', 'image');
            img.setAttribute('class', 'object-fit');
            let div_label = document.createElement('div');
            div_label.setAttribute('class', 'c-itemList__label');
            div_label.innerHTML = products[i].name;
            div_img.appendChild(img);
            a.appendChild(div_img);
            a.appendChild(div_label);
            item.appendChild(a);
            list.appendChild(item);
            console.log('add', i)
        }
        console.log('end')
        return list
    },

    productsPagination: async function (array, type) {
        //20 items per page
        //assign data-page: //1||2||3... depending on the page
        //
        let page = 1;
        let normal_count = 0;
        let premium_count = 0;
        let normal_page = 1;
        let premium_page = 1;
        for (let i = 0; i < array.length; i++) {
            let isPremium = array[i].isPremium != null || undefined ? array[i].isPremium : false;

            if (i % 8 == 0 && i != 0) {
                page++;
            }

            // let thisProduct = {
            //     id: array[i].id,
            //     isPremium: isPremium
            // }
            // console.log(thisProduct);

            var item = document.createElement('li');
            item.setAttribute('data-date', array[i].date_created);
            if (isPremium) {
                item.setAttribute('class', 'p-products__item pagination_item customer-premium');
                item.setAttribute('isPremiumProduct', true);
                if (premium_count % 8 == 0 && premium_count != 0) {
                    premium_page++;
                }
                item.setAttribute('data-page', premium_page);
                premium_count++;
            }
            else {
                item.setAttribute('class', 'p-products__item pagination_item customer-normal');
                item.setAttribute('isPremiumProduct', false);
                if (normal_count % 8 == 0 && normal_count != 0) {
                    normal_page++;
                }
                item.setAttribute('data-page', normal_page);
                normal_count++;
            }
            //item.setAttribute('data-page', page);
            item.setAttribute('style', 'display:none');

            let a = document.createElement('a');
            a.setAttribute('href', '/product/' + type + '/' + array[i].slug);
            a.setAttribute('class', 'p-products__link')

            let div_img = document.createElement('div');
            div_img.setAttribute('class', 'p-products__image');
            let img = document.createElement('img');
            img.setAttribute('src', array[i].image);
            img.setAttribute('alt', 'image');
            img.setAttribute('class', 'object-fit');

            let div_label = document.createElement('div');
            div_label.setAttribute('class', 'p-products__label');
            div_label.innerHTML = array[i].name;

        /* <div class="p-products__reviewStar">
            <span class="is-checked">★</span>
            <span class="is-checked">★</span>
            <span class="is-checked">★</span>
            <span class="is-checked">★</span>
            <span>★</span>
        </div> */
            let rating_id = 'rating-' + array[i].id;

            // var rendered = template.replace('#stars#', function(num) {
            //     var ret = '';
            //     for (var i=1; i<=5; i++) {
            //         var checked = (i <= Math.ceil(num)) ? ' class="is-checked"' : '';
            //         ret += '<span' + checked + '>★</span>';
            //     }
            //     return ret;
            // }(average));

            let div_rating = document.createElement('div');
            div_rating.id = rating_id;
            div_rating.setAttribute('class', 'p-products__reviewStar');

            let div_price = document.createElement('div');
            div_price.setAttribute('class', 'p-products__price');
            div_price.innerHTML = parseFloat(array[i].price).toLocaleString();

            let span = document.createElement('span');
            span.innerHTML = '円（税別）' + (array[i].type == 'variable' ? 'から' : '');


            div_img.appendChild(img);
            a.appendChild(div_img);
            a.appendChild(div_label);
            a.appendChild(div_rating);
            div_price.appendChild(span);
            a.appendChild(div_price);

            item.appendChild(a);

            document.querySelector('.pagination_items').appendChild(item);
            
            (async function() {
                let reviews = array[i].review_meta.review;//await product.getProductReviews(array[i].id, 1);
                // let template = `<div class="p-products__reviewStar">
                //                     #stars#
                //                 </div>`;
                var sum = 0;
                for (var j=0; j<reviews.length; j++) {
                    var review = reviews[j];
                    sum += review.rating;
                }
                var average = reviews.length > 0 ? sum / reviews.length : 0;
                average = average.toFixed(2);
                console.log('ID', array[i].id, 'Sum', sum, 'Average', average);
    
                var rendered = '';
                for (var k=1; k<=5; k++) {
                    var checked = (k <= Math.ceil(average)) ? ' class="is-checked"' : '';
                    rendered += '<span' + checked + '>★</span>';
                }
                // console.log('rendered', rendered);
                let rating_div = document.getElementById(rating_id);
                rating_div.innerHTML = rendered;
            })();
        }
        // for (let i=0; i<3; i++) {
        //     let li = document.createElement('li');
        //     li.classList.add('p-products__categoryItem');
        //     li.classList.add('p-products__categoryItem--empty');
        //     document.querySelector('.pagination_items').appendChild(li);
        // }
    },
    currentPage: 0,
    changePage: function (page = 1, isPremiumUser) {
        let items = document.querySelectorAll('.pagination_item');
        console.log(typeof isPremiumUser, isPremiumUser)
        items.forEach(e => {
            if (e.getAttribute("isPremiumProduct") == isPremiumUser) {
                if (e.getAttribute('data-page') == page) {
                    e.style.display = 'inline-block';
                } else {
                    e.style.display = 'none'
                }

            }
            else {
                e.style.display = 'none'
            }
        });
        document.querySelectorAll('.js-pagination__item--numberTop').forEach((e, i) => {
            if (i == (page - 1)) {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberTop pagination_button_' + (i + 1) + ' is-currentPage');
            }
            else {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberTop pagination_button_' + (i + 1));
            }
        });
        document.querySelectorAll('.js-pagination__item--numberBottom').forEach((e, i) => {
            if (i == (page - 1)) {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + (i + 1) + ' is-currentPage');
            }
            else {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + (i + 1));
            }
        })
        product.currentPage = page;
        let counters = document.getElementsByClassName('c-pagination__informationCount');
        counters = Array.prototype.slice.call(counters);
        let first = (page - 1) * 8 + 1;
        let last = items.length < first + 7 ? items.length : first + 7;
        for (let i=0; i<counters.length; i++) {
            let counter = counters[i];
            counter.innerHTML = items.length + '件中' + first + '～' + last + '件';
        }
    },

    loadButtons: function (productsLength, isPremiumUser) {
        let page_button_top = document.querySelectorAll('.js-pagination__item--numberTop');
        let page_button_bottom = document.querySelectorAll('.js-pagination__item--numberBottom');

        document.querySelectorAll('.c-pagination__item--prev').forEach(e => {
            e.addEventListener('click', function (event) { if (product.currentPage > 1) { product.changePage(product.currentPage - 1, isPremiumUser) } });
        })



        document.querySelectorAll('.c-pagination__item--next').forEach(e => {
            e.addEventListener('click', function (event) { if (Math.ceil(productsLength / 8) > product.currentPage) { product.changePage(product.currentPage + 1, isPremiumUser) } });
        })


        for (let iter = 0; iter < productsLength; iter += 8) {
            let page = iter / 8 + 1
            // console.log('There is a page: ', page);

            let top_page_btn = document.createElement('li');
            top_page_btn.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberTop pagination_button_' + page)
            let page_num = document.createElement('a');
            page_num.innerHTML = page;
            top_page_btn.appendChild(page_num)

            let bot_page_btn = document.createElement('li');
            bot_page_btn.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + page)
            bot_page_btn.appendChild(page_num.cloneNode(true))

            document.querySelector('.page_numbers_top').appendChild(top_page_btn)
            document.querySelector('.page_numbers_bot').appendChild(bot_page_btn)
            
            document.querySelectorAll('.pagination_button_' + page).forEach(e=>{
                e.addEventListener('click', function (event) { product.changePage(page, isPremiumUser);});
            })
        }





    }

}
export { product };