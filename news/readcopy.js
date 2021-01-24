document.addEventListener('copy', function() {
                var contents = window.getSelection().toString();
          //alert(contents);      
	
		document.getElementById("readcopy").innerHTML="<audio autoplay src='http://dict.youdao.com/dictvoice?type=1&audio="+contents+"'>+"

"+</audio>";
               // alert(contents);
               
               document.getElementById("contentes").innerHTML="<iframe width='400' height='300' src='http://dict.youdao.com/search?q="+contents+"&keyfrom=new-fanyi.smartResult'></iframe>";
    contentes.style.display = "block";
       /*var a = document.querySelector("iframe");
        var b = a.contentWindow.document;
        var results=b.getElementById("fanyiToggle");
        document.getElementById("showresult").innerHTML=results;
        */
        
       /* window.open ("http://dict.youdao.com/search?q="+contents+"&keyfrom=new-fanyi.smartResult", 'newwindow', 'height=100, width=400, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no')  
        */
        
})