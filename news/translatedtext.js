document.getElementById("btn").onclick = function () {
        
        if (this.value === "隐藏译文") {
          
            for(var i =0;i<=30;i++){
            document.getElementById("dv"+i).style.display = "none";
        
            this.value = "显示译文";}
        } else if (this.value === "显示译文") {
           
            for(var i =0;i<=30;i++){
            document.getElementById("dv"+i).style.display = "block";
            
            this.value = "隐藏译文";}
        }
    };
