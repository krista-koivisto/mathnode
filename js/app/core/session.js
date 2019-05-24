/*
 * Mathnode / Core / Session
 *
 * Session handler module. Keeps track of session-related cookies while loading
 * the page or signing in out out.
 *
 */

MathNode.Session = {
    onStateChange: (e) => {
        MathNode.Interface.menu.session.update();
        MathNode.Interface.layout.update();
    },
    signin: async (email, password) => {
        const user = await mndb.user.signin(email, password);

        Cookie.set("mnauth", btoa(JSON.stringify({id: user.id, token: user.token})), 14); // Token is only valid for 14 days
        MathNode.Session.onStateChange({event: 'signin'});

        return user;
    },
    signup: async (name, email, password) => {
        return await mndb.user.create(name, email, password);
    },
    signout: async (name, email, password) => {
        const response = await mndb.user.signout();
        await mndb.session.clear();

        Cookie.clear("mnauth");
        MathNode.Session.onStateChange({event: 'signout'});

        return response;
    },
    init: async () => {
        const user = Cookie.get("mnauth");

        if (user) {
            mndb.credentials = JSON.parse(atob(user));
            if (await mndb.session.verify()) {
                MathNode.Session.onStateChange({event: 'init'});
            } else {
                await mndb.session.clear();
                Cookie.clear("mnauth");
            }
        }
    },
}
