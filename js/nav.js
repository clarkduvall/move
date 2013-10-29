$(function() {
  var $nav = $('nav'),
      $canvas = $('<canvas></canvas>').appendTo($('.container')).css({
        width: '100%',
        height: $nav.outerHeight(),
        position: 'absolute',
        top: 0,
        'z-index': -1
      }),
      canvas = $canvas[0],
      width = $canvas.width(),
      height = $canvas.height(),
      controller = new Move.Controller({
        context: canvas.getContext('2d'),
        trace: true
      });

  canvas.width = $canvas.width();
  canvas.height = $canvas.height();

  controller.addSystem(new Move.System({
    numParticles: 100,
    rules: [
      Move.Rules.wall(width, 'x'),
      Move.Rules.wall(0, 'x')
    ],

    newParticle: function(numParticles) {
      return new Move.Particle({
        pos: new Move.Vector({
          y: _.random(height)
        }),
        vel: new Move.Vector({
          x: numParticles * 2 + 10
        }),
        init: function() {
          this.gInc = true;
        },
        draw: function(ctx, opacity, pos) {
          ctx.fillStyle = 'rgba(' + this.r + ', ' + this.g + ', ' + this.b +
            ', ' + (this.a * opacity) + ')';
          ctx.fillRect(pos.x - this.size / 2, pos.y - this.size / 2,
              this.size * 5, this.size);
        },
        preUpdate: function(delta) {
          this.g += this.gInc ? 1 : -1;

          if (this.g === 255 || this.g === 0) {
            this.gInc = !this.gInc;
          }
        },
        size: 3,
        r: 0,
        g: 0,
        b: 0
      });
    }
  })).start();

});
