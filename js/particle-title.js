(function() {
  var canvas, ctx, particles = [], pointer = {}, hasPointer = false;
  var textBox = {};
  var animId = null;
  var interactionRadius = 100;
  var FORCE = 80, DENSITY = 3;
  var COLORS = ['FF8C42', 'FF6B9D', 'A78BFA', '4ECDC4', 'FFD93D'];
  var TEXT = '國中小英文單字王';
  var dpr = window.devicePixelRatio || 1;

  function rand(max, min, dec) {
    max = max || 1; min = min || 0; dec = dec || 0;
    return +(min + Math.random() * (max - min)).toFixed(dec);
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b];
  }

  function Particle(x, y, rgb) {
    this.ox = x; this.oy = y;
    this.cx = x; this.cy = y;
    this.or = rand(4, 1.5);
    this.cr = this.or;
    this.f = rand(FORCE + 15, FORCE - 15);
    this.rgb = rgb ? rgb.map(function(c) { return Math.max(0, Math.min(255, c + rand(13, -13))); }) : [rand(128), rand(128), rand(128)];
  }

  Particle.prototype.draw = function() {
    ctx.fillStyle = 'rgb(' + this.rgb.join(',') + ')';
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.cr, 0, 2 * Math.PI);
    ctx.fill();
  };

  Particle.prototype.move = function() {
    var moved = false;

    if (hasPointer && pointer.x !== undefined && pointer.y !== undefined) {
      var dx = this.cx - pointer.x;
      var dy = this.cy - pointer.y;
      var dist = Math.hypot(dx, dy);
      if (dist < interactionRadius && dist > 0) {
        var force = Math.min(this.f, (interactionRadius - dist) / dist * 2);
        this.cx += (dx / dist) * force;
        this.cy += (dy / dist) * force;
        moved = true;
      }
    }

    var odx = this.ox - this.cx;
    var ody = this.oy - this.cy;
    var od = Math.hypot(odx, ody);

    if (od > 0.5) {
      var restore = Math.min(od * 0.08, 3);
      this.cx += (odx / od) * restore;
      this.cy += (ody / od) * restore;
      moved = true;
    }

    this.draw();
    return moved;
  };

  function dottify() {
    if (!textBox.x || !textBox.w || !textBox.h) return;
    var data = ctx.getImageData(textBox.x, textBox.y, textBox.w, textBox.h).data;
    var w = textBox.w;
    particles = [];

    for (var i = 0; i < data.length; i += 4) {
      var idx = i / 4;
      var px = idx % w;
      var py = Math.floor(idx / w);
      if (data[i + 3] === 0) continue;
      if (px % DENSITY !== 0 || py % DENSITY !== 0) continue;
      var rgb = [data[i], data[i + 1], data[i + 2]];
      var p = new Particle(textBox.x + px, textBox.y + py, rgb);
      p.draw();
      particles.push(p);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var j = 0; j < particles.length; j++) {
      particles[j].draw();
    }
  }

  function write() {
    var wrap = document.querySelector('.particle-title-wrap');
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    var w = rect.width;
    var h = rect.height;

    // Size text to fit width
    var fontSize = Math.floor(w / TEXT.length * 1.1);
    fontSize = Math.min(fontSize, h * 0.8);
    interactionRadius = Math.max(40, fontSize * 1.2);

    ctx.font = '800 ' + fontSize + 'px "Space Grotesk", "DM Sans", "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var measured = ctx.measureText(TEXT);
    textBox.w = Math.ceil(measured.width);
    textBox.h = Math.ceil(fontSize * 1.3);
    textBox.x = Math.floor((w - textBox.w) / 2);
    textBox.y = Math.floor((h - textBox.h) / 2);

    // Gradient
    var grad = ctx.createLinearGradient(textBox.x, textBox.y, textBox.x + textBox.w, textBox.y + textBox.h);
    var N = COLORS.length - 1;
    COLORS.forEach(function(c, i) {
      grad.addColorStop(i / N, '#' + c);
    });
    ctx.fillStyle = grad;
    ctx.fillText(TEXT, w / 2, h / 2);

    dottify();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    var anyMoved = false;
    for (var i = 0; i < particles.length; i++) {
      if (particles[i].move()) anyMoved = true;
    }
    ctx.restore();

    if (anyMoved || hasPointer) {
      animId = requestAnimationFrame(animate);
    } else {
      animId = null;
    }
  }

  function startAnim() {
    if (!animId) animId = requestAnimationFrame(animate);
  }

  function init() {
    canvas = document.getElementById('particle-title-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    write();

    canvas.addEventListener('pointermove', function(e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left);
      pointer.y = (e.clientY - rect.top);
      hasPointer = true;
      startAnim();
    });

    canvas.addEventListener('pointerleave', function() {
      hasPointer = false;
      pointer.x = undefined;
      pointer.y = undefined;
      startAnim();
    });

    canvas.addEventListener('pointerenter', function() {
      hasPointer = true;
    });

    // Touch support
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var touch = e.touches[0];
      pointer.x = (touch.clientX - rect.left);
      pointer.y = (touch.clientY - rect.top);
      hasPointer = true;
      startAnim();
    }, { passive: false });

    canvas.addEventListener('touchend', function() {
      hasPointer = false;
      pointer.x = undefined;
      pointer.y = undefined;
      startAnim();
    });

    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        particles = [];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        write();
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
