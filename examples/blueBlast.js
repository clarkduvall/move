var $canvas = $('#canvas'),
    width = $canvas.width(),
    height = $canvas.height(),

    // Create a new Controller that's in charge of Systems.
    controller = new Move.Controller({
      // The context this controller draws on.
      context: $canvas[0].getContext('2d'),
    });

// Create a new particle system and add it to our Controller.
controller.addSystem(new Move.System({

  // Set the number of particles.
  numParticles: 500,

  // Draw the flashing blue dot in the middle after everything is drawn.
  postDraw: function(ctx) {
    ctx.fillStyle = 'rgb(0, 0, ' + _.random(255) + ');';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  },

  // Initialize variables relating to this system.
  init: function() {
    this.accumulator = 0;
    this.state = 'falling';
  },

  // Use postUpdate() to control special events.
  postUpdate: function(delta) {
    this.accumulator += delta;

    // If we are falling for more than 5 seconds, send out a blast.
    if (this.state === 'falling' && this.accumulator >= 5) {
      _.each(this.particles, function(p) {
        p.vel = new Move.Vector({
          x: p.pos.x - width / 2,
          y: p.pos.y - height / 2
        });
        p.vel.multiplyScalar(3);
      });
      this.state = 'blasting';
      this.accumulator = 0;

    // 1 second after the blast, reset the system.
    } else if (this.state === 'blasting' && this.accumulator >= 1) {
      this.reset();
      this.state = 'falling';
      this.accumulator = 0;
    }
  },

  // Set rules.
  rules: [
    // Particles will be attracted to the center...
    Move.Rules.attract(2, new Move.Vector({x: width / 2, y: height / 2})),

    // But will be repulsed if they get too close.
    Move.Rules.magnet(-100000,
        new Move.Vector({x: width / 2, y: height / 2}))
  ],

  // Specify the function used to create a new Particle in this System.
  newParticle: function(numParticles) {

    // Create a new Particle.
    return new Move.Particle({
      // Random x position, y defaults to 0.
      pos: new Move.Vector({
        x: _.random(width)
      }),

      // y velocity will equal the number of particles currently in the
      // system.
      vel: new Move.Vector({
        y: numParticles
      }),

      // Set the size of the particle to 10.
      size: 10,

      // Set color to random without any blue.
      r: _.random(255),
      g: _.random(255),
      b: 0
    });
  }
}));

// Start it up!
controller.start();
