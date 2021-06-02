document.addEventListener('copy', function() {
                var contents = window.getSelection().toString();
          //alert(contents);      
	
	/*document.getElementById("readcopy").innerHTML="<audio autoplay id='vd'  src='http://dict.youdao.com/dictvoice?type=1&audio="+contents+"'>+"
"+</audio>";*/

document.getElementById("readcopy").innerHTML="<audio autoplay id='vd'  src='http://dict.youdao.com/dictvoice?&le=eng&audio="+contents+"&product=fanyiguan&appVersion=3.10.14&abtest=-1&keyfrom=fanyi.3.10.14.android&vendor=oppo&mid=10&screen=1080x2132&imei=CQkyZGQzY2I4NjZkOGQ3MDY2CXVua25vd24%253D&model=PBEM00&network=wifi'>+"
"+</audio>";

//jude if play
/*http://dict.youdao.com/dictvoice?&le=eng&audio=The+most&product=fanyiguan&appVersion=3.10.14&abtest=-1&keyfrom=fanyi.3.10.14.android&vendor=oppo&mid=10&screen=1080x2132&imei=CQkyZGQzY2I4NjZkOGQ3MDY2CXVua25vd24%253D&model=PBEM00&network=wifi*/


            var music = document.getElementById("vd");//获取ID  
            if (music.paused) { //判读是否播放  
                music.paused=false;
                music.play(); //没有就播放
            }  
            
            /*function toggleSound() {
            var music = document.getElementById("vd");//获取ID  
                console.log(music);
                console.log(music.paused);
            if (music.paused) { //判读是否播放  
                music.paused=false;
                music.play(); //没有就播放
            }  
            
        }

window.setTimeout("toggleSound()",4000);
            
        */

            
        

               
               document.getElementById("contentes").innerHTML="<iframe width='400' height='300' src='http://dict.youdao.com/search?q="+contents+"&keyfrom=new-fanyi.smartResult'></iframe>";
  /*  document.getElementById("contentes").innerHTML="<iframe width='400' height='300' src='http://vocab.com/"+contents+"&keyfrom=new-fanyi.smartResult'></iframe>";*/
    contentes.style.display = "block";
      
        
 
  


})