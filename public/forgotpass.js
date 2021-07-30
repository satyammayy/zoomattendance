/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
const auth = firebase.auth()
document.getElementById("resend-description").hidden = true


function sendReset(){
    auth.sendPasswordResetEmail(document.getElementById("user-email").value).then(function() {
        document.getElementById("resend-description").hidden = false
        document.getElementById("resend-description").value = "If there is an account under this email, a reset link has been sent"
    }).catch(function(error) {
        document.getElementById("resend-description").hidden = false
        document.getElementById("resend-description").value = "If there is an account under this email, a reset link has been sent"
    });
}
