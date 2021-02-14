    //通过button按钮的id获取点击事件
    document.getElementById("btn").onclick = function () {
        //使用if判断，判断button按钮的value属性
        if (this.value === "隐藏") {
            // 如果是隐藏，那么点击后通过div盒子的id修改css样式，将display属性值改为none
            document.getElementById("dv").style.display = "none";
            //this关键字获取的是当前对象  通过this关键字来修改button的value值
            this.value = "显示";
        } else if (this.value === "显示") {
            // 如果是显示，那么点击后通过div盒子的id修改css样式，将display属性值改为block
            document.getElementById("dv").style.display = "block";
            //this关键字获取的是当前对象  通过this关键字来修改button的value值
            this.value = "隐藏";
        }
    };
