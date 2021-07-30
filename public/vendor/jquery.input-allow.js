/* jquery.input-allow v0.1.0

The MIT License (MIT)
Copyright (c) 2015 Jason Yung

*/

$(function() {
	var patt,elem;

	$('body')
	.delegate('input[allow]','focus',function(event) {
		elem = $(event.target);
		patt = new RegExp(elem.attr('allow'));
		console.log("jquery.input-allow","[allow] pattern detected:",patt);
	})
	.delegate('input[allow]','keypress',function(event) {
		if(event.keyCode == 13) return true; //edge case: enter key

		var char = String.fromCharCode(event.keyCode);	
		console.log("jquery.input-allow","matching '",char,"' against",patt);		
		
		var pass = patt.test(char);
		if (!pass) elem.trigger('input-allow.fail'); //hook for denied keys
		else elem.trigger('input-allow.pass'); //hook for accepted keys

		return pass;
	})
	.delegate('input-allow.fail', 'input[allow]',function(event){
		console.log("jquery.input-allow","event 'input-allow.fail' was triggered");
	})
	.delegate('input-allow.pass', 'input[allow]',function(event){
		console.log("jquery.input-allow","event 'input-allow.pass' was triggered");
	})

});