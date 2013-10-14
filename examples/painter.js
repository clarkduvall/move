var $canvas = $('#canvas'),
    ctx = $canvas[0].getContext('2d'),
    width = $canvas.width(),
    height = $canvas.height(),

    // Create a new Controller that's in charge of Systems.
    controller = new Move.Controller({
      // The context this controller draws on.
      context: ctx,

      // Don't clear the canvas each frame.
      trace: true
    }),

    painters = new Move.System({
      numParticles: 1000,
      setContext: function(ctx) {
        ctx.globalCompositeOperation = 'source-atop';
      },
      newParticle: function(num) {
        var angle = Math.random() * Math.PI * 2,
            strength = Math.random() * 100;
        return new Move.Particle({
          // Random position.
          pos: new Move.Vector({
            x: _.random(width),
            y: _.random(height)
          }),
          // Random velocity.
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          // Random color.
          r: _.random(255),
          g: _.random(255),
          b: _.random(255),

          size: 10
        });
      }
    }),

    wanderer = new Move.System({
      numParticles: 1,
      setContext: function(ctx) {
        ctx.globalCompositeOperation = 'destination-over';
      },
      rules: [
        Move.Rules.wallX(width),
        Move.Rules.wallX(0),
        Move.Rules.wallY(height),
        Move.Rules.wallY(0)
      ],
      newParticle: function(num) {
        var angle = Math.random() * Math.PI * 2,
            strength = Math.random() * 100 + 100;
        return new Move.Particle({
          // Start in the middle.
          pos: new Move.Vector({
            x: width / 2,
            y: height / 2
          }),
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          size: 20,
          trail: 5,
          r: 255, g: 80, b: 80
        });
      }
    });

for (var i = 0; i < wanderer.particles.length; i++) {
  // Each painter is attracted to the wanderer.
  painters.addRule(Move.Rules.attract(1, wanderer.particles[i].pos));
}

// Clear the canvas after we start to make sure we get everything.
setTimeout(function() {
  ctx.clearRect(0, 0, width, height);
}, 100);

controller.addSystem(painters).addSystem(wanderer).start();
