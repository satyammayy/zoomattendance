/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
function greenNotification(message){

    $(".notify").addClass("notify-active-green");
    document.getElementById("notifyType").innerHTML = message

    setTimeout(function(){
        $(".notify").removeClass("notify-active-green");
        document.getElementById("notifyType").innerHTML = ""
    },2000);
}

function validateEmail(email)
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}
$('.message-input').focus(function () {
    $(this).removeClass("is-invalid")
})
$('#message-form').submit(function(e){
    e.preventDefault();
    const name = document.getElementById("name-input").value
    const email = document.getElementById("email-input").value
    const message = document.getElementById("text-input").value
    var isValidated = true
    if(!validateEmail(email)){
        document.getElementById("email-input").classList.add("is-invalid")
        isValidated = false
    }
    if(name.length === 0){
        document.getElementById("name-input").classList.add("is-invalid")
        isValidated = false
    }
    if(message.length === 0){
        document.getElementById("text-input").classList.add("is-invalid")
        isValidated = false
    }
    if(isValidated){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/support-message", false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            Name: name,
            email: email,
            message: message
        }));
        greenNotification("Your message has been sent")
        document.getElementById("name-input").value = ""
        document.getElementById("email-input").value = ""
        document.getElementById("text-input").value = ""
        document.getElementById("email-input").classList.remove("is-invalid")
        document.getElementById("name-input").classList.remove("is-invalid")
        document.getElementById("text-input").classList.remove("is-invalid")
    }
    return isValidated
});
