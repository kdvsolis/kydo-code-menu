import { account } from '/components/account/account.js';
import { cart } from '/components/cart/cart.js';
import { product } from '/components/product/product.js';
import { cookieService } from '/services/cookie.service.js';
import { salesforceService } from '/services/salesforce.service.js';

var userIsPremium = false;

function onPageLoaded(fn) {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

async function populateFields() {
    account.getUser().then(function(user) {
        if (user.success == false) return;
        
        document.getElementById('uid').value = user.id;
        document.getElementById('token').value = user.token;
        // ログインしている場合、登録フォームにユーザ情報を表示
        // console.log('User', user);
        var premium = false;
        // 都道府県がコードで来た場合は変換する
        var state = user.state;
        document.getElementById('shipping_state').value = state;
        if (state.startsWith('JP')) {
            var ord = parseInt(state.substring(2));
            document.getElementById('shipping_state').selectedIndex = ord;
        }
        // ログイン中の場合、プレミアム判定
        premium = user.isPremiumUser;
        userIsPremium = premium;
        if (premium) document.getElementById('utype').value = 'premium';

        var paid_sample = document.getElementById('paid-sample-products') != null;
        // サンプルLPだった場合、プレミアム会員はトップページへ
        if (paid_sample && premium) location.href = '/';
        // usermetaで有料サンプル購入有無のチェックし、すでに有料サンプルを購入した会員はトップページへ
        if (paid_sample && user.user_meta.findIndex(r => r.key == '_v_paid_sample') > -1) location.href = '/';
        
        document.getElementById('surname').value = user.last_name;
        document.getElementById('firstname').value = user.first_name;
        document.getElementById('postal').value = user.postcode;
        document.getElementById('municipality').value = user.city;
        document.getElementById('town').value = user.address_1;
        document.getElementById('bldg').value = user.address_2;

        //hide element
        document.getElementById('phone-label').style.display = 'none';
        document.getElementById('contactno').parentElement.style.display = 'none';

        //approve phone number
        document.getElementById('contactno').setAttribute('isValid', true)

        //document.getElementById('contactno').value = user.phone;
        //
        // document.getElementById('username').value = user.email;
        // document.getElementById('registration-item').style.display = 'none';
        document.getElementById('registration-item').remove();
        // ログアウトフォームを表示
        document.getElementById('logout-email').innerText = user.email;
        document.getElementById('user-logout-form').style.display = 'block';
        document.getElementById('user-login-form').style.display = 'none';

        // 商品スイッチングを行う
        var buttons = document.querySelectorAll('.cart-button');
        buttons.forEach(function(button) {
            var sku = button.name;
            // var switched = product.getProductBySKU(sku);
            product.getProductBySKU(sku).then(async function(switched) {
                button.setAttribute('data-pid', switched.product.id);
                if (premium) button.setAttribute('data-premium-id', switched.product.id);
                button.setAttribute('data-price', switched.product.price);
                button.setAttribute('data-slug', switched.product.slug);
                button.setAttribute('data-name', switched.product.name);
                button.setAttribute('data-sku', switched.product.sku);
                await refreshCart(null);
            });
        });
    }).catch(function() {
        //ログインできなかった場合
        document.getElementById('user-logout-form').style.display = 'none';
        document.getElementById('user-login-form').style.display = 'block';
        if(document.getElementById('registration-item')) document.getElementById('registration-item').style.display = 'block';
    });
}

export async function postalValidation() {
    if (!document.getElementById('postal').value.match(/^\d{7}$/g)) {
        document.getElementById('municipality').value = '';
        document.getElementById('shipping_state').value = '';
        document.getElementById('town').value = '';
    }
}

export async function setPostal(isFinal) {
    try {

       if(!document.getElementById('postal').value.match("^([0-9]{7})$"))
            throw "Invalid Postal Code"
       const response = await fetch('/checkout/address/' + document.getElementById('postal').value);
       var address = await response.json();
       document.getElementById('postal').value = document.getElementById('postal').value.replace("-", "");
       document.getElementById("municipality").value = address.city.name;
       document.getElementById("shipping_state").value = address.pref.name;
       if(!isFinal) {
            document.getElementById("town").value = address.name.replace(document.getElementById('postal').value + " ", "");
       }
    } catch (e) {
       document.getElementById('municipality').value = '';
       document.getElementById('shipping_state').value = '';
       document.getElementById('town').value = '';
    }
}

function getTaxExclusive(legacy_flag = true) {
    var cls_sub = document.getElementsByClassName("cart-quantity");
    var sub_total = 0;
    for (var i=0; i < cls_sub.length; i++) {
        var qty = parseInt(cls_sub[i].value);
        var price = parseInt(cls_sub[i].getAttribute('data-tax-exclusive'));
        sub_total += qty * price;
    }
    var shipping_fee = sub_total < 6000 ? 660 : 0;
    if (sub_total <= 0) {
        shipping_fee = 0;
    }
    if (document.getElementById('product-amount')) {
        document.getElementById('product-amount').innerText = Math.round(sub_total * 1.1).toLocaleString();
    }
    document.getElementById('shipping-fee').innerText = shipping_fee;
    document.getElementById('total-amount').innerText = Math.round(sub_total * 1.1 + shipping_fee).toLocaleString();

    return sub_total;
}

function cartWaiting(on) {
    var cart = document.getElementById('cart-item');
    if (on) {
        cart.style.display = 'none';
        var loading = document.createElement('div');
        loading.id = 'loading-notice';
        loading.classList.add('item-info');
        loading.innerText = '計算中です。しばらくお待ちください';
        document.getElementById('user-info').insertBefore(loading, document.getElementById('cart-item'));
    } else {
        // 読み込みが完了した場合
        cart.style.display = 'block';
        var notice = document.getElementById('loading-notice');
        if (notice) notice.remove();
    }
}

async function refreshCart(target) {
    var query = '/get-cart';
    if (target != null) {
        var targetName = target.name;
        var slug = location.pathname.replace(/\/+$/, '').substring(location.pathname.replace(/\/+$/, '').lastIndexOf('/') + 1);
        var quantity = parseInt(document.getElementsByName(targetName)[0].value);
        if (document.getElementsByName(targetName).length > 1 && document.getElementsByName(targetName)[1].hasAttribute('data-pid')) {
            // レガシー対応
            var productId = document.getElementsByName(targetName)[1].getAttribute('data-pid');
        } else {
            //一体型LPテンプレートボタンを使用していない場合
            var productId = document.getElementsByName(targetName)[0].getAttribute('data-pid');
        }
        query += '?add-to-cart=' + productId + '&quantity=' + quantity + '&ts=' + slug;
    }
    var opts = { method: 'GET' };
    // var res = await fetch(query, opts);
    // var json = await res.json();
    fetch(query, opts).then(function(res) { return res.json() }).then(async function(json) {
        console.log('json', json);
        console.log('cookie', cart.getCartContents());
        console.log('cart', await cart.getCartDetails());
        var items = '';
        var tax_exclusive = 0;
        for (var i=0; i < json.length; i++) {
            if (json[i].buylater == 1) continue;
            var pid = json[i].product_id;
            var cart_id = json[i].id;
            var product_qty = json[i].quantity;
            var reference = userIsPremium ? 'data-premium-id' : 'data-pid';
            var product = document.querySelector('[' + reference + '="' + pid + '"]');
            if (product == null) {
                // 対象商品外が入っているためカートから削除
                console.log('refreshCartのカート削除', pid);
                cart.deleteCartItem(cart_id, pid);
                continue;
            }
            var product_name = product.getAttribute('data-name');
            var product_price = product.getAttribute('data-price');
            var image_flag = false;
            var subtotal = parseInt(product_qty) * parseInt(product_price);
            tax_exclusive += subtotal;
            if (product.hasAttribute('data-image')) {
                var product_image = product.getAttribute('data-image');
                items += '<li class="uf-cart__item item-info"><div class="uf-cart__image"><img src="' + product_image + '" alt="' + product_name + '"></div><div class="uf-cart__information item-info"><div class="uf-cart__name"><p class="cart-item-name">' + product_name + '</p></div><div class="uf-cart__price">価格：<span class="item-price">' + Math.round(product_price * 1.1).toLocaleString() + '</span>円（税込）</div><div class="uf-cart__quantity">数量<input type="button" value="-" class="cart-minus" data-cart-id="' + cart_id + '" data-product-id="' + pid + '"><input class="quantity cart-quantity" type="number" min="1" max="300" value="' + product_qty + '" name="" data-tax-exclusive="' + product_price + '"  inputmode="numeric" pattern="[0-9]*"  data-cart-id="' + cart_id + '" data-product-id="' + pid + '" autocomplete="off" readonly=""><input type="button" value="+" class="cart-plus" data-product-id="' + pid + '"></div><div class="uf-cart__subtotal">小計：<span class="sub-total">' + Math.round(subtotal * 1.1).toLocaleString() + '</span>円（税込）</div></div><div class="uf-cart__ctrl"><button type="button" data-del-cart-id="' + cart_id + '" data-del-product-id="' + pid + '" class="uf-cart__button" name="delete_cart" value="削除">削除</button></div></li>';
                image_flag = true;
            } else {
                // レガシー legacy
                items += '<div class="item-info"><p class="cart-item-name">' + product_name + '</p><p>価格（税込）：<span class="item-price">' + Math.round(product_price * 1.1).toLocaleString() + '</span>円</p><p>数量：<input type="button" value="-" class="cart-minus" data-cart-id="' + cart_id + '" data-product-id="' + pid + '"><input class="quantity cart-quantity" type="number" min="1" max="300" value="' + product_qty + '" name="" data-tax-exclusive="' + product_price + '" readonly><input type="button" value="+" class="cart-plus" data-product-id="' + pid + '"></p> <p>小計（税込）：<span class="sub-total">' + Math.round(subtotal * 1.1).toLocaleString() + '</span>円</p> </div><!-- /.item-info -->';
            }
        }
        var shipping_fee = tax_exclusive < 6000 ? 660 : 0;
        var total_amount = Math.round(tax_exclusive * 1.1 + shipping_fee).toLocaleString();
        if (total_amount != 660) {
            items += '<h2 class="uf__title">お支払い金額</h2><ol class="uf-amount" id="cart-amount-info"><li class="uf-amount__item"><p>商品代金合計（税込）</p><p><span id="product-amount">' + Math.round(tax_exclusive * 1.1).toLocaleString() + '</span>円</p></li><li class="uf-amount__item"><p>配送・手数料</p><p><span id="shipping-fee">' + shipping_fee + '</span>円</p></li><li class="uf-amount__item uf-amount__item--total"><p>合計（税込）</p><p><span id="total-amount">' + total_amount + '</span>円</p></li></ol><span class="uf__notice">※ログイン状態と病院登録状態によって表示されているより価格が安くなる場合があります。<br>※お支払い方法を代金引換にした場合、別途代引き手数料＋330円(税込)がかかります。</span>';
            // items += '<h3>ショッピングカートの合計</h3><div id="cart-amount-info"><p>送料（税込）：<span id="shipping-fee">' + shipping_fee + '</span>円</p><p>合計（税込）※：<span id="total-amount">' + total_amount + '</span>円</p><span class="notice">※お支払い方法を代金引換にした場合、別途代引き手数料＋330円(税込)がかかります。</span></div>';
        } else {
            items = '<div class="item-info"><p>カートは空です。</p></div><!-- /.item-info --><span class="uf__notice">※ログイン状態と病院登録状態によって表示されているより価格が安くなる場合があります。<br>※お支払い方法を代金引換にした場合、別途代引き手数料＋330円(税込)がかかります。</span>';
        }
        // 有料サンプルの場合使用しないため
        if (document.getElementById('cart-item') != null) {
            if (image_flag) {
                document.getElementById('cart-item').innerHTML = items;
            } else {
                document.getElementById('cart-item').innerHTML = items;
            }
        }
        cartWaiting(false);

        var pluses = document.querySelectorAll('.cart-plus');
        var slug = location.pathname.replace(/\/+$/, '').substring(location.pathname.replace(/\/+$/, '').lastIndexOf('/') + 1);
        pluses.forEach(function(plus) {
            plus.addEventListener('click', function(event) {
                event.target.disabled == true;
                var quantityInput = event.target.previousSibling;
                var user_id = parseInt(document.getElementById('uid').value);
                if (user_id == 'NaN') user_id = 0;
                var pid = parseInt(event.target.getAttribute('data-product-id'));
                var query = '/get-cart?add-to-cart=' + pid + '&quantity=1&ts=' + slug;
                var opts = { method: 'GET' };
                fetch(query, opts).then(function(res) { return res.json() }).then(async function(json) {
                    console.log('json', json);
                    console.log('cookie', cart.getCartContents());
                    console.log('cart', await cart.getCartDetails());
                    event.target.disabled == false;
                    json.forEach(function(line) {
                        if (line.product_id == pid) quantityInput.value = '' + line.quantity;
                    });
                    var parent = document.querySelector('[data-product-id="' + pid + '"]').parentElement.parentElement;
                    var item_price = parseInt(parent.getElementsByClassName('item-price')[0].innerText.replace(',', ''));
                    var item_quantity = parseInt(parent.getElementsByClassName("quantity")[0].value);
                    parent.getElementsByClassName("sub-total")[0].innerText = (item_price * item_quantity).toLocaleString();
                    getTaxExclusive();
                }).catch(function() {
                    event.target.disabled == false;
                });
            });
        });
        // 削除ボタンの場合
        var delete_cart = document.querySelectorAll('[name="delete_cart"]');
        delete_cart.forEach(function(dlc) {
            dlc.addEventListener('click', function(event) {
                var pid = parseInt(event.target.getAttribute('data-del-product-id'));
                cart.deleteCartItem(event.target.getAttribute('data-del-cart-id'), pid).then(function(res) {
                    dlc.disabled == false;
                    var legacy_flag = false;
                    document.querySelector('[data-product-id="' + pid + '"]').parentElement.parentElement.parentElement.remove();
                    getTaxExclusive(legacy_flag);
                    // disabledを取り消し
                    document.querySelectorAll('[data-pid="' + pid + '"]')[0].disabled = false;
                    refreshCart();
                }).catch(function(e) {
                    console.log('商品の削除に失敗しました', e);
                });
            });
        });
        var minuses = document.querySelectorAll('.cart-minus');
        minuses.forEach(function(minus) {
            minus.addEventListener('click', function(event) {
                event.target.disabled == true;
                var delete_button = document.querySelectorAll('[name="delete_cart"]');
                var dlt_btn_flag = delete_button.length > 0;
                if (!dlt_btn_flag || event.target.nextSibling.value > 1) {
                    var quantityInput = event.target.nextSibling;
                    var user_id = parseInt(document.getElementById('uid').value);
                    if (user_id == 'NaN') user_id = 0;
                    var pid = parseInt(event.target.getAttribute('data-product-id'));
                    var query = '/get-cart?add-to-cart=' + pid + '&quantity=-1&ts=' + slug;
                    var opts = { method: 'GET' };
                    fetch(query, opts).then(function(res) { return res.json() }).then(async function(json) {
                        console.log('json', json);
                        console.log('cookie', cart.getCartContents());
                        console.log('cart', await cart.getCartDetails());
                        event.target.disabled == false;
                        json.forEach(function(line) {
                            if (line.product_id == pid) quantityInput.value = '' + line.quantity;
                            if (line.quantity <= 0) {
                                cart.deleteCartItem(event.target.getAttribute('data-cart-id'), pid).then(function(res) {
                                    event.target.disabled == false;
                                    getTaxExclusive();
                                });
                                document.querySelector('[data-product-id="' + pid + '"]').parentElement.parentElement.remove();
                            }
                        });
                        var parent = document.querySelector('[data-product-id="' + pid + '"]').parentElement.parentElement;
                        var item_price = parseInt(parent.getElementsByClassName('item-price')[0].innerText.replace(',', ''));
                        var item_quantity = parseInt(parent.getElementsByClassName("quantity")[0].value);
                        parent.getElementsByClassName("sub-total")[0].innerText = (item_price * item_quantity).toLocaleString();
                        getTaxExclusive();
                    
                    }).catch(function() {
                        event.target.disabled == false;
                    });
                }
           });
       });

  });


}


onPageLoaded(async function() {
    //2FA
    await account.two_factor_authentication(true, false);

    // ログイン判定
    await populateFields();
    // カートの中身
    await refreshCart(null);

    // カートに入れるボタンのイベントハンドラを設置
    var addButtons = document.querySelectorAll('.cart-button');
    addButtons.forEach(function(btn) {
        btn.addEventListener('click', async function(event) {
            cartWaiting(true);
            await refreshCart(event.target);
            event.target.disabled = true;
        });
    });


    // 確認ボタンのイベントハンドラを設置
    document.getElementById('confirm-form').addEventListener('click', function(event) {
        event.preventDefault();
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;width:100%;height:100%;opacity:0.3;z-index:100000;background:#000;top:0;left:0;';
        document.body.appendChild(overlay);
        document.getElementById('exception-error-message').style.display = 'none';
        document.getElementById('registration-error-message').style.display = 'none';
        var isNew = document.getElementById('uid') == null || document.getElementById('uid').value == '';
        //有料サンプル用
        var isPaid = document.getElementById('paid-sample-products') != null;
        
        if (isPaid) {
            // チェックされたものを取得
            var checked = document.querySelector('input[type="radio"]:checked');
            if (checked) {
                var paidSampleProduct = checked.getAttribute('data-sku');
            } else {
                // なければ、エラーを表示してリターン
                alert('サンプルを選択してください');
                overlay.remove();
                return;
            }
        }

        account.validateForm().then(function(validated) {
            console.log('validate', validated);
            if (validated.status) {
                // 成功

                // ユーザー登録
                var user = {
                    last_name: document.getElementById('surname').value,
                    first_name: document.getElementById('firstname').value,
                    billing: {
                        last_name: document.getElementById('surname').value,
                        first_name: document.getElementById('firstname').value,
                        country: 'JP',
                        state: document.getElementById('shipping_state').value,
                        city: document.getElementById('municipality').value,
                        address_1: document.getElementById('town').value,
                        address_2: document.getElementById('bldg').value,
                        phone: document.getElementById('contactno').value,
                        postcode: document.getElementById('postal').value
                    },
                    shipping: {
                        last_name: document.getElementById('surname').value,
                        first_name: document.getElementById('firstname').value,
                        country: 'JP',
                        state: document.getElementById('shipping_state').value,
                        city: document.getElementById('municipality').value,
                        address_1: document.getElementById('town').value,
                        address_2: document.getElementById('bldg').value,
                        postcode: document.getElementById('postal').value
                    }

                };

                var meta_data = [];

                if (isNew) {
                    user.email = document.getElementById('username').value;
                    user.username = document.getElementById('username').value.substring(0, document.getElementById('username').value.indexOf("@")) + Math.random() * 100000;
                    user.password = document.getElementById('password').value;
                    user.billing.email = document.getElementById('username').value;

                    if (cookieService.getCookieValue('ref') != '') { meta_data.push({ key: 'source', value: cookieService.cookieService.getCookieValue('ref') }) }
                    if (cookieService.getCookieValue('refcd') != '') { meta_data.push({ key: 'referrer_uid', value: cookieService.getCookieValue('refcd') }) }

                    var hospital_id = document.getElementById('hospital_id').value || '';
                    var hospital_code = document.getElementById('hospital_code').value || '';
                    var hospital_name = document.getElementById('hospital_name').value || '';
                    if (hospital_id != '' && hospital_code != '') {
                        meta_data.push({ key: 'hospital_id', value: hospital_id })
                        meta_data.push({ key: 'hospital_code', value: hospital_code })
                        meta_data.push({ key: 'hospital_name', value: hospital_name })
                        meta_data.push({ key: '_v_customer_type', value: 'A' })
                    } else {
                        meta_data.push({ key: 'hospital_id', value: "99999" })
                        meta_data.push({ key: '_v_customer_type', value: 'N' })
                    }
                    meta_data.push({ key: '_v_agreed', value: 1 });

                    // Add initial coupons
                    meta_data.push({ key: '_v_discount_617001001', value: 1 });
                    meta_data.push({ key: '_v_discount_617014001', value: 999999 });
                    meta_data.push({ key: '_v_discount_617068001', value: 999999 });
                    meta_data.push({ key: '_v_discount_617069001', value: 999999 });
                    meta_data.push({ key: "_sf_unposted", value: '1' })
                }
                user.meta_data = meta_data;

                if (isNew) {
                    account.registerUser(user).then(function(e) {
                        if (e.success === false) {
                            //メールアドレスに正しい文字を使っていない、メールアドレスがすでに登録されている、
                            overlay.remove();
                            document.getElementById('registration-error-message').style.display = 'block';
                        } else {
                            overlay.remove();
                            if (isPaid) {
                                location.href = '/checkout/sample/' + paidSampleProduct;
                            } else {
                                location.href = '/cart?noheader=true';
                            }
                        } 
                    }).catch(function(e) {
                        overlay.remove();
                        alert("エラーが発生しました。\nメールアドレスが既に登録されている可能性があります。\nお手数おかけしますが、もう一度最初からやり直してください。\n");
                    });
                } else {
                    account.modifyUser(parseInt(document.getElementById('uid').value), user).then(function(e) {
                        if (e.success === false) {
                            document.getElementById('exception-error-message').style.display = 'block';
                            overlay.remove();
                        } else {
                            overlay.remove();
                            if (isPaid) {
                                location.href = '/checkout/sample/' + paidSampleProduct;
                            } else {
                                location.href = '/cart?noheader=true';
                            }
                        } 
                    }).catch(function() {
                        overlay.remove();
                        alert('エラーが発生しました。\nもう一度最初からやり直してください。\nお手数をおかけして申し訳ありません。' + e);
                    });
                }

            } else {
                // エラー発生
                overlay.remove();
                document.getElementById('exception-error-message').style.display = 'block';
                document.getElementById('registration-error-message').style.display = 'none';
            }
        });

    });

    // ログインボタンのイベントハンドラを設置
    if (document.getElementById('login-btn') != null) {
        document.getElementById('login-btn').addEventListener('click', function (event) {
            event.preventDefault();
            // ログイン
            var username = document.getElementById('login-email').value;
            var password = document.getElementById('login-pass').value;
            document.getElementById('exception-error-message').style.display = 'none';
            document.getElementById('registration-error-message').style.display = 'none';
            document.getElementById('login-error-message').style.display = 'none';
            account.authenticateUser(username, password).then(async function (user) {
                if (user.success == true) {
                    await populateFields();
                    window.location.reload();
                } else {
                    //alert('ログインに失敗しました。もう一度メールアドレス、パスワードをご確認ください。');
                    document.getElementById('login-error-message').style.display = 'block';

                }
            }).catch(function () {
                alert('ログインに失敗しました。もう一度メールアドレス、パスワードをご確認ください。');
            });
        });
    };

    // ログアウトボタンのイベントハンドラを設置
    if (document.getElementById('logout-btn') != null) {
        document.getElementById('logout-btn').addEventListener('click', function (event) {
            event.preventDefault();
            // ログアウト
            var token = document.getElementById('token').value;
            account.logoutUser(token).then(function () {
                location.reload();
            });
        });
    };

    document.getElementById('postal').addEventListener('keyup', function(event) {
        setPostal(false);
    });

    document.getElementById('postal').addEventListener('change', function(event){
        postalValidation();
    });

    document.getElementById('code').addEventListener('change', function(event){
        // 非表示項目
        var code = document.getElementById('code').value;
        var hospital = salesforceService.getHospitalDetails('HospitalCode__c', code);
        if (hospital.success != false) {
            // どっかに保存して、ユーザー登録時にメタに入れる
            document.getElementById('hospital_id').value = hospital.HospitalID__c;
            document.getElementById('hospital_code').value = hospital.HospitalCode__c;
            document.getElementById('hospital_name').value = hospital.Name;
        } else {
            document.getElementById('hospital_id').value = '';
            document.getElementById('hospital_code').value = '';
            document.getElementById('hospital_name').value = '';
        }
    });
});
