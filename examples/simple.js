// <-- Select another option to see more!
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

  // Set rules.
  rules: [
    // Wall on the bottom.
    Move.Rules.wall(height, 'y'),

    // Wall on the top.
    Move.Rules.wall(0, 'y')
  ],

  // Specify the function used to create a new Particle in this System.
  newParticle: function(numParticles) {

    // Create a new Particle.
    return new Move.Particle({
      // Random x position, y defaults to 0.
      pos: new Move.Vector({
        x: _.random(width)
      }),

      // y velocity will equal the number of particles currently in the system.
      vel: new Move.Vector({
        y: numParticles
      }),

      // Set color to green.
      r: 0,
      g: 255,
      b: 0
    });
  }
}));

// Start it up!
controller.start();
