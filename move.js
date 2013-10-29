(function() {
  var root = this,
      Move,
      requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;

  root.Move = Move = {};

  /// class Vector
  /// A simple 3D vector.
  ///
  ///     var v = new Move.Vector({x: 10, y: 0, z: 5});
  ///     v.multiplyScalar(2);
  ///     console.log(v.x);
  ///     > 20
  ///
  /// Params:
  ///   options {Object}: Options to initialize this |@Vector|.
  ///     Properties:
  ///       [x] (0) {Number}: x coordinate
  ///       [y] (0) {Number}: y coordinate
  ///       [z] (0) {Number}: z coordinate
  function Vector(options) {
    options || (options = {});
    _.defaults(options, {x: 0, y: 0, z: 0});
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;
  }

  /// function Vector.add
  /// Add two |@Vectors| together.
  ///
  /// Params:
  ///   other {@Vector}: The |@Vector| to add.
  ///
  /// Returns:
  ///   {@Vector}: |this|
  Vector.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  };

  /// function Vector.sub
  /// Subtracts one |@Vector| from another.
  ///
  /// Params:
  ///   other {@Vector}: The |@Vector| to subtract.
  ///
  /// Returns:
  ///   {@Vector}: |this|
  Vector.prototype.sub = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  };

  /// function Vector.mulitplyScalar
  /// Multiplies this |@Vector| by a scalar.
  ///
  /// Params:
  ///   scalar {Number}: The scalar to multiply by.
  ///
  /// Returns:
  ///   {@Vector}: |this|
  Vector.prototype.multiplyScalar = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  };

  /// function Vector.length
  /// Gets the length of this |@Vector|.
  ///
  /// Returns:
  ///   {@Vector}: |this|
  Vector.prototype.length = function() {
    return Math.sqrt(this.lengthSq());
  };

  /// function Vector.lengthSq
  /// Gets the squared length of this |@Vector|.
  ///
  /// Returns:
  ///   {@Vector}: |this|
  Vector.prototype.lengthSq = function() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  };

  Move.Vector = Vector;

  /// class Controller
  /// Handles everything relating to a single canvas.
  ///
  ///     var controller = new Move.Controller({
  ///         context: document.getElementById('canvas').getContext('2d')
  ///     });
  ///
  ///     controller.addSystem(new Move.System({...}));
  ///     controller.start();
  ///
  /// Params:
  ///   options {Object}: Options for the controller.
  ///     Properties:
  ///       context {Context2D}: The context this controller will draw on.
  ///
  ///       [trace] (false) {Boolean}: Whether the canvas will be cleared every
  ///           frame.
  ///
  ///       [speed] (1) {Number}: The speed the simulation moves at.
  ///
  ///       [draw] (@Controller.draw) {Function}: The function used to draw the
  ///           particle systems this controller handles to the canvas.
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [preDraw] {Function}: Called right before draw().
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [postDraw] {Function}: Called right after draw().
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [setContext] {Function}: Sets up the context before any
  ///           draw calls are made.
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  function Controller(options) {
    var that = this;

    options || (options = {});
    _.defaults(options, {
      trace: false,
      speed: 1,
      draw: Controller.prototype.draw,
      preDraw: function(ctx) {},
      postDraw: function(ctx) {},
      setContext: function(ctx) {},
    });

    /// property Controller.systems {@System[]}
    /// The |@Systems| this controller is in charge of.
    this.systems = [];

    if (!options.context && !options.draw) {
      throw "Move.Controller requires a 2D context or custom draw function."
    }

    _.each(['trace', 'context', 'preDraw', 'postDraw', 'draw', 'setContext',
            'speed'], function(name) {
      that[name] = options[name];
    });

    _.bindAll(this, 'step');
  }

  Controller.prototype.update = function(delta) {
    _.each(this.systems, function(system) {
      system.update(delta);
    });
  };

  /// function Controller.reset
  /// Resets the |@Systems| this controller is in charge of.
  Controller.prototype.reset = function() {
    _.each(this.systems, function(system) {
      system.reset();
    });
  };

  /// function Controller.addSystem
  /// Adds a system to this controller.
  ///
  /// Params:
  ///   system {@System}: The system to add.
  Controller.prototype.addSystem = function(system) {
    this.systems.push(system);
    return this;
  };

  /// function Controller.start
  /// Begin or resume the simulation.
  Controller.prototype.start = function() {
    this.paused = false;
    this.step(0);
  };

  /// function Controller.pause
  /// Pause the simulation.
  Controller.prototype.pause = function() {
    this.paused = true;
  };

  Controller.prototype.step = function(ms) {
    var delta = 0;

    if (ms) {
      delta = (ms - this.lastStep) * 0.001;
      this.lastStep = ms;
    }

    // Must have switched tabs.
    if (delta < .1) {
      this.update(delta * this.speed);
      this.draw(this.context);
    }

    if (!this.paused) {
      requestAnimationFrame(this.step);
    }
  };

  Controller.prototype.clear = function() {
      this.context.clearRect(0, 0, this.context.canvas.width,
        this.context.canvas.height);
  };

  /// function Controller.draw
  /// Draws the systems this controller is in charge of to the canvas.
  ///
  /// Params:
  ///   ctx {Context2D}: The context to draw on.
  Controller.prototype.draw = function(ctx) {
    ctx.save();

    if (!this.trace) {
      this.clear();
    }

    this.setContext(ctx);

    this.preDraw(ctx);

    _.each(this.systems, function(system) {
      system.draw(ctx);
    });

    this.postDraw(ctx);

    ctx.restore();
  };

  Move.Controller = Controller;

  /// class System
  /// A particle system.
  ///
  ///     var system = new Move.System({
  ///         numParticles: 100,
  ///         rules: [...],
  ///         newParticle: function(numParticles) {
  ///             return new Move.Particle({...});
  ///         }
  ///     });
  ///
  ///     controller.addSystem(system);
  ///
  /// Params:
  ///   options {Object}: Options for the system.
  ///     Properties:
  ///       newParticle {Function}: Creates a new |@Particle| for the system.
  ///         Params:
  ///           numParticles {Number}: The current number of particles in the
  ///               system.
  ///
  ///       [numParticles] (0) {Number}: The number of particles to start this
  ///           system with.
  ///
  ///       [rules] ([]) {Function[]}: The starting set of |@Rules| for this
  ///           system.
  ///
  ///       [preDraw] {Function}: Called right before the |@Particles| in the
  ///           system are drawn.
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [postDraw] {Function}: Called right after the |@Particles| in the
  ///           system are drawn.
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [preUpdate] {Function}: Called right before the update step where
  ///           the new positions for the |@Particles| in the system are
  ///           computed.
  ///         Params:
  ///           delta {Number}: The change in time since the last update in
  ///               seconds.
  ///
  ///       [postUpdate] {Function}: Called right after the update step.
  ///         Params:
  ///           delta {Number}: The change in time since the last update in
  ///               seconds.
  ///
  ///       [setContext] {Function}: Sets up the context before any draw calls
  ///           are made for this system.
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///       [onDeath] {Function}: Called when a particle dies.
  ///
  ///       [init] {Function}: Do custom initialization such as adding
  ///           properties to this.
  function System(options) {
    var that = this;

    options || (options = {});
    _.defaults(options, {
      newParticle: function() {
        return new Particle();
      },
      numParticles: 0,
      rules: [],
      preDraw: function(ctx) {},
      postDraw: function(ctx) {},
      preUpdate: function(delta) {},
      postUpdate: function(delta) {},
      setContext: function(ctx) {},
      onDeath: function() {},
      init: function() {}
    });

    /// property System.particles {@Particle[]}
    /// The |@Particles| in this system.
    this.particles = [];

    this.lastStep = 0;
    _.each(['newParticle', 'rules', 'trace', 'preDraw', 'postDraw',
        'setContext', 'onDeath', 'numParticles', 'preUpdate', 'postUpdate'],
        function(name) {
      that[name] = options[name];
    });

    options.init.call(this);
    this.reset();
  }

  /// function System.reset
  /// Resets this system, and regenerates starting particles.
  System.prototype.reset = function() {
    this.particles = [];
    for (var i = 0; i < this.numParticles; i++) {
      this.addParticle();
    }
  };

  /// function System.addRule
  /// Adds a rule to this system. Rules are explained more in the |@Rules|
  /// object.
  ///
  /// Params:
  ///   rule {Function}: The rule to add.
  ///     Params:
  ///       particle {@Particle}: The particle to operate on.
  ///       i {Number}: The index of the particle in the system.
  ///       delta {Number}: The time in seconds since the last update.
  System.prototype.addRule = function(rule) {
    this.rules.push(rule);
  };

  System.prototype.draw = function(ctx) {
    this.setContext(ctx);

    this.preDraw(ctx);

    _.each(this.particles, function(particle, i) {
      particle.drawAll(ctx);
    });

    this.postDraw(ctx);
  };

  System.prototype.update = function(delta) {
    var that = this;

    this.preUpdate(delta);

    _.each(this.particles, function(particle, i) {
      _.each(that.rules, function(rule) {
        rule(particle, i, delta);
      });
      if (particle.update(delta)) {
        that.particles[i] = null;
        that.particles = _.compact(that.particles);
        that.onDeath();
      }
    });

    this.postUpdate(delta);
  };

  /// function System.addParticle
  /// Adds a new |@Particle| to the system.
  ///
  /// Params:
  ///   [particle] {@Particle}: The particle to add. Defaults to the result of
  ///       calling the |newParticle()| function passed in to the |@System|.
  System.prototype.addParticle = function(particle) {
    this.particles.push(particle || this.newParticle(this.particles.length));
  };

  Move.System = System;

  /// class Particle
  /// A particle in a particle system.
  ///
  ///     var particle = new Move.Particle({
  ///         pos: new Move.Vector({x: 10, y: 5}),
  ///         vel: new Move.Vector({x: 1, y: 1}),
  ///         r: 10, g: 100, b: 255
  ///     });
  ///
  ///     system.addParticle(particle);
  ///
  /// Params:
  ///   options {Object}: Options for the particle.
  ///     Properties:
  ///       [pos] (new Vector(\)) {@Vector}: The starting position of the
  ///           particle.
  ///
  ///       [vel] (new Vector(\)) {@Vector}: The starting velocity of the
  ///           particle.
  ///
  ///       [r] (255) {Number}: Red value.
  ///       [g] (0) {Number}: Green value.
  ///       [b] (0) {Number}: Blue value.
  ///       [a] (1) {Number}: Alpha value.
  ///
  ///       [size] (2) {Number}: Size of the particle.
  ///
  ///       [trail] (0) {Number}: Whether this particle will have a trail.
  ///           The trail created by drawing increasingly transparent versions
  ///           of the particle at previous positions. A trail of 10 will use
  ///           the 10 last positions.
  ///
  ///       [draw] (@Particle.draw) {Function}: Determines how this particle
  ///           should be drawn on the canvas. The default draw function draws
  ///           the particle as a circle.
  ///
  ///         Params:
  ///           ctx {Context2D}: The context to draw on.
  ///
  ///           opacity {Number}: If this particle has a trail, the opacity will
  ///               be a number from 0 - 1 that represents how transparent the
  ///               particle should be. 0 means completely transparent and 1
  ///               means completely opaque.
  ///
  ///           pos {@Vector}: The position to draw at. This may be different
  ///               than the particle's position if one of the tail sections is
  ///               being drawn.
  ///
  ///       [preUpdate] {Function}: Function called before particle update.
  ///
  ///         Params:
  ///           delta {Number}: The change in time since the last update in
  ///               seconds.
  ///
  ///       [postUpdate] {Function}: Function called after particle update.
  ///
  ///         Params:
  ///           delta {Number}: The change in time since the last update in
  ///               seconds.
  ///
  ///       [isDead] {Function}: Function called after every update. If it
  ///           returns true, the particle is removed from the |@System|, and
  ///           |@System.onDeath| is called.
  ///
  ///       [init] {Function}: Do custom initialization on this particle.
  function Particle(options) {
    var that = this;

    options || (options = {});

    this.defaults = {
      pos: new Vector(),
      vel: new Vector(),
      r: 255, g: 0, b: 0, a: 1,
      size: 2,
      trail: 0,
      draw: Particle.prototype.draw.bind(this),
      preUpdate: function(delta) {},
      postUpdate: function(delta) {},
      isDead: function() { return false; },
      init: function() {}
    };

    _.defaults(options, this.defaults);

    if (!options.origPos) {
      options.origPos = new Vector(options.pos);
    }
    this.prevPos = [];

    /// property Particle.pos {@Vector}
    /// The position of the particle.
    //
    /// property Particle.vel {@Vector}
    /// The velocity of the particle.
    //
    /// property Particle.origPos {@Vector}
    /// The original position of the particle.
    //
    /// property Particle.r {Number}
    /// The red value of the color of the particle.
    //
    /// property Particle.g {Number}
    /// The green value of the color of the particle.
    //
    /// property Particle.b {Number}
    /// The blue value of the color of the particle.
    //
    /// property Particle.a {Number}
    /// The alpha value of the color of the particle.
    //
    /// property Particle.size {Number}
    /// The size of the particle.
    _.each(['draw', 'isDead', 'trail', 'r', 'g', 'b', 'a', 'size', 'preUpdate',
        'postUpdate', 'pos', 'vel', 'origPos'], function(name) {
      that[name] = options[name];
    });

    options.init.call(this);
  }

  /// function Particle.draw
  /// The default draw function. Draws the particle as a circle.
  ///
  /// Params:
  ///   ctx {Context2D}: The context to draw on.
  ///
  ///   opacity {Number}: If this particle has a trail, the opacity will
  ///       be a number from 0 - 1 that represents how transparent the
  ///       particle should be. 0 means completely transparent and 1
  ///       means completely opaque.
  ///
  ///   pos {@Vector}: The position to draw at. This may be different
  ///       than the particle's position if one of the tail sections is
  ///       being drawn.
  Particle.prototype.draw = function(ctx, opacity, pos) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + this.r + ', ' + this.g + ', ' + this.b +
        ', ' + (this.a * opacity) + ')';
      ctx.fill();
  };

  Particle.prototype.drawAll = function(ctx) {
    var that = this;

    _.each(this.prevPos, function(pos, i) {
      that.draw(ctx, i / that.trail, pos);
    });
    this.draw(ctx, 1, this.pos);
  };

  Particle.prototype.update = function(delta) {
    var temp;

    this.preUpdate(delta);

    temp = new Vector(this.vel);
    if (this.trail) {
      if (this.prevPos && this.prevPos.length === this.trail) {
        this.prevPos = _.rest(this.prevPos);
      }
      this.prevPos.push(new Vector(this.pos));
    }
    this.pos.add(temp.multiplyScalar(delta));

    this.postUpdate(delta);

    return this.isDead();
  };

  Move.Particle = Particle;

  /// object Rules
  /// Rules can be added to a system to specify its behavior. The |@Rules|
  /// object has some starter rules, but a complex system will probably have
  /// some custom rules.
  ///
  /// Rules are functions of the form:
  ///
  ///     function(particle, i, delta) {
  ///         ...
  ///     }
  ///
  /// Where |particle| is a |@Particle|, |i| is the index of the particle in the
  /// system, and |delta| is the time in seconds since the last update.
  Move.Rules = {
    /// function Rules.gravity
    /// Pulls the particle downward.
    ///
    /// Params:
    ///   strength {Number}: The strength of the gravity.
    ///
    /// Returns:
    ///   {Function}: A gravity rule that can be passed to |@System.addRule|.
    gravity: function(strength) {
      return function(particle, i, delta) {
        particle.vel.y += strength * delta;
      }
    },

    /// function Rules.resistance
    /// Slows a particle over time.
    ///
    /// Params:
    ///   strength {Number}: The strength of the resistance.
    ///
    /// Returns:
    ///   {Function}: A resistance rule that can be passed to |@System.addRule|.
    resistance: function(strength) {
      return function(particle, i, delta) {
        particle.vel.multiplyScalar(1 - strength * delta);
      }
    },

    /// function Rules.attract
    /// Attracts a particle to a point with the formula |1/distance|.
    ///
    /// Params:
    ///   strength {Number}: The strength of the attraction.
    ///   [pos] (@Particle.origPos) {@Vector}: The point to attract to.
    ///
    /// Returns:
    ///   {Function}: An attraction rule that can be passed to
    ///       |@System.addRule|.
    attract: function(strength, pos) {
      return function(particle, i, delta) {
        var pos2 = pos || particle.origPos,
            temp = new Vector(particle.pos);
        temp.sub(pos2);
        particle.vel.sub(temp.multiplyScalar(delta * strength));
      }
    },

    /// function Rules.magnet
    /// Attracts a particle to a point with the formula |1/distance^2|.
    ///
    /// Params:
    ///   strength {Number}: The strength of the attraction.
    ///   [pos] (@Particle.origPos) {@Vector}: The point to attract to.
    ///
    /// Returns:
    ///   {Function}: A magnetism rule that can be passed to |@System.addRule|.
    magnet: function(strength, pos) {
      return function(particle, i, delta) {
        var pos2 = pos || particle.origPos,
            temp = new Vector(particle.pos),
            lenSq;
        temp.sub(pos2);
        lenSq = temp.lengthSq();
        if (lenSq < .01) return;
        particle.vel.sub(temp.multiplyScalar(
            delta * strength / lenSq));
      }
    },

    /// function Rules.wall
    /// Creates a wall that particles will bounce off of.
    ///
    /// Params:
    ///   pos {@Vector}: The position of the wall.
    ///   coord {String}: The coordinate of the wall. Can be |'x'|, |'y'|, or
    ///       |'z'|.
    ///
    /// Returns:
    ///   {Function}: A wall rule that can be passed to |@System.addRule|.
    wall: function(pos, coord) {
      return function(particle, i, delta) {
        var vel = particle.vel[coord] * delta,
            ppos = particle.pos[coord],
            nextPos = pos + particle.size * (vel > 0 ? -1 : 1);
        if ((ppos > nextPos) != (ppos + vel > nextPos)) {
          particle.pos[coord] = 2 * nextPos - vel - ppos;
          particle.vel[coord] = -particle.vel[coord];
        }
      }
    }
  };

}).call(this);
