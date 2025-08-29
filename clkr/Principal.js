let val = 100000000
let inc = 1
let mul = 1
let up1 = 10
let up2 = 100
let up3 = 1000
let up4 = 10000
let up5 = 100000
let up6 = 1000000
let mu1 = 50000
let mu2 = 2000000

let fim = inc*mul

setInterval(atl(),1)
function abreviar(num){
if (num>=1000000000000000){
    return (num / 1000000000000000).toFixed(1).replace(/\.0$/, "") + "Q";
}
else if (num>=1000000000000){
    return (num / 1000000000000).toFixed(1).replace(/\.0$/, "") + "T";
}
else if (num>=1000000000){
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
}
else if (num>=1000000){
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
}
else if (num>=1000){
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
}
else if (num<1000){
    return num.toString();
}
}

function din() {
val = val+(inc*mul)
}

function upg1(){
    if (val>=up1){    
    inc=inc+1
    val = val-up1
    up1 = up1 * 1.3
    up1 = Math.ceil(up1);
    document.getElementById("up1").textContent = "Upgrade 1: " + abreviar(up1);
    }
}

function upg2(){
    if (val>=up2){    
    inc=inc+10
    val = val-up2
    up2 = up2 * 1.3
    up2 = Math.ceil(up2);
    document.getElementById("up2").textContent = "Upgrade 2: " + abreviar(up2);
    }
}

function upg3(){
    if (val>=up3){    
    inc=inc+100
    val = val-up3
    up3 = up3 * 1.3
    up3 = Math.ceil(up3);
    document.getElementById("up3").textContent = "Upgrade 3: " + abreviar(up3);
    }
}

function upg4(){
    if (val>=up4){    
    inc=inc+1000
    val = val-up4
    up4 = up4 * 1.3
    up4 = Math.ceil(up4);
    document.getElementById("up4").textContent = "Upgrade 4: " + abreviar(up4);
    }
}
        
function upg5(){
    if (val>=up5){    
    inc=inc+10000
    val = val-up5
    up5 = up5 * 1.3
    up5 = Math.ceil(up5);
    document.getElementById("up5").textContent = "Upgrade 5: " + abreviar(up5);
    }
}
    
function upg6(){
    if (val>=up6){    
    inc=inc+100000
    val = val-up6
    up6 = up6 * 1.3
    up6 = Math.ceil(up6);
    document.getElementById("up6").textContent = "Upgrade 6: " + abreviar(up6);
    }
}

function multi1(){
    if (val>=mu1){    
    mul=mul+1
    val = val-mu1
    mu1 = mu1 * 9
    mu1 = Math.ceil(mu1);
    document.getElementById("mult1").textContent = "Multiplicador 1: " + abreviar(mu1);
    }
}
function multi2(){
    if (val>=mu2){    
    mul=mul+5
    val = val-mu2
    mu2 = mu2 * 15
    mu2 = Math.ceil(mu2);
    document.getElementById("mult2").textContent = "Multiplicador 2: " + abreviar(mu2);
    }
}

function atl() {
    document.getElementById("medidor").textContent = abreviar(val);
    document.getElementById("medicli").textContent = "Poder do click: " + (inc * mul);
    document.getElementById("up1").textContent = "Upgrade 1: " + abreviar(up1);
    document.getElementById("up2").textContent = "Upgrade 2: " + abreviar(up2);
    document.getElementById("up3").textContent = "Upgrade 3: " + abreviar(up3);
    document.getElementById("up4").textContent = "Upgrade 4: " + abreviar(up4);
    document.getElementById("up5").textContent = "Upgrade 5: " + abreviar(up5);
    document.getElementById("up6").textContent = "Upgrade 6: " + abreviar(up6);
    document.getElementById("mult1").textContent = "Multiplicador 1: " + abreviar(mu1);
    document.getElementById("mult2").textContent = "Multiplicador 2: " + abreviar(mu2);
}

setInterval(atl,100)