var cookieService = {
    getCookieValue: function (name) {
        var b = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)');
        return b != null ? b.pop() : '';
    },
    setCookie: function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    deleteCookie: function (name) {
        var expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = name + "=;" + expires + ";path=/";
    }
}

export { cookieService }