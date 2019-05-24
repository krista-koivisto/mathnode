/*
 * Mathnode / Interface / Session
 *
 * Interface-related session handling such as sign in and registration modal
 * windows.
 *
 */

MathNode.Interface.session = {
    signin: {
        show: () => {
            let title = "<div class='modal-title'>Sign In</div>";
            let email = "<div class='modal-text'>Email Adress:</div>" +
                        "<input class='modal-input block' id='login-email' autocomplete='off' onkeydown='if (event.key == \"Enter\") MathNode.Interface.session.signin.do();'/>";
            let pass =  "<div class='modal-text'>Password</div>" +
                        "<input type='password' class='modal-input block' id='login-pass' autocomplete='off' onkeydown='if (event.key == \"Enter\") MathNode.Interface.session.signin.do();'/>";
            let button = "<input type='button' class='modal-button center' onclick='MathNode.Interface.session.signin.do();' value='Login'/>";
            let body = "<div class='modal-body'>"+email+pass+button+"</div>";
            let modal = "<div class='modal-dialog' onclick='event.stopPropagation();'>"+title+body+"</div>";

            MathNode.Interface.modal.show(modal);
        },
        do: async () => {
            const email = document.getElementById("login-email").value;
            const pass = document.getElementById("login-pass").value;
            const user = await MathNode.Session.signin(email, pass);

            if (user.token) {
                MathNode.Interface.modal.hide();
            } else {
                console.log("Nope!");
            }
        },
    },
    register: {
        show: () => {
            alert("Registration is not yet open to the public! Sorry!");
        },
        do: () => {
        },
    },
    signout: {
        do: async () => {
            await MathNode.Session.signout();
        },
    },
};
