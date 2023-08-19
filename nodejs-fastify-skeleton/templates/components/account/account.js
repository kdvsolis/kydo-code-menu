import { accountService } from '/services/account.service.js';
import { cookieService } from '/services/cookie.service.js';
import { cart } from '/components/cart/cart.js';
import { authService } from '../../services/auth.service.js';
import { salesforceService } from '../../services/salesforce.service.js';

let account = {
    getUser: async function () {
        let userInfo = await accountService.userInfo();
        if (userInfo.success) {
            if (userInfo.email.startsWith("del_" + userInfo.id)) {
                await account.logoutUserTest();
                window.location = "/login";
            }
        }
        return userInfo;
    },
    modifyUser: async function (user_id, data) {
        return await accountService.modifyInfo(user_id, data);
    },
    authenticateUser: async function (username, password) {
        return await authService.authCredentials(username, password);
    },
    registerUser: async function (data) {
        let response = await authService.authNew(data);
        if (response.success === true) {
            return await account.authenticateUser(data.email, data.password);
        } else {
            return { success: false }
        }
    },
    logoutUser: async function (token) {
        return authService.authExpire(token);
    },
    logoutUserTest: async function () {
        return authService.authExpire();
    },
    templateLogic: async function () {

        let data = await account.getUser();

        //logic dom manipulation using data here
        let token = data.token;
        let isPremium = data.isPremiumUser;
        //document.querySelector('.example').innerHTML = 'World';
        //SIDE MENU MY-PAGE
        // if (document.getElementsByClassName('p-mypage__side').length > 0) {
        //     if (isPremium) {
        //         document.getElementById('sidemenu-samples').style.display = 'block';
        //     }
        // }
        //SIDE MENU MY-PAGE

        if (token) {

            document.querySelectorAll('.customer-logged-in').forEach(element => {
                element.style.display = 'block'
            });
            document.querySelectorAll('.customer-logged-out').forEach(element => {
                element.style.display = 'none'
            });

            if (isPremium) {
                document.querySelectorAll('.customer-premium').forEach(element => {
                    element.style.display = 'block'
                })
                document.querySelectorAll('.customer-normal').forEach(element => {
                    element.style.display = 'none'
                })
                //document.querySelectorAll(".p-mypage__menuItem")[4].style.display = "block";
            }
            else {
                document.querySelectorAll('.customer-normal').forEach(element => {
                    element.style.display = 'block'
                })
                document.querySelectorAll('.customer-premium').forEach(element => {
                    element.style.display = 'none'
                })
            }




            //.cart-qty-badge only exists in customer-logged-in...
            //...for some reason, might try to make a createElement for dom here.
        }
        else {
            document.querySelectorAll('.customer-logged-out').forEach(element => {
                element.style.display = 'block'
            });
            document.querySelectorAll('.customer-logged-in').forEach(element => {
                element.style.display = 'none'
            });
            document.querySelectorAll('.customer-logged-out-side').forEach(element => {
                element.style.display = 'flex'
            });

        }
        let cart_qty = cart.getTotalCartQuantity();
        document.querySelectorAll('.cart-qty-badge').forEach(e => e.innerHTML = cart_qty)

        if (isPremium) document.querySelectorAll('a.p-products__categoryLink, a.l-header__globalNavCategoryLink').forEach(function (el) {
            el.href = el.href.replace('/normal-', '/premium-')
        });


    },
    validateHospital: async function () {
        let query_params = (new URL(document.location)).searchParams;

        let hospital_unique_cd = query_params.get("hospital_unique_cd") != null || undefined ? query_params.get("hospital_unique_cd") : null;
        let hid = query_params.get("hid") != null || undefined ? query_params.get("hid") : null;
        let input_code = document.getElementById('code') != null || undefined ? document.getElementById('code').value : null;

        let hospital_element = hospital_unique_cd != null ? hospital_unique_cd : hid != null ? hid : input_code != null ? input_code : null;

        hospital_element = (hospital_element == null || hospital_element == '') ? null : parseInt(hospital_element, 10);

        //let hospital_element = hospital_unique_cd != null || undefined ? hospital_unique_cd : document.getElementById('code') != null || undefined ? document.getElementById('code').value : null;
        //hospital_element = null
        //let hospital_element = document.getElementById('code').value;
        // console.log('cookie', typeof hospital_unique_cd, hospital_unique_cd)
        // console.log('hospital element: ', hospital_element)
        if (hospital_element == null || hospital_element == '') { //569111 real code
            return { success: true };
        } else {
            let sfType = hospital_unique_cd != null ? 'HospitalCode__c' : hid != null ? 'HospitalID__c' : 'HospitalCode__c';
            let response = await salesforceService.getHospitalDetails(sfType, hospital_element);

            if (response.HospitalCode__c) {
                let data = {
                    success: true,
                    hospital_name: response.Name,
                    hospital_code: response.HospitalCode__c,
                    hospital_id: response.HospitalID__c
                }
                return data;
            } else {
                return { success: false };
            }
        }
    },
    setPostal: async function (isFinal) {
        try {
            if (!document.getElementById('postal').value.match("^([0-9]{7})$"))
                throw "Invalid Postal Code"
            const response = await (await fetch('/checkout/address/' + document.getElementById('postal').value)).json().then(result);
            // console.log('postal_response:', response)
            document.getElementById('postal').value = document.getElementById('postal').value.replace("-", "");
            document.getElementById("municipality").value = response.city.name;
            document.getElementById("shipping_state").value = response.pref.name;
            if (!isFinal) {
                document.getElementById("town").value = response.name.replace(document.getElementById('postal').value + " ", "");
            }
        } catch (e) {
            document.getElementById('municipality').value = '';
            document.getElementById('shipping_state').value = '';
            document.getElementById('town').value = '';
        }
    }
    ,
    validateForm: async function () {
        //check if input for field is valid
        //if invalid manipulate dom
        //if valid return data 
        let isValid = true;
        let error1 = document.getElementById('error1');
        let reg_error = document.getElementById('registration-error-message');

        let hospital_valid = await account.validateHospital();
        // console.log('hospital_valid: ', hospital_valid)

        let fname = document.getElementById("firstname").value;
        let sname = document.getElementById("surname").value;
        let email_element = document.getElementById("username");
        let email = email_element ? email_element.value : null;
        let password_element = document.getElementById("password")
        let password = password_element ? password_element.value : null;
        let contactno = document.getElementById("contactno").value;

        let postal = document.getElementById("postal").value;
        let shipping_state = document.getElementById("shipping_state").value;
        let municipality = document.getElementById("municipality").value;
        let town = document.getElementById("town").value;
        let bldg = document.getElementById("bldg").value;

        let hospital_error_element = document.getElementById('hospital-error-message');
        if (hospital_error_element) {
            if (!hospital_valid.success) {
                hospital_error_element.style.display = "block";
                isValid = false;
            } else {
                hospital_error_element.style.display = "none";
            }
        }

        if (fname.value == '' || fname.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null ||
            sname.value == '' || sname.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null) {

            document.getElementById('name-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('name-error-message').style.display = "none";
        }

        // if (contactno.match(/^(0|63)\d{9,10}$/g) === null ||//FOR TESTING PURPOSES ~~ PHILIPPINE NUMBERS
        //     contactno == "" ||
        //     contactno.startsWith("00")) {
        //     document.getElementById('contactno-error-message').style.display = "block";
        //     isValid = false;
        // }
        // else {
        //     document.getElementById('contactno-error-message').style.display = "none";
        // }

        if (document.getElementById("contactno").getAttribute('isValid') === 'false') {//FOR TESTING PURPOSES ~~ PHILIPPINE NUMBERS
            //let verifyPhone = await account.two_factor_authentication(true,)
            document.getElementById('contactno-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('contactno-error-message').style.display = "none";
        }

        if (email_element) {
            if (//email != document.getElementById('email-verify').value || //THIS IS IF THERE IS A 'CONFIRM EMAIL INPUT'
                email !== null && (email == "" ||
                    email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) == null)) {
                document.getElementById('username-error-message').style.display = "block";
                isValid = false;
            }
            else {
                document.getElementById('username-error-message').style.display = "none";
            }
        }
        if (password_element) {
            if (//password != document.getElementById('password-verify').value || //THIS IS IF THERE IS A 'CONFIRM PASSWORD INPUT'
                password !== null && (password == "" || password.match(/^((?=.*[0-9a-zA-Z])([a-zA-Z0-9@`~!#$%^&*()-=_+|{}\[\]|\\:;"',.<>/?]+)){8,}$/g) == null)) {
                document.getElementById('password-error-message').style.display = "block";
                isValid = false;
            }
            else {
                document.getElementById('password-error-message').style.display = "none";
            }
        }

        //ADDRESS START
        if (postal == '' || postal.match(/^\d{7}$/g) == null) {
            document.getElementById('postal-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('postal-error-message').style.display = "none";
        }
        if (shipping_state == undefined || shipping_state == '') {
            document.getElementById('shipping_state-error-message').style.display = "block";
            isValid = false;

        }
        else {
            document.getElementById('shipping_state-error-message').style.display = "none";

        }
        if (municipality == '') {
            document.getElementById('municipality-error-message').style.display = "block";
            isValid = false;

        } else {
            document.getElementById('municipality-error-message').style.display = "none";

        }
        if (town == '') {
            document.getElementById('town-error-message').style.display = "block";
            isValid = false;

        } else {
            document.getElementById('town-error-message').style.display = "none";

        }
        // if (bldg = '') {
        //     document.getElementById('bldg-error-message').style.display = "block";
        //     isValid = false;

        // } else {
        //     document.getElementById('bldg-error-message').style.display = "none";

        // }


        if (isValid) {
            //error1.style.display = "none"; ERROR MESSAGE
            reg_error.style.display = "none";
            let data = {
                email: email,
                first_name: fname,
                last_name: sname,
                username: email,
                password: password,
                billing: {
                    email: email,
                    first_name: fname,
                    last_name: sname,
                    country: 'JP',
                    phone: contactno,
                    state: shipping_state,
                    city: municipality,
                    address_1: town,
                    address_2: bldg,
                    postcode: postal

                },
                shipping: {
                    first_name: fname,
                    last_name: sname,
                    country: 'JP',
                    state: shipping_state,
                    city: municipality,
                    address_1: town,
                    address_2: bldg,
                    postcode: postal
                }
            }

            //used on registration.ejs
            // document.getElementById('confirmation').style.display = "block";
            // document.getElementById('full-form').style.display = "none";
            // if (!hospital_valid.hospital_name) {
            //     document.getElementById('hospital_detail').style.display = "none"
            //     document.getElementById('hospital_code').style.display = "none"

            // }
            // else {
            //     document.getElementById('hospital_detail').style.display = "block"
            //     document.getElementById('hospital_code').innerHTML = hospital_valid.hospital_name;
            // }

            // document.getElementById('fullname').innerHTML = data.last_name.concat(' ', data.first_name);
            // document.getElementById('confirm_email').innerHTML = data.email;
            // document.getElementById('confirm_contactno').innerHTML = data.billing.phone;

            // let pass_array = password.split('');
            // let pass_placeholder = pass_array.map(e => '*');
            // document.getElementById('confirm_password').innerHTML = pass_placeholder.join('');
            //used on registration.ejs

            let response = {
                status: 'success',
                data: data
            }
            return response;
        }
        else {
            //error1.style.display = "block"; ERROR MESSAGE
            reg_error.style.display = "block";
            return { status: false };
        }
    },
    //cancelUser
    cancelUser: async function (user_id, reason) {
        let response = await accountService.cancelUserAccount(user_id, reason);
        if (response.success == true) {
            account.logoutUserTest();
            return response;
        }
    },
    changePassword: async function (password, reset_code) {
        let data = {
            "password": password,
            "reset_code": reset_code
        }
        let response = await accountService.changePassword(data);
        return { success: response.success };
    },
    requestResetPassword: async function (email) {
        let data = {
            email: email
        }
        let response = await accountService.requestResetPassword(data);
        return { success: response.success };
    },
    modifySubscriptionPayMethod: async function (subscription, payment_mode = "imgmopg", token = "") {
        if (payment_mode == "imgmopg") {
            let response = await accountService.modifySubscriptionCreditCard(subscription.id, token);
            return response;
        } else {
            let meta = {
                _vs_gmo_user_id: ""
            }
            let response = await accountService.modifyProductSubscription(subscription.id, meta);
            return response;
        }
        return { success: false };
    },
    cancelProductSubscription: async function (subscription) {
        let meta = {
            _vs_status: 'cancelled',
            _sf_unpatched: 'cancel'
        }
        let response = await accountService.modifyProductSubscription(subscription.id, meta);
        return response;
    },
    skipProductSubscription: async function (subscription) {
        let meta = {
            _sf_unpatched: 'skip',
            _vs_next_scheduled_order_date: new Date(new Date(subscription.meta._vs_next_scheduled_order_date).getTime() + parseInt(subscription.meta._vs_period) * 24 * 60 * 60 * 1000).toISOString().split(".")[0].split("T")[0]
        }
        let response = await accountService.modifyProductSubscription(subscription.id, meta);
        return response;
    },
    changeInfoSubscription: async function (subscription, meta) {
        let data = {
            _vs_quantity: meta.quantity,
            _vs_period: meta.period,
            _vs_next_scheduled_order_date: meta.schedule,
            _vs_memo: meta.memo,
            _sf_unpatched: 'change',
        }
        let response = await accountService.modifyProductSubscription(subscription.id, data);
        return response;
    },
    //submit review
    submitReview: async function (product_id, review, rating) {
        let data = {
            product_id: product_id,
            review: review,
            rating: rating
        }
        let response = await accountService.submitReview(data);
        return response;
    },
    //reviews
    getReviews: async function (user_email) {
        return accountService.reviewList(user_email);
    },
    //2fa
    two_factor_authentication: async function (switcher, isUserInfo) {
        let twilio_sid;
        let hasChanged = false;
        let phoneIsVerified = false;
        let verifyAttempt = false;
        let initialTime, postTime;
        async function start_2fa_auth() {
            verifyAttempt = true;

            if (document.getElementById('contactno').value === '' ||
                document.getElementById('contactno').value.match(/^(0|63)\d{9,10}$/g) === null || //FOR TESTING PURPOSES ~~ PHILIPPINE NUMBERS
                document.getElementById('contactno').value.startsWith("00")) {
                //document.getElementById("contactno").classList.add("input-invalid");
                //document.getElementById("contactno").oninput = function () { document.getElementById("contactno").classList.remove("input-invalid") };
                document.getElementById('contactno-error-message').style.display = "block";
                console.log('error starting')

            }
            else {


                let phone_number = document.getElementById('contactno').value;
                // console.log(phone_number)
                let response = await accountService.checkPhone(phone_number);
                // console.log(response)
                if (response.times_used[0][0].used === 0) {
                    render_2fa_buttons();
                    await send_twilio_code();

                }

                else {
                    document.getElementById('invalid-code').style.display = "none";
                    document.getElementById('expired-code').style.display = "none";
                    document.getElementById('contact-already-registered').style.display = "block";

                }

            }
        }
        function render_2fa_buttons() {
            document.getElementById('contactno-error-message').style.display = "none";
            document.getElementById('resend-btn').style.display = "block";
            document.getElementById('phone-auth').style.display = "block";
            document.getElementById('disabled-confirm-form').style.display = "block";
            document.getElementById('confirm-form').style.display = "none";
            document.getElementById('auth-btn').style.display = "none";
            if (document.getElementById('auth-required-notice') != null) {
                document.getElementById('auth-required-notice').style.display = "none";
            }
            document.getElementById('contact-already-registered').style.display = "none";
            document.getElementById('twilio-code-input').disabled = false;

        }
        async function send_twilio_code() {

            let initial_number = document.getElementById('contactno').value
            let country_code = initial_number.substring(0, 1);

            let user_number = country_code === '6' ? initial_number : '81' + initial_number.substring(1);

            let response = await accountService.generateTwilioCode(user_number);

            initialTime = new Date();

            twilio_sid = response.sid
        }
        async function cancel_twilio_code() {
            
            if (verifyAttempt === true) {
                postTime = new Date(); 

                if ((postTime-initialTime)/(60*10*100)<10){
                   let response = await accountService.cancelTwilioCode(twilio_sid); 
                }

                
            }
        }
        async function resend_twilio_code() {
            await cancel_twilio_code();

            let phone_number = document.getElementById('contactno').value;
            // console.log(phone_number)
            let response = await accountService.checkPhone(phone_number);
            // console.log(response)
            if (response.times_used[0][0].used === 0) {
                await send_twilio_code();
                document.getElementById('contact-already-registered').style.display = "none";
            }

            else {
                document.getElementById('invalid-code').style.display = "none";
                document.getElementById('expired-code').style.display = "none";
                document.getElementById('contact-already-registered').style.display = "block";

            }
            await send_twilio_code();
        }
        async function verify_auth_code() {
            let user_code = document.getElementById('twilio-code-input').value;
            if (user_code.match(/\d{6}$/g) !== null) {
                document.getElementById('confirm-auth-btn').style.display = "none";
                document.getElementById('confirm-auth-btn2').style.display = "block";

                let initial_number = document.getElementById('contactno').value
                let country_code = initial_number.substring(0, 1);



                let user_number = country_code === '6' ? initial_number : '81' + initial_number.substring(1);

                let response = await accountService.verifyTwilioCode(user_number, user_code);

                let result = response.status;
                //var result = document.getElementById('twilio-code-input').value; //<-- manual testing
                //var result = 'pending';

                switch (result) {
                    case 'approved':
                        document.getElementById('auth-verified').style.display = "block";
                        document.getElementById('phone-auth').style.display = "none";
                        document.getElementById('disabled-confirm-form').style.display = "none";
                        document.getElementById('confirm-form').style.display = "block";
                        document.getElementById('contactno').disabled = true;
                        document.getElementById('invalid-code').style.display = "none";
                        document.getElementById('expired-code').style.display = "none";
                        document.getElementById('contact-already-registered').style.display = "none";
                        document.getElementById('resend-btn').disabled = true;
                        if (document.getElementById('auth-required-notice') != null) {
                            document.getElementById('auth-required-notice').style.display = "none";
                        }
                        return {
                            success: true
                        };
                    case 'pending':
                        document.getElementById('invalid-code').style.display = "block";
                        document.getElementById('expired-code').style.display = "none";
                        document.getElementById('contact-already-registered').style.display = "none";
                        document.getElementById('confirm-auth-btn').style.display = "block";
                        document.getElementById('confirm-auth-btn2').style.display = "none";
                        if (document.getElementById('auth-required-notice') != null) {
                            document.getElementById('auth-required-notice').style.display = "block";
                        }
                        break;
                    default:
                        document.getElementById('invalid-code').style.display = "none";
                        document.getElementById('expired-code').style.display = "block";
                        document.getElementById('contact-already-registered').style.display = "none";
                        document.getElementById('confirm-auth-btn').style.display = "block";
                        document.getElementById('confirm-auth-btn2').style.display = "none";
                        if (document.getElementById('auth-required-notice') != null) {
                            document.getElementById('auth-required-notice').style.display = "block";
                        }
                }
                document.getElementById('confirm-auth-btn').style.display = "block";
                document.getElementById('confirm-auth-btn2').style.display = "none";
            }



        }
        function number_change() {
            hasChanged = true;
            document.getElementById('contactno').setAttribute('isValid', 'false')
            document.getElementById('disabled-confirm-form').style.display = "block";
            document.getElementById('confirm-form').style.display = "none";
            if (document.getElementById('resend-btn').style.display == 'none') {
                document.getElementById('auth-btn').style.display = "block";
            }

            //document.getElementById('twilio-container').style.display = "block";
            if (document.getElementById('auth-required-notice') != null) {
                document.getElementById('auth-required-notice').style.display = "block";
            }
            document.getElementById('phone-auth').style.display = "block";
        }
        async function close_twilio_modal() {
            if (verifyAttempt === true) {
                document.getElementById('contactno').value = current_number != null || '' ? current_number : '';
                document.getElementById('auth-verified').style.display = "none";
                document.getElementById('phone-auth').style.display = "none";
                document.getElementById('disabled-confirm-form').style.display = "none";
                document.getElementById('confirm-form').style.display = "block";
                document.getElementById('invalid-code').style.display = "none";
                document.getElementById('expired-code').style.display = "none";
                document.getElementById('contact-already-registered').style.display = "none";
                document.getElementById('contactno').disabled = false;
                document.getElementById('twilio-code-input').value = '';

                document.getElementById('resend-btn').style.display = "none";

                if (document.getElementById('auth-required-notice') != null) {
                    document.getElementById('auth-required-notice').style.display = "none";
                }

                document.getElementById('auth-btn').style.display = "none";
                await cancel_twilio_code();
            }
        }



        if (switcher) {
            document.getElementById('contactno').setAttribute('isValid', 'false')
            if (isUserInfo) {
                document.getElementById('contactno').setAttribute('isValid', 'true')
            }
            document.getElementById('auth-btn').addEventListener('click', async function (event) { await start_2fa_auth(); })

            document.getElementById('resend-btn').addEventListener('click', async function (event) {
                await resend_twilio_code()
            })

            document.getElementById('confirm-auth-btn').addEventListener('click', async function (event) {
                let x = await verify_auth_code();
                if (x.success == true) {
                    document.getElementById('contactno').setAttribute('isValid', 'true')
                }
            })

            if (document.getElementById('contactno').value != '' || null) {
                document.getElementById('contactno').addEventListener('input', async function (event) { number_change() })
            }

            //IF within modal
            //document.querySelector('.<modal close identifier>').addEventListener('click',function(event){ await close_twilio_modal()})


        }


    },
    reviewPagination: function (array) {
        let page = 1;


        var list = document.createElement('ol');
        list.setAttribute('class', 'p-mypage__reviewList');
        for (let i = 0; i < array.length; i++) {
            if (i % 5 == 0 && i != 0) {
                page++;
            }
            var item = document.createElement('li');
            item.setAttribute('class', 'p-mypage__reviewItem pagination_item');
            item.setAttribute('data-page', page);
            let revName = document.createElement('div');
            revName.setAttribute('class', 'p-mypage__reviewName');

            let a = document.createElement('a');
            a.setAttribute('href', '#');

            revName.appendChild(a);

            let revDef = document.createElement('dl');
            revDef.setAttribute('class', 'p-mypage__reviewDef');

            let revDate = document.createElement('dt');
            revDate.setAttribute('class', 'p-mypage__reviewTitle revDate');
            revDate.innerHTML = '投稿日'

            let revDateVal = document.createElement('dd');
            revDateVal.setAttribute('class', 'p-mypage__reviewData revDateVal');

            let revEval = document.createElement('dt');
            revEval.setAttribute('class', 'p-mypage__reviewTitle revEval');
            revEval.innerHTML = '評価'

            let revEvalVal = document.createElement('dd');
            revEvalVal.setAttribute('class', 'p-mypage__reviewData revEvalVal');

            let rating = document.createElement('div');
            rating.setAttribute('class', 'p-mypage__reviewStar');

            rating.innerHTML = `<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>`;
            for (let n = 0; n < array[i].rating; n++) {
                rating.childNodes[n].setAttribute('class', 'is-checked')
            }

            revEvalVal.appendChild(rating)

            let revContent = document.createElement('dt');
            revContent.setAttribute('class', 'p-mypage__reviewTitle revContent');
            revContent.innerHTML = 'レビュー内容'

            let revContentVal = document.createElement('dd');
            revContentVal.setAttribute('class', 'p-mypage__reviewData revContentVal');

            let revButtonWrap = document.createElement('div');
            revButtonWrap.setAttribute('class', 'c-button-wrap');

            let revButton = document.createElement('a');
            revButton.setAttribute('class', 'c-button c-button--reversal noScroll');
            revButton.setAttribute('data-lity', '');
            revButton.innerHTML = 'レビューを変更する'
            revButton.setAttribute('href', '#');

            revButtonWrap.appendChild(revButton);

            revDef.appendChild(revDate);
            revDef.appendChild(revDateVal)
            revDef.appendChild(revEval)
            revDef.appendChild(revEvalVal)
            revDef.appendChild(revContent);
            revDef.appendChild(revContentVal)

            item.appendChild(revName);
            item.appendChild(revDef);
            item.appendChild(revButtonWrap);

            list.appendChild(item);

        }
        document.querySelector('.p-mypage__mainSection').prepend(list);


    },
    currentReviewPage: 0,
    changeReviewPage: function (page = 1) {
        let items = document.querySelectorAll('.pagination_item');
        items.forEach(e => {
            if (e.getAttribute("data-page") == page) {
                e.style.display = 'block';
                //currentPage = page;
            }
            else {
                e.style.display = 'none'

            }
        });
        account.reviewPage = page;
    },
    modifyReview: async function (review_id, updated_data) {
        return await accountService.updateReview(review_id, updated_data);
    },
    validateFormTest: async function (switcher, switcher_2fa) {
        function cancel() {
            document.getElementById('registration-error-message').style.display = "none";
            document.querySelector('.confirmation-form').style.display = "none";
            document.querySelector('.full-form').style.display = "block";

        }
        if (switcher == 'registration') {
            document.querySelector('.cancel').addEventListener('click', function (event) { cancel() })
        }



        let isValid = true;
        let error1 = document.getElementById('error1');
        let reg_error = document.getElementById('registration-error-message');

        let hospital_valid = await account.validateHospital();

        let fname = document.getElementById("firstname").value;
        let sname = document.getElementById("surname").value;
        let email_element = switcher != 'integrated_LP' ? document.getElementById('email') : document.getElementById("username");
        let email = email_element ? email_element.value : null;
        let password_element = document.getElementById("password");
        let current_password = document.getElementById("current-password");
        let password = password_element ? password_element.value : null;
        let contactno = document.getElementById("contactno").value;

        // console.log(document.getElementById('current-password').value)
        // let postal, shipping_state, municipality, town, bldg;
        // if (switcher != 'registration') {
        //     postal = document.getElementById("postal").value;
        //     shipping_state = document.getElementById("shipping_state").value;
        //     municipality = document.getElementById("municipality").value;
        //     town = document.getElementById("town").value;
        //     bldg = document.getElementById("bldg").value;
        // }


        let hospital_error_element = document.getElementById('hospital-error-message');
        if (hospital_error_element) {
            if (!hospital_valid.success) {
                hospital_error_element.style.display = "block";
                isValid = false;
            } else {
                hospital_error_element.style.display = "none";
            }
        }

        if (fname == '' || fname.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null ||
            sname == '' || sname.match(/^[^\x01-\x7E\xA1-\xDF]+$/) == null) {

            document.getElementById('name-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('name-error-message').style.display = "none";

        }

        if (document.getElementById("contactno").getAttribute('isValid') === 'false') {//FOR TESTING PURPOSES ~~ PHILIPPINE NUMBERS
            //let verifyPhone = await account.two_factor_authentication(true,)
            document.getElementById('contactno-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('contactno-error-message').style.display = "none";
        }


        let newReg = switcher != 'user_info' ? true : false;

        if (email_element) {
            
            let emailsNotEqual = switcher != 'integrated_LP' ? (email != document.getElementById('email-verify').value) ? true : false : false;
            let equalsOldEmail = switcher == 'user_info' ? (email != document.getElementById('current-email').value) ? false : true : false;
            let hasNewEmail = switcher == 'user_info' ? (email == '' || email == document.getElementById('current-email').value) ? false : true : false;


            console.log(emailsNotEqual);
            console.log(equalsOldEmail)
            console.log(hasNewEmail)
            console.log(email)
            if (newReg || hasNewEmail) {
                let email_valid = await account.validateUserDB("email",{username:email});
            console.log("email_valid: "+JSON.stringify(email_valid));
            if(!email_valid.success){
                document.getElementById('username-exists-error-message').style.display = "block";
                isValid = false;
            }
            else{
                document.getElementById('username-exists-error-message').style.display = "none";
            }
                if (equalsOldEmail || emailsNotEqual) {
                    document.getElementById('username-error-message').style.display = "block";
                    isValid = false;
                }
                else {
                    if (email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) == null) {
                        document.getElementById('username-error-message').style.display = "block";
                        isValid = false;
                    }
                }
            }
            else {
                if (!hasNewEmail && !emailsNotEqual && !equalsOldEmail) {
                    email = document.getElementById('current-email').value
                    console.log("email", email);
                }
                else if (!hasNewEmail && equalsOldEmail || emailsNotEqual){
                    document.getElementById('username-error-message').style.display = "block";
                        isValid = false;
                }
                else{
                    document.getElementById('username-error-message').style.display = "none";
                }
            }
        }

        if (password_element) {
            let passwordsNotEqual = switcher != 'integrated_LP' ? (password != document.getElementById('password-verify').value) ? true : false : false;
            let equalsOldPassword = switcher == 'user_info' ? (password == current_password.value && current_password.value != '') ? true : false : false;
            let hasNewPassword = switcher == 'user_info' ? (password != '' || password == current_password.value && current_password.value != '') ? true : false : false;


            

            if (newReg || hasNewPassword) {
                let pass_valid = {success:true};

                if (document.getElementById('current-email')){
                    let current_email = document.getElementById('current-email').value;
                    pass_valid = await account.validateUserDB("password",{username:current_email, password:current_password.value});
                    if (current_password.value == '') {
                        document.getElementById('password-error-message').style.display = "block";
                        isValid = false;
                    }
                }
                
                console.log("pass_valid: "+JSON.stringify(pass_valid));
                if (equalsOldPassword || passwordsNotEqual || !pass_valid.success) {
                    document.getElementById('password-error-message').style.display = "block";
                    isValid = false;
                }
                else {
                    if (password.match(/^((?=.*[0-9a-zA-Z])([a-zA-Z0-9@`~!#$%^&*()-=_+|{}\[\]|\\:;"',.<>/?]+)){8,}$/g) == null) {
                        document.getElementById('password-error-message').style.display = "block";
                        isValid = false;
                    }
                }
            }
            else {

                document.getElementById('password-error-message').style.display = "none";
            }
        }

        //ADDRESS START
        // if (switcher != 'registration') {
        //     if (postal == '' || postal.match(/^\d{7}$/g) == null) {
        //         document.getElementById('postal-error-message').style.display = "block";
        //         isValid = false;
        //     }
        //     else {
        //         document.getElementById('postal-error-message').style.display = "none";
        //     }
        //     if (shipping_state == undefined || shipping_state == '') {
        //         document.getElementById('shipping_state-error-message').style.display = "block";
        //         isValid = false;

        //     }
        //     else {
        //         document.getElementById('shipping_state-error-message').style.display = "none";

        //     }
        //     if (municipality == '') {
        //         document.getElementById('municipality-error-message').style.display = "block";
        //         isValid = false;

        //     } else {
        //         document.getElementById('municipality-error-message').style.display = "none";

        //     }
        //     if (town == '') {
        //         document.getElementById('town-error-message').style.display = "block";
        //         isValid = false;

        //     } else {
        //         document.getElementById('town-error-message').style.display = "none";

        //     }
        // if (bldg == '') {
        //     document.getElementById('bldg-error-message').style.display = "block";
        //     isValid = false;

        // } else {
        //     document.getElementById('bldg-error-message').style.display = "none";

        // }
        //}



        if (isValid) {
            //error1.style.display = "none"; ERROR MESSAGE
            //reg_error.style.display = "none";
            let data = {
                email: email,
                first_name: fname,
                last_name: sname,
                username: email.substring(0, email.indexOf("@")) + Math.random() * 100000,
                password: password,
                billing: {
                    email: email,
                    first_name: fname,
                    last_name: sname,
                    country: 'JP',
                    phone: contactno,
                },
                shipping: {
                    first_name: fname,
                    last_name: sname,
                    country: 'JP',
                    phone: contactno
                }
            }
            // if (switcher != 'registration') {

            //     data.billing.state = shipping_state;
            //     data.billing.city = municipality;
            //     data.billing.address_1 = town;
            //     data.billing.address_2 = bldg;
            //     data.billing.postcode = postal

            //     data.shipping.state = shipping_state
            //     data.shipping.city = municipality
            //     data.shipping.address_1 = town
            //     data.shipping.address_2 = bldg
            //     data.shipping.postcode = postal

            // }

            if (switcher == 'user_info') {
                delete data.username
                data.meta_data = [];
                if (hospital_valid.success && hospital_valid.hospital_name != undefined) {
                    data.meta_data = [{
                        key: 'hospital_code',
                        value: hospital_valid.hospital_code
                    }, {
                        key: 'hospital_name',
                        value: hospital_valid.hospital_name
                    }, {
                        key: 'hospital_id',
                        value: hospital_valid.hospital_id
                    }, {
                        key: '_v_customer_type',
                        value: 'A'
                    }]
                }
                if (hospital_valid.hospital_code !== document.getElementById('code').getAttribute('current-hospital_code')) {
                    data.meta_data.push({
                        key: "_sf_unpatched_hospital",
                        value: moment((new Date())).format('YYYYMMDD-HHmmss')
                    })
                }
                data.meta_data.push({
                    key: "_sf_unpatched",
                    value: moment((new Date())).format('YYYYMMDD-HHmmss')
                })
            }

            //used on registration.ejs
            if (switcher == 'registration') {
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;

                document.querySelector('.confirmation-form').style.display = "block";
                document.querySelector('.full-form').style.display = "none";


                if (!hospital_valid.hospital_name) {
                    document.getElementById('hospital_detail').style.display = "none"
                    document.getElementById('hospital_code').style.display = "none"

                }
                else {
                    document.getElementById('hospital_detail').style.display = "contents"
                    document.getElementById('hospital_code').innerHTML = hospital_valid.hospital_name;
                }

                document.getElementById('fullname').innerHTML = data.last_name.concat(' ', data.first_name);
                document.getElementById('confirm_email').innerHTML = data.email;
                document.getElementById('confirm_contactno').innerHTML = data.billing.phone;

            }

            //used on registration.ejs

            let response = {
                status: 'success',
                data: data,
                hospital_valid: hospital_valid
            }
            return response;
        }
        else {
            //error1.style.display = "block"; ERROR MESSAGE
            if (switcher == 'registration') {
                reg_error.style.display = "block";
            }

            return { status: false };
        }
    },
    confirmNewUser: async function (data, hospital_valid) {

        document.querySelector('.confirmation-form').style.display = "none";

        var meta_data = [];

        if (getCookieValue('ref') != '') {
            meta_data.push({
                key: 'source',
                value: getCookieValue('ref')
            });
        }
        if (getCookieValue('refcd') != '') {
            meta_data.push({
                key: 'referrer_uid',
                value: getCookieValue('refcd')
            });
        }

        if (hospital_valid.hospital_id != null && hospital_valid.hospital_code != null) {
            meta_data.push({
                key: 'hospital_id',
                value: hospital_valid.hospital_id
            })
            meta_data.push({
                key: 'hospital_code',
                value: hospital_valid.hospital_code
            })
            meta_data.push({
                key: 'hospital_name',
                value: hospital_valid.hospital_name
            })
            meta_data.push({
                key: '_v_customer_type',
                value: 'A'
            })
        } else {
            meta_data.push({
                key: 'hospital_id',
                value: "99999"
            })
            meta_data.push({
                key: '_v_customer_type',
                value: 'N'
            })
        }

        meta_data.push({
            key: '_v_agreed',
            value: 1
        });

        // Add initial coupons

        meta_data.push({
            key: '_v_discount_617001001',
            value: 1
        });
        meta_data.push({
            key: '_v_discount_617014001',
            value: 999999
        });
        meta_data.push({
            key: '_v_discount_617068001',
            value: 999999
        });
        meta_data.push({
            key: '_v_discount_617069001',
            value: 999999
        });
        meta_data.push({
            key: "_sf_unposted",
            value: moment((new Date())).format('YYYYMMDD-HHmmss')
        })

        data.meta_data = meta_data;
        let response = await authService.authNew(data);
        if (response.status == 500 || response.status == 502 || response.status == 504 || response.status == 400 ||
            response.status == 404) {
            document.querySelector('.full-form').style.display = "block";
            document.getElementById('registration-error-message').style.display = "block";
            document.getElementById('username-error-message').style.display = "block"
            if (response.status == 500) {
                document.getElementById('username-exists-error-message').style.display = "block";
            }
        } else if (response.success == true) {
            let auth_response = await authService.authCredentials(data.email, data.password);
            console.log('auth_response', auth_response);  // By unicon
            console.log('hospital_valid.hospital_id:', hospital_valid.hospital_id);
            console.log('hospital_valid.hospital_code:', hospital_valid.hospital_code);
            if (auth_response.success == true) {
                let page = new URLSearchParams(window.location.search).get('page');
                if (page == "order") {
                    window.location.href = "/my-page/orders"
                } else if (page == "cart") {
                    window.location.href = "/cart"
                } else {
                    document.querySelector('.full-form').style.display = "none";
                    document.querySelector(".completed").style.display = "block";
                    if (hospital_valid.hospital_id && hospital_valid.hospital_code) document.getElementById('isHospital').style.display = "block";
                }
            }
        }
    },
    orderPagination: function (array) {
        let page = 1;
        var list = document.createElement('ol');
        list.setAttribute('class', 'p-mypage__orderList');
        for (let i = 0; i < array.length; i++) {
            if (i % 30 == 0 && i != 0) {
                page++;
            }
            var item = document.createElement('li');
            item.setAttribute('class', 'p-mypage__orderItem pagination_item');
            item.setAttribute('data-page', page);
            item.setAttribute('style', 'display:none');

            let a = document.createElement('a');
            a.setAttribute('class', 'p-mypage__orderLink');
            a.setAttribute('href', '/my-page/orders/' + array[i].order_id);

            item.appendChild(a);

            let ordDef = document.createElement('dl');
            ordDef.setAttribute('class', 'p-mypage__orderDef');

            let ordId = document.createElement('dt');
            ordId.setAttribute('class', 'p-mypage__orderTitle ordId');
            ordId.innerHTML = '注文受付番号'

            let ordIdVal = document.createElement('dd');
            ordIdVal.setAttribute('class', 'p-mypage__orderData ordIdVal');
            ordIdVal.innerHTML = array[i].order_id

            let ordDate = document.createElement('dt');
            ordDate.setAttribute('class', 'p-mypage__orderTitle ordDate');
            ordDate.innerHTML = '注文日時'

            let ordDateVal = document.createElement('dd');
            ordDateVal.setAttribute('class', 'p-mypage__orderData ordDateVal');
            ordDateVal.innerHTML = array[i].order_date

            let ordType = document.createElement('dt');
            ordType.setAttribute('class', 'p-mypage__orderTitle ordType');
            ordType.innerHTML = '注文方法'

            let ordTypeVal = document.createElement('dd');
            ordTypeVal.setAttribute('class', 'p-mypage__orderData ordTypeVal');
            ordTypeVal.innerHTML = array[i].order_type

            let ordAmount = document.createElement('dt');
            ordAmount.setAttribute('class', 'p-mypage__orderTitle ordAmount');
            ordAmount.innerHTML = '支払い金額'

            let ordAmountVal = document.createElement('dd');
            ordAmountVal.setAttribute('class', 'p-mypage__orderData ordAmountVal');
            ordAmountVal.innerHTML = array[i].order_amount

            let revContent = document.createElement('dt');
            revContent.setAttribute('class', 'p-mypage__orderTitle revContent');
            revContent.innerHTML = 'レビュー内容'


            ordDef.appendChild(ordId);
            ordDef.appendChild(ordIdVal)
            ordDef.appendChild(ordDate)
            ordDef.appendChild(ordDateVal)
            ordDef.appendChild(ordType);
            ordDef.appendChild(ordTypeVal);
            ordDef.appendChild(ordAmount);
            ordDef.appendChild(ordAmountVal)

            a.appendChild(ordDef)

            item.appendChild(a);

            list.appendChild(item);
        }
        console.log('end')
        document.querySelector('.p-mypage__mainSection').prepend(list);
    },
    currentOrderPage: 0,
    changePage: function (page = 1) {
        let items = document.querySelectorAll('.pagination_item');

        items.forEach(e => {

            if (e.getAttribute('data-page') == page) {
                e.style.display = 'block';
                //console.log('displayed', page)
                //currentPage = page;
            } else {
                e.style.display = 'none'
            }


        });

        document.querySelectorAll('.js-pagination__item--numberBottom').forEach((e, i) => {
            if (i == (page - 1)) {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + (i + 1) + ' is-currentPage');
            }
            else {
                e.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + (i + 1));
            }
        });
        account.currentOrderPage = page;
        let counters = document.getElementsByClassName('c-pagination__informationCount');
        counters = Array.prototype.slice.call(counters);
        let first = (page - 1) * 30 + 1;
        let last = items.length < first + 4 ? items.length : first + 4;
        for (let i = 0; i < counters.length; i++) {
            let counter = counters[i];
            counter.innerHTML = items.length + '件中' + first + '～' + last + '件';
        }
    },

    loadButtons: function (length) {

        let iter = 0;
        
let pageNumber = Math.round(length / 30)
if(length/30 > 1){
 if ((length/30 % 1) != 0){
     pageNumber+=1
 }
}
        document.querySelectorAll('.c-pagination__item--prev').forEach(e => {
            e.addEventListener('click', function (event) { if (account.currentOrderPage > 1) { account.changePage(account.currentOrderPage - 1) } });
        })



        document.querySelectorAll('.c-pagination__item--next').forEach(e => {
            e.addEventListener('click', function (event) { if (pageNumber != account.currentOrderPage) { account.changePage(account.currentOrderPage + 1) } });
        })


        do {
            if (iter % 30 == 0) {
                let page = iter / 30 + 1

                let bot_page_btn = document.createElement('li');
                bot_page_btn.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + page);
                let page_num = document.createElement('a');
                page_num.innerHTML = page;
                bot_page_btn.appendChild(page_num);

                document.querySelector('.page_numbers_bot').appendChild(bot_page_btn);

                // document.querySelectorAll('.pagination_button_' + page).forEach(e=>{
                //    // e.style.display = 'none';
                //    e.style.display = 'block'
                //     console.log('page button', page)
                // })
                document.querySelectorAll('.pagination_button_' + page).forEach(e => {
                    e.addEventListener('click', function (event) { account.changePage(page); });
                })
            }
            iter++;
        } while (iter < length);
    },
    currentNewsPage: 0,
    //CLOSE TO FINAL ITERATION OF CHANGEPAGE FUNCTION
    changePageTest: function (page = 1, switcher) {
        let items = document.querySelectorAll('.pagination_item');

        items.forEach(e => {

            if (e.getAttribute('data-page') == page) {
                e.style.display = 'block';
                //console.log('displayed', page)
                //currentPage = page;
            } else {
                e.style.display = 'none'
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
        console.log(switcher)
        if (switcher == 'news') {
            account.currentNewsPage = page;
        }
        if (switcher == 'reviews') {
            account.currentReviewPage = page;
            console.log(page, account.currentReviewPage)
        }
        console.log(page, account.currentReviewPage)
        let counters = document.getElementsByClassName('c-pagination__informationCount');
        counters = Array.prototype.slice.call(counters);
        let first = (page - 1) * 5 + 1;
        let last = items.length < first + 4 ? items.length : first + 4;
        for (let i = 0; i < counters.length; i++) {
            let counter = counters[i];
            counter.innerHTML = items.length + '件中' + first + '～' + last + '件';
        }
    },
    //CLOSE TO FINAL ITERATION OF LOADBUTTONS FUNCTION
    loadButtonsTest: function (length, switcher) {
        console.log('button test loaded')
        let iter = 0;
        let currpage
        console.log('hey', account.currentReviewPage)
        if (switcher == 'news') {
            currpage = 'account.currentNewsPage'
        }
        if (switcher == 'reviews') {
            currpage = 'account.currentReviewPage'
            console.log('current page: ', currpage)
        }
        console.log('test', currpage)

        document.querySelectorAll('.c-pagination__item--prev').forEach(e => {
            e.addEventListener('click', function (event) { if (eval(currpage) > 1) { account.changePageTest(eval(currpage) - 1, switcher) } });
        })


        document.querySelectorAll('.c-pagination__item--next').forEach(e => {
            e.addEventListener('click', function (event) { if (Math.round(length / 5) != eval(currpage)) { console.log(currpage, switcher); account.changePageTest(eval(currpage) + 1, switcher) } });
        })



        if (switcher != 'reviews') {
            do {
                if (iter % 5 == 0) {
                    let page = iter / 5 + 1;

                    let bot_page_btn = document.createElement('li');
                    bot_page_btn.setAttribute('class', 'c-pagination__item c-pagination__item--number js-pagination__item--numberBottom pagination_button_' + page);
                    let page_num = document.createElement('a');
                    page_num.innerHTML = page;
                    bot_page_btn.appendChild(page_num);

                    document.querySelector('.page_numbers_bot').appendChild(bot_page_btn);

                    // document.querySelectorAll('.pagination_button_' + page).forEach(e=>{
                    //    // e.style.display = 'none';
                    //    e.style.display = 'block'
                    //     console.log('page button', page)
                    // })
                    document.querySelectorAll('.pagination_button_' + page).forEach(e => {
                        e.addEventListener('click', function (event) { account.changePageTest(page, switcher); });
                    })
                }
                iter++;
            } while (iter < length);
        }
    },
    validateAddress: function () {
        let isValid = true;
        let fname = document.getElementById("firstname_modal").value;
        let sname = document.getElementById("surname_modal").value;
        let postal = document.getElementById("postal").value;
        let shipping_state = document.getElementById("shipping_state").value;
        let municipality = document.getElementById("municipality").value;
        let town = document.getElementById("town").value;
        let bldg = document.getElementById("bldg").value;

        console.log(postal, shipping_state, municipality, town);

        if (postal == '' || postal.match(/^\d{7}$/g) == null) {
            document.getElementById('postal-error-message').style.display = "block";
            isValid = false;
        }
        else {
            document.getElementById('postal-error-message').style.display = "none";
        }
        if (shipping_state == undefined || shipping_state == '') {
            document.getElementById('shipping_state-error-message').style.display = "block";
            isValid = false;

        }
        else {
            document.getElementById('shipping_state-error-message').style.display = "none";

        }
        if (municipality == '') {
            document.getElementById('municipality-error-message').style.display = "block";
            isValid = false;

        } else {
            document.getElementById('municipality-error-message').style.display = "none";

        }
        if (town == '') {
            document.getElementById('town-error-message').style.display = "block";
            isValid = false;

        } else {
            document.getElementById('town-error-message').style.display = "none";

        }

        if (isValid) {
            
            let data = {
                first_name: fname,
                last_name: sname,
                billing: {
                    first_name: fname,
                    last_name: sname,
                    state: shipping_state,
                    city: municipality,
                    address_1: town,
                    address_2: bldg,
                    postcode: postal
                },
                shipping: {
                    first_name: fname,
                    last_name: sname,
                    state: shipping_state,
                    city: municipality,
                    address_1: town,
                    address_2: bldg,
                    postcode: postal
                },
                meta_data: []
            };

            data.meta_data.push({
                key: "_sf_unpatched",
                value: moment((new Date())).format('YYYYMMDD-HHmmss')
            })

            let response = {
                success: true,
                data: data
            };
            return response;
        }
        return { success: false };

    },
    enableSave: function () {
        document.querySelectorAll('input').forEach((e, i) => {
            if (i < 11) {
                e.addEventListener('change', function () {
                    document.getElementById("confirm-form").style.display = 'block'
                    document.getElementById('disabled-confirm-form').style.display = 'none'
                })
            }
        })
    },
    //Test Comment for JS Versioning
    limitInput: function () {

        function limiter(event, element, switcher) {
            let input = element.value
            if (switcher == 'postal' || switcher == 'contact' || switcher == 'number') {
                function fullWidthNumConvert(fullWidthNum) {
                    let finalString = fullWidthNum.replace("-", "");
                    return finalString.replace(/[\uFF10-\uFF19]/g, function (m) {
                        return String.fromCharCode(m.charCodeAt(0) - 0xfee0);
                    });
                }
                console.log('pre-converted number: ', input)
                input = fullWidthNumConvert(input);
                console.log('converted number: ', input)
            }
            let limitNo
            switch (switcher) {
                case 'contact':
                    limitNo = input.startsWith('63') ? 12 : 11;
                    break;
                case 'postal':
                    limitNo = 11;
                    break;
                default:
                    limitNo = 50;
                    break;
            }
            element.value = input.slice(0, limitNo);
            // if (new Blob([input]).size >= limitNo) {
            //     console.log('over 50')
            //     document.getElementById('code').value = input.slice(0, limitNo);

            // }
            // else {
            //     document.getElementById('code').value = input.slice(0, limitNo);
            // }
        }

        if (document.getElementById('surname')) {
            document.getElementById('surname').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('firstname').addEventListener('change', function (event) { limiter(event, this) })
        }

        if (document.getElementById('email')) {
            document.getElementById('email').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('email-verify').addEventListener('change', function (event) { limiter(event, this) })
        }

        if (document.getElementById('password')) {
            document.getElementById('password').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('password-verify').addEventListener('change', function (event) { limiter(event, this) })
        }

        if(document.getElementById('contactno')){
        document.getElementById('contactno').addEventListener('change', function (event) { limiter(event, this, 'contact') })
        }

        if(document.getElementById('code')){
        document.getElementById('code').addEventListener('change', function (event) { limiter(event, this, 'number') })
        }

        if (document.getElementById('surname_modal')) {

            document.getElementById('surname_modal').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('firstname_modal').addEventListener('change', function (event) { limiter(event, this) })

            document.getElementById('postal').addEventListener('change', function (event) { limiter(event, this, 'postal') })

            document.getElementById('shipping_state').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('municipality').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('town').addEventListener('change', function (event) { limiter(event, this) })
            document.getElementById('bldg').addEventListener('change', function (event) { limiter(event, this) })
        }
    },
    validateUserDB: async function (type, data) {
        return await accountService.validateB2C(type,data);
    },
}

export { account };