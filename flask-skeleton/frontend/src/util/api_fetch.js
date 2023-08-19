const api_fetch = {
    get: async function (url, headers_json, query_json, params) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};
        return (await fetch(url + params + query, {
            method: 'GET',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        }));
    },
    post: async function (url, headers_json, query_json, params, body) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};
        return (await fetch(url + params + query, {
            method: 'POST',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(body)
        }));
    },
    patch: async function (url, headers_json, query_json, params, body) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};
        return (await fetch(url + params + query, {
            method: 'PATCH',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(body)
        }));
    },
    put: async function (url, headers_json, query_json, params, body) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};

        return (await fetch(url + params + query, {
            method: 'POST',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(body)
        }));
    },
    patch: async function (url, headers_json, query_json, params, body ) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};

        return (await fetch(url + params + query, {
            method: 'PATCH',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(body)
        }));
    },
    delete: async function (url, headers_json, query_json, params, body) {
        const query = Object.keys(query_json).length > 0 ? "?" +  new URLSearchParams(query_json).toString() : "";
        const headers = { ...{
            'Content-Type': 'application/json'
        }, ...headers_json};

        return (await fetch(url + params + query, {
            method: 'DELETE',
            headers: headers,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(body)
        }));
    },
};

export default api_fetch ;
