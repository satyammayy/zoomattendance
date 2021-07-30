/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
const navBlock = " <nav class=\"navbar fixed-top navbar-expand-lg\">\n" +
    "    <a class=\"navbar-brand\" href=\"/\"><img  class=\"logo\" src=\"Images/Ease%20Attendance%20Header%20Logo.png\"></a>\n" +
    "\n" +
    "    <button class=\"navbar-toggler navbar-light collapsed\" type=\"button\" data-toggle=\"collapse\" data-target=\"#main-navigation\">\n" +
    "        <span class=\"icon-bar top-bar\"></span>\n" +
    "        <span class=\"icon-bar middle-bar\"></span>\n" +
    "        <span class=\"icon-bar bottom-bar\"></span>\n" +
    "    </button>\n" +
    "    <div class=\"collapse text-center navbar-collapse justify-content-end\" id=\"main-navigation\">\n" +
    "        <ul class=\"navbar-nav\">\n" +
    "            <li class=\"nav-item nav-right\">\n" +
    "                <a id=\"#donate\" target=\"_blank\" class=\"nav-link middle\" href=\"https://www.buymeacoffee.com/easeattendance\">Donate</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\">\n" +
    "                <a id=\"#features\" class=\"nav-link middle\" href=\"/features\">Features</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\">\n" +
    "                <a id=\"#get-start\" class=\"nav-link middle\" href=\"documentation\">Documentation</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\">\n" +
    "                <a id=\"#support\" class=\"nav-link middle\" href=\"support\">Support</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\">\n" +
    "                <a id=\"#aboutus\" class=\"nav-link middle\" href=\"about-us\">About Us</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\" id=\"login-button\">\n" +
    "                <a id=\"#log-in\" class=\"nav-link middle\" id=\"login-link\" href=\"login\">Log In</a>\n" +
    "            </li>\n" +
    "            <li class=\"nav-item nav-right\" id=\"sign-up-nav\">\n" +
    "                <a id=\"#sign-up\" class=\"nav-link sign-up\" href=\"signup\">Sign Up</a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "</nav>"

const footerBlock = "<footer>\n" +
    "    <div class=\"text-center container-fluid justify-content-center footer-container\">\n" +
    "        <div class=\"text-center footer-link-row row justify-content-center\">\n" +
    "            <div class=\"text-center justify-content-center col-md-4  mr-auto my-md-4 my-0 mt-4 mb-1 footer-col\">\n" +
    "                <h5 class=\"footer-title\">Pages</h5>\n" +
    "                <a href=\"/\" class=\"footer-link\"><h6>Home</h6></a>\n" +
    "                <a href=\"documentation\" class=\"footer-link\"><h6>Documentation</h6></a>\n" +
    "                <a href=\"https://www.buymeacoffee.com/easeattendance\" target=\"_blank\" class=\"footer-link\"><h6>Donate</h6></a>\n" +
    "                <a href=\"features\" class=\"footer-link\"><h6>Features</h6></a>\n" +
    "                <a href=\"about-us\" class=\"footer-link\"><h6>About Us</h6></a>\n" +
    "                <a href=\"support\" class=\"footer-link\"><h6>Support</h6></a>\n" +
    "                <a href=\"login\" class=\"footer-link\"><h6>Log In</h6></a>\n" +
    "                <a href=\"signup\" class=\"footer-link\"><h6>Sign Up</h6></a>\n" +
    "\n" +
    "            </div>\n" +
    "            <div class=\"text-center justify-content-center col-md-4  mr-auto my-md-4 my-0 mt-4 mb-1 footer-col\">\n" +
    "                <h5 class=\"footer-title\">Contact</h5>\n" +
    "                <a href=\"mailto:contact@easeattendance.com\" class=\"footer-link\"><h6 ><i class=\"fa fa-envelope\"></i>&nbsp;&nbsp;contact@easeattendance.com</h6></a>\n" +
    "                <a href=\"tel:4086809552\" class=\"footer-link\"> <h6 class=\"q\"><i class=\"fa fa-phone\"></i>&nbsp;&nbsp;408-680-9552</h6></a>\n" +
    "            </div>\n" +
    "            <div class=\"text-center justify-content-center col-md-4 mr-auto my-md-4 my-0 mt-4 mb-1 footer-col\">\n" +
    "                <h5 class=\"footer-title\">Policies</h5>\n" +
    "                <a href=\"terms\" class=\"footer-link\"><h6>Terms</h6></a>\n" +
    "                <a href=\"privacy\" class=\"footer-link\"><h6>Privacy</h6></a>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"row justify-content-center text-center copyright-row\">\n" +
    "            <div class=\"col\">\n" +
    "                <h6 class=\"copyright-test\">© 2021 Ease Attendance</h6>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</footer>"
if(document.getElementById("nav")){
    document.getElementById("nav").innerHTML = navBlock

}

if(document.getElementById("footer")){
    document.getElementById("footer").innerHTML = footerBlock
}
