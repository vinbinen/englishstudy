document.addEventListener('copy', function() {
                var contents = window.getSelection().toString();
          //alert(contents);      
	
		document.getElementById("readcopy").innerHTML="<audio autoplay src='http://dict.youdao.com/dictvoice?type=1&audio="+contents+"'>+"

"+</audio>";
               // alert(contents);
})