var $canvas = $('#canvas'),
    width = $canvas.width(),
    height = $canvas.height(),
    numFireworks = 5,

    // Create a new Controller that's in charge of Systems.
    controller = new Move.Controller({
      // The context this controller draws on.
      context: $canvas[0].getContext('2d'),

      // The speed the simulation will run.
      speed: 5
    });

function createFirework() {
  // Start at a random position on the canvas.
  var x = _.random(width),
      y = _.random(height);

  // Create a new particle system.
  return new Move.System({
    // Each firework has |numParticles| particles.
    numParticles: 40,

    // Set the context before drawing for different effects.
    setContext: function(ctx) {
      ctx.globalCompositeOperation = 'lighter';
    },

    // Configure the rules that govern the particle system.
    rules: [
      Move.Rules.gravity(2),
      Move.Rules.resistance(.1),
    ],

    // Set function to run when a particle dies.
    onDeath: function() {
      // Check if all particles are dead.
      if (this.particles.length === 0) {

        // Move to a new spot.
        x = _.random(width);
        y = _.random(height);

        // Reset the system.
        this.reset();
      }
    },

    // Specify the function used to create a new Particle in this System.
    newParticle: function(num) {

      // Choose a random point on a circle.
      var angle = Math.random() * Math.PI * 2,
          strength = Math.random() * 30;

      // Create a new Particle.
      return new Move.Particle({

        // Position starts at the center of the firework.
        pos: new Move.Vector({x: x, y: y}),

        // Velocity follows the angle chosen above.
        vel: new Move.Vector({
          x: Math.cos(angle) * strength,
          y: Math.sin(angle) * strength
        }),

        // Random color.
        r: _.random(255),
        b: _.random(255),
        g: _.random(255),

        // Size of the particle.
        size: 4,

        // A particle trail gives a blur effect.
        trail: 10,

        // Custom draw function that decreases opacity closer to death.
        draw: function(ctx, opacity, pos) {
            opacity = opacity * (1 - this.lifespan / this.death);
            this.defaults.draw(ctx, opacity, pos);
        },

        // Function called before particle update.
        preUpdate: function(delta) {
          this.lifespan += delta;
        },

        // Init function called when particle is created that can add particle
        // specific variables.
        init: function() {
          this.death = _.random(25, 40);
          this.lifespan = 0;
        },

        // Checks if the particle is dead or not.
        isDead: function() {
          return this.lifespan > this.death;
        }
      });
    }
  });
}

// Create some fireworks.
for (var i = 0; i < numFireworks; i++) {
  controller.addSystem(createFirework());
}

// Start the simulation!
controller.start();
