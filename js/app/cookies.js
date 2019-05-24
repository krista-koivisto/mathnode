/*
 * Mathnode / Cookies
 *
 * Simple cookie handling without anything overly fancy going on. Yum!
 *
 */

const Cookie = {
    set: (name, value, lifetime) => {
        const date = new Date(Date.now() + lifetime*24*60*60*1000).toUTCString();
        document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + ";" + "expires=" + date + ";path=/";
    },
    get: (name) => {
        const cookies = decodeURIComponent(document.cookie).split(/; */);
        for (let cookie of cookies) {
            const data = cookie.trim().split(/=(.+)/);
            if (data[0] === name) return data[1];
        }
    },
    clear: (name) => {
        Cookie.set(name, '', -86400);
    },
};
