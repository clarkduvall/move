$(function() {
  function createCanvasAndGetCtx(cls, w, h) {
    return $('<canvas class="' + cls + '" width="' + w + '" height="' +
      h + '"></canvas>').appendTo('body')[0].getContext('2d');
  }

  function createPausePlay(ctrl) {
    $('<br>').appendTo('body');
    $('<button>Play</button>').appendTo('body').on('click', function() {
      ctrl.start();
    });
    $('<button>Pause</button>').appendTo('body').on('click', function() {
      ctrl.pause();
    });
    $('<button>Reset</button>').appendTo('body').on('click', function() {
      ctrl.reset();
      ctrl.clear();
    });
  }

  var width = 800,
      height = 500;

  ///////////////
  // Fireworks //
  ///////////////
  function firework() {
    var x = _.random(width), y = _.random(height);
    return new Move.System({
      numParticles: 40,
      setContext: function(ctx) {
        ctx.globalCompositeOperation = 'lighter';
      },
      rules: [
        Move.Rules.gravity(2),
        Move.Rules.resistance(.1),
      ],
      onDeath: function() {
        if (this.particles.length === 0) {
          x = _.random(width);
          y = _.random(height);
          this.reset();
        }
      },
      newParticle: function(num) {
        var angle = _.random(0, 628) / 100,
            strength = _.random(30);
        return new Move.Particle({
          pos: new Move.Vector({x: x, y: y}),
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          r: _.random(255),
          b: _.random(255),
          g: _.random(255),
          size: 4,
          trail: 10,
          draw: function(ctx, opacity, pos) {
              opacity = opacity * (1 - 1000 * this.lifespan / this.death);
              this.defaults.draw(ctx, opacity, pos);
          },
          preUpdate: function(delta) {
            this.lifespan += delta;
          },
          init: function() {
            this.death = _.random(5000, 8000) * 5;
            this.lifespan = 0;
          },
          isDead: function() {
            return this.lifespan * 1000 > this.death;
          }
        });
      }
    });
  }

  $('<h2>Fireworks</h2>').appendTo('body');
  var numFireworks = 5,
      controller1 = new Move.Controller({
        context: createCanvasAndGetCtx('black', width, height),
        speed: 5
      });

  for (var i = 0; i < numFireworks; i++) {
    controller1.addSystem(firework(800, 500));
  }

  createPausePlay(controller1);


  ////////////////////
  // Worms in holes //
  ////////////////////
  $('<h2>Worms</h2>').appendTo('body');
  var controller2 = new Move.Controller({
        context: createCanvasAndGetCtx('black', width, height),
        speed: 2
      });

  controller2.addSystem(new Move.System({
    numParticles: 40,
    setContext: function(ctx) {
      ctx.globalCompositeOperation = 'darker';
    },
    rules: [
      Move.Rules.resistance(.05),
      Move.Rules.attract(.01),
      Move.Rules.wallX(width + 1),
      Move.Rules.wallX(-1),
      Move.Rules.wallY(height + 1),
      Move.Rules.wallY(-1)
    ],
    newParticle: function(num) {
      var angle = _.random(0, 628) / 100,
          strength = _.random(10);
      return new Move.Particle({
        pos: new Move.Vector({x: 400, y: 100}),
        vel: new Move.Vector({
          x: Math.cos(angle) * strength,
          y: Math.sin(angle) * strength
        }),
        origPos: new Move.Vector({
          x: _.random(width),
          y: _.random(height)
        }),
        size: 2,
        trail: 100,
        draw: function(ctx, opacity, pos) {
            this.defaults.draw(ctx, opacity, pos);
            ctx.beginPath();
            ctx.arc(this.origPos.x, this.origPos.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'purple';
            ctx.fill();
        }
      });
    }
  }));

  createPausePlay(controller2);

  //////////
  // Bugs //
  //////////
  function bugs() {
    var x = _.random(width), y = _.random(height);
    return new Move.System({
      numParticles: 400,
      rules: [
        Move.Rules.attract(.01),
        Move.Rules.wallX(width + 1),
        Move.Rules.wallX(-1),
        Move.Rules.wallY(height + 1),
        Move.Rules.wallY(-1)
      ],
      newParticle: function(num) {
        var angle = _.random(0, 628) / 100,
            strength = _.random(10000) / 1000;
        return new Move.Particle({
          pos: new Move.Vector({x: x, y: y}),
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          origPos: new Move.Vector({
            x: _.random(width),
            y: _.random(height)
          }),
          size: 2,
          trail: 0,
          r: 0, g: 0, b: 0
        });
      }
    });
  }
  $('<h2>Bugs</h2>').appendTo('body');
  var controller3 = new Move.Controller({
        context: createCanvasAndGetCtx('', width, height),
        speed: 5
      });

  for (var i = 0; i < 5; i++) {
    controller3.addSystem(bugs());
  }


  createPausePlay(controller3);

  ///////////////////
  // Painting Ball //
  ///////////////////
  function bugs2() {
    var x = _.random(width), y = _.random(height);
    return new Move.System({
      numParticles: 2000,
      setContext: function(ctx) {
        ctx.globalCompositeOperation = 'source-atop';
      },
      newParticle: function(num) {
        var angle = _.random(0, 628) / 100,
            strength = _.random(10000) / 100;
        return new Move.Particle({
          pos: new Move.Vector({x: x, y: y}),
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          origPos: new Move.Vector({
            x: _.random(width),
            y: _.random(height)
          }),
          size: 10,
          r: _.random(255), g: _.random(255), b: _.random(255)
        });
      }
    });
  }

  function bigBug() {
    return new Move.System({
      numParticles: 1,
      setContext: function(ctx) {
        ctx.globalCompositeOperation = 'xor';
      },
      rules: [
        Move.Rules.wallX(width + 1),
        Move.Rules.wallX(-1),
        Move.Rules.wallY(height + 1),
        Move.Rules.wallY(-1)
      ],
      newParticle: function(num) {
        var angle = _.random(0, 628) / 100,
            strength = _.random(2000, 8000) / 100;
        return new Move.Particle({
          pos: new Move.Vector({x: width / 2, y: height / 2}),
          vel: new Move.Vector({
            x: Math.cos(angle) * strength,
            y: Math.sin(angle) * strength
          }),
          size: 20,
          trail: 5,
          r: 255, g: 0, b: 0
        });
      }
    });
  }

  $('<h2>Painting Ball</h2>').appendTo('body');
  var controller4 = new Move.Controller({
        context: createCanvasAndGetCtx('', width, height),
        speed: 5,
        trace: true
      }),
      bigSystem = bigBug();

  var system = bugs2();
  for (var j = 0; j < bigSystem.particles.length; j++) {
    system.addRule(Move.Rules.magnet(500, bigSystem.particles[j].pos));
  }
  controller4.addSystem(system);
  controller4.addSystem(bigSystem);


  createPausePlay(controller4);
});
