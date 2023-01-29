/************************************************
 * Happy Clock
 */
var W = g.getWidth(),R=W/2;
var H = g.getHeight();
var drawTimeout;


/*
 * Based on the great multi clock from https://github.com/jeffmer/BangleApps/
 */
Graphics.prototype.drawRotRect = function(cx, cy, r1, r2, angle) {
    angle = angle % 360;
    var theta=angle*Math.PI/180;
    var x = parseInt(cx+r1*Math.sin(theta)*1.2);
    var y = parseInt(cy-r1*Math.cos(theta)*1.2);

    g.setColor(g.theme.fg);
    g.fillCircle(cx, cy, 32);
    g.setColor(g.theme.bg);
    g.fillCircle(cx, cy, 28);

    g.setColor(g.theme.fg);
    g.fillCircle(x, y, 12);
};

let drawEyes = function(){
    // And now the analog time
    var drawHourHand = g.drawRotRect.bind(g,55,70,12,R-38);
    var drawMinuteHand = g.drawRotRect.bind(g,125,70,12,R-12);

    g.setFontAlign(0,0);

    // Compute angles
    var date = new Date();
    var m = parseInt(date.getMinutes() * 360 / 60);
    var h = date.getHours();
    h = h > 12 ? h-12 : h;
    h += date.getMinutes()/60.0;
    h = parseInt(h*360/12);

    // Draw minute and hour fg
    g.setColor(g.theme.fg);
    drawHourHand(h);
    drawMinuteHand(m);
}

function quadraticCurve(t, p0x, p0y, p1x, p1y, p2x, p2y){
    var t2 = t * t;
    var oneMinT = 1 - t;
    var oneMinT2 = oneMinT * oneMinT;
    return {
      x: p0x * oneMinT2 + 2 * p1x * t * oneMinT + p2x *t2,
      y: p0y * oneMinT2 + 2 * p1y * t * oneMinT + p2y *t2
    };
}

let drawSmile = function(isLocked){
    var w = 8;
    var y = 120;
    var o = parseInt(E.getBattery()*0.8);

    var isConnected = NRF.getSecurityStatus().connected;
    for(var i = 0; i < w; i++){
        drawCurve(30, y+i, W/2+10, y+i+o, W-40, y+i);
    }

    for(var i=0; i < w-2; i++){
        if(isLocked) g.drawLine(25, y+5+i, 35, y-5+i);
        if(isConnected) g.drawLine(W-35, y+5+i, W-45, y-5+i);
    }
}

let drawEyeBrow = function(){
    var w = 4;
    var steps = Bangle.getHealthStatus("day").steps;
    var reached = steps / 10000.0;
    reached = 1.1;
    for(var i = 0; i < w; i++){
        if(reached > 0.5) g.drawLine(25, 25+i, 70, 15+i);
        if(reached > 1.0) g.drawLine(W-25, 25+i, W-70, 15+i);
    }
}

// Thanks to user stephaneAG from the Espruino forum!
// https://forum.espruino.com/conversations/330154/#comment14593349
let drawCurve = function(x1, y1, x2, y2, x3, y3){
    var p0 = { x: x1, y: y1};
    var p1 = { x: x2, y: y2};
    var p2 = { x: x3, y: y3};
    var time = 0;
    //var stepping = 0.005; // seems the nicest
    //var stepping = 0.05; // a little less neat, yet faster
    var stepping = 0.1; // quick enough ?
    var pathPts = [];
    for(time = 0; time <= 1; time+= stepping){
      var pos = quadraticCurve(time, p0.x, p0.y, p1.x, p1.y, p2.x, p2.y);
      pathPts.push(pos.x, pos.y);
    }
    g.drawPoly(pathPts, false);
    g.flip();
}


let draw = function(){
    // Queue draw in one minute
    queueDraw();

    var isLocked = Bangle.isLocked();
    drawHelper(isLocked);
}

let drawHelper = function(isLocked){
    g.setColor(g.theme.fg);
    g.reset().clear();

    drawEyes();
    drawSmile(isLocked);
    drawEyeBrow();
}


/*
 * Listeners
 */
Bangle.on('lcdPower',on=>{
    if (on) {
        draw();
    } else { // stop draw timer
        if (drawTimeout) clearTimeout(drawTimeout);
        drawTimeout = undefined;
    }
});

Bangle.on('lock', function(isLocked) {
    draw(isLocked);
});


/*
 * Some helpers
 */
let queueDraw = function() {
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = setTimeout(function() {
      drawTimeout = undefined;
      draw();
    }, 60000 - (Date.now() % 60000));
}


/*
 * Lets start widgets, listen for btn etc.
 */
// Show launcher when middle button pressed
Bangle.setUI("clock");
Bangle.loadWidgets();
/*
 * we are not drawing the widgets as we are taking over the whole screen
 * so we will blank out the draw() functions of each widget and change the
 * area to the top bar doesn't get cleared.
 */
require('widget_utils').hide();

// Clear the screen once, at startup and draw clock
// g.setTheme({bg:"#fff",fg:"#000",dark:false});
draw();

// After drawing the watch face, we can draw the widgets
// Bangle.drawWidgets();
