/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */

const auth = firebase.auth()
const firestore = firebase.firestore()

function authenticate(){
    document.getElementById("signup").disabled = true
    const pass = document.getElementById("pass").value
    const repass = document.getElementById("re_pass").value
    const email = document.getElementById("email").value.trim()
    const name = document.getElementById("name").value.trim()
    const agreePolicy = document.getElementById("agree-policies").checked
    if(agreePolicy === false){
        document.getElementById("signUpMessage").innerHTML = "Please agree to the privacy policy and terms"
        document.getElementById("signup").disabled = false
    }
    else if(name.length > 35){
        document.getElementById("signUpMessage").innerHTML = "Please choose a shorter display name"
        document.getElementById("signup").disabled = false
    }
    else if(name.length === 0){
        document.getElementById("signUpMessage").innerHTML = "Please enter a display name"
        document.getElementById("signup").disabled = false
    }
    else if (!validateEmail(email)){
        document.getElementById("signUpMessage").innerHTML = "Please enter a valid email"
        document.getElementById("signup").disabled = false
    }
    else{
        try{
            if(pass === repass && pass.length >= 8){
                document.getElementById("signin-cover").classList.add("running")
                var emailRegistered = false
                firestore.collection("ZoomOAuth").where("email","==",email).get().then((querySnapshot) => {
                    querySnapshot.forEach((Authdoc) => {
                        emailRegistered = true
                        auth.createUserWithEmailAndPassword(email,pass).then(cred => {
                            auth.currentUser.updateProfile({
                                    displayName: name
                                }
                            ).then(function() {
                                var userEmail = cred.user.email
                                var userDisplayName = cred.user.displayName
                                if(userDisplayName == null){
                                    userDisplayName = ""
                                }
                                if(userEmail == null){
                                    userEmail = ""
                                }
                                firestore.collection("ZoomOAuth").doc(Authdoc.id).update({
                                    firebaseID: cred.user.uid
                                }).then(()=>{
                                    const user = cred.user
                                    firestore.collection("Users").doc(user.uid).set({
                                        name: user.displayName,
                                        email: user.email
                                    })
                                        .then(function() {
                                            document.getElementById("signup").disabled = false
                                            document.getElementById("signin-cover").classList.remove("running")
                                            window.location.href = "dashboard"
                                        })
                                        .catch(function(error) {
                                            document.getElementById("signin-cover").classList.remove("running")
                                            document.getElementById("signUpMessage").innerHTML = error.message
                                            document.getElementById("signup").disabled = false
                                        });
                                }).catch((error)=> {
                                    document.getElementById("signin-cover").classList.remove("running")
                                    document.getElementById("signUpMessage").innerHTML = error.message
                                    document.getElementById("signup").disabled = false
                                })
                            }).catch((e) => {
                                document.getElementById("signin-cover").classList.remove("running")
                                document.getElementById("signUpMessage").innerHTML = e.message
                                document.getElementById("signup").disabled = false
                            })
                        }).catch(err => {
                            document.getElementById("signin-cover").classList.remove("running")
                            document.getElementById("signUpMessage").innerHTML = err.message
                            document.getElementById("signup").disabled = false
                        })
                    })
                    if(emailRegistered === false){
                        document.getElementById("signin-cover").classList.remove("running")
                        document.getElementById("signUpMessage").innerHTML = "Make sure you downloaded the zoom app and your email is the same as your zoom email"
                        document.getElementById("zoomButton").style.display = "inline-block";
                        document.getElementById("signup").disabled = false
                    }
                }).catch((error) => {
                    document.getElementById("signin-cover").classList.remove("running")
                    document.getElementById("signUpMessage").innerHTML = error.message
                    document.getElementById("signup").disabled = false
                })
            }
            else if(pass.length < 8){
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signUpMessage").innerHTML = "Make sure your password is 8 or more characters"
                document.getElementById("signup").disabled = false
            }
            else{
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signUpMessage").innerHTML = "The passwords do not match"
                document.getElementById("signup").disabled = false
            }
        }
        catch(err){
            document.getElementById("signin-cover").classList.remove("running")
            document.getElementById("signUpMessage").innerHTML = err.message;
            document.getElementById("signup").disabled = false
        }
    }

}
function validateEmail(email)
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}
function login(){
    const email = document.getElementById("login-email").value.trim()
    const pass = document.getElementById("login-pass").value
    const remember = document.getElementById("remember-me").checked
    document.getElementById("signin").disabled = true
    document.getElementById("signin-cover").classList.add("running")
    if(validateEmail(email)){
        auth.signInWithEmailAndPassword(email,pass).then(cred => {
            var userEmail = cred.user.email
            var userDisplayName = cred.user.displayName
            if(userDisplayName == null){
                userDisplayName = ""
            }
            if(userEmail == null){
                userEmail = ""
            }
            if(remember === true){
                auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
                    document.getElementById("signin-cover").classList.remove("running")
                    document.getElementById("signin").disabled = false
                    window.location.href = "dashboard"
                }).catch((error) =>{
                    document.getElementById("loginMessage").innerHTML = error.message;
                    document.getElementById("signin-cover").classList.remove("running")
                    document.getElementById("signin").disabled = false
                })
            }
            else{
                auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
                    document.getElementById("signin-cover").classList.remove("running")
                    document.getElementById("signin").disabled = false
                    window.location.href = "dashboard"
                }).catch((error) => {
                    document.getElementById("loginMessage").innerHTML = error.message;
                    document.getElementById("signin-cover").classList.remove("running")
                    document.getElementById("signin").disabled = false
                })
            }
        }).catch(err => {
            if(err.code === "auth/user-not-found"){
                document.getElementById("loginMessage").innerHTML = "There is no user with that email address";
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signin").disabled = false
            }
            else if(err.code === "auth/network-request-failed"){
                document.getElementById("loginMessage").innerHTML = "Please connect to the internet";
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signin").disabled = false
            }
            else if(err.code === "auth/wrong-password"){
                document.getElementById("loginMessage").innerHTML = "Incorrect password";
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signin").disabled = false
            }
            else{
                document.getElementById("loginMessage").innerHTML = err.message;
                document.getElementById("signin-cover").classList.remove("running")
                document.getElementById("signin").disabled = false
            }
        })
    }
    else{
        document.getElementById("loginMessage").innerHTML = "Please enter a valid email"
        document.getElementById("signin-cover").classList.remove("running")
        document.getElementById("signin").disabled = false
    }
}

$("#re_pass").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        authenticate()
    }
});
$("#login-pass").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        login()
    }
});





