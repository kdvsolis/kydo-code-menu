import { cookieService } from '/services/cookie.service.js';

var authService = {

    authCredentials: async function (username, password) {

        try {
            let data = {
                "username": username,
                "password": password
            };
            let response = await (await fetch('/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            }));
            if (response.status === 200) {
                return response.json();
            }
            else if (response.status !== 200) {
                return { success: false, status: response.status };
            }
        } catch (error) {
            console.log(error);
            return { success: false, status: 500 };
        }

    },
    authNew: async function (data) {
        try{
            let response = await (await fetch('/auth/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            }));
            if (response.status === 200) return response.json();
            else return { success: false, status: response.status };
        } catch(e){
            return { success: false };
        }
        
    },
    authExpire: async function (token) {
        console.log(token)
        let user_token = cookieService.getCookieValue('token');
        return await (await fetch('/auth/expire', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + user_token
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({})
        })).json();
    },
    checkToken: async function () {
        return await (await fetch('/auth/token')).json();
    }

}

export { authService }