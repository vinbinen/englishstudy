  (function() {
        'use strict';
        var Moveout = document.getElementById("Moveout");
            var content = document.getElementById("content");
        var video = document.getElementById("my-audio-stream");
        var rateOutput = document.getElementById('rateOutput');
        var rateSlider = document.getElementById('rateSlider');
       
        
        rateSlider.onchange = function(event) {
            // When the slider is moved, changed the video's playback rate
            video.playbackRate = rateSlider.value;
        };
        
        video.onplay = function(event) {
            // We can only change the playbackRate once the video has started playing
            video.playbackRate = rateSlider.value;
        };
        
        video.onratechange = function(event) {
            // When the playback rate changes, display the new value
            rateOutput.textContent = video.playbackRate;
            
            // And let's have some colourful fun while we're here
            //document.body.style.background = 'hsl(' + (video.playbackRate * 180) + ', 50%, 15%)';
        };
        
           //鼠标移入显示
        Moveout.onmouseover = function () {
            content.style.display = "block";
        }
        function Moveoutsover() {
            content.style.display = "block";
        }
        //鼠标移出隐藏
        Moveout.onmouseout = function () {
            content.style.display = "none";
        }              
        function MoveoutSout() {
            content.style.display = "none";
        }
            
            

        
//         video.ontouchstart = function(event){
//         video.controls = true;
//          };
            
//         video.ontouchend = function(event){
//         video.controls = false;
//        };
        
        rateOutput.textContent = rateSlider.value;
    })();