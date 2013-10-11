(function() {
  var root = this,
      Move,
      requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;

  root.Move = Move = {};

  ////////////
  // Vector //
  ////////////
  function Vector(options) {
    options || (options = {});
    this.x = options.x;
    this.y = options.y;
  }

  Vector.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  };

  Vector.prototype.sub = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  };

  Vector.prototype.mult = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  };

  Vector.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y + this.y);
  };

  ////////////////
  // Controller //
  ////////////////
  function Controller(options) {
    var that = this;

    options || (options = {});
    _.defaults(options, {
      trace: false,
      speed: 1,
      preDraw: function(ctx) {},
      postDraw: function(ctx) {},
      setContext: function(ctx) {},
    });

    this.systems = [];

    if (!options.context) {
      throw "Move.Controller requires a context."
    }

    _.each(['trace', 'context', 'preDraw', 'postDraw', 'setContext', 'speed'],
           function(name) {
      that[name] = options[name];
    });

    _.bindAll(this, 'step');
  }

  Controller.prototype.update = function(delta) {
    _.each(this.systems, function(system) {
      system.update(delta);
    });
  }

  Controller.prototype.reset = function() {
    _.each(this.systems, function(system) {
      system.reset();
    });
  }

  Controller.prototype.addSystem = function(system) {
    this.systems.push(system);
    return this;
  }

  Controller.prototype.start = function() {
    this.paused = false;
    this.step(0);
  };

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
      this.draw();
    }

    if (!this.paused) {
      requestAnimationFrame(this.step);
    }
  };

  Controller.prototype.clear = function() {
      this.context.clearRect(0, 0, this.context.canvas.width,
        this.context.canvas.height);
  }

  Controller.prototype.draw = function() {
    var that = this;

    this.context.save();

    if (!this.trace) {
      this.clear();
    }

    this.setContext(this.context);

    this.context.save();
    this.preDraw(this.context);
    this.context.restore();

    _.each(this.systems, function(system) {
      that.context.save();
      system.draw(that.context);
      that.context.restore();
    });

    this.context.save();
    this.postDraw(this.context);
    this.context.restore();

    this.context.restore();
  }

  Move.Controller = Controller;

  ////////////
  // System //
  ////////////
  function System(options) {
    var that = this;

    options || (options = {});
    _.defaults(options, {
      newParticle: function() {
        return new Particle();
      },
      numParticles: 10,
      rules: [],
      preDraw: function(ctx) {},
      postDraw: function(ctx) {},
      preUpdate: function(delta) {},
      postUpdate: function(delta) {},
      setContext: function(ctx) {},
      onDeath: function() {}
    });

    this.particles = [];
    this.lastStep = 0;
    _.each(['newParticle', 'rules', 'trace', 'preDraw', 'postDraw',
        'setContext', 'onDeath', 'numParticles', 'preUpdate', 'postUpdate'],
        function(name) {
      that[name] = options[name];
    });

    this.reset();
  }

  System.prototype.reset = function() {
    this.particles = [];
    for (var i = 0; i < this.numParticles; i++) {
      this.addParticle();
    }
  }

  System.prototype.draw = function(ctx) {
    this.setContext(ctx);

    ctx.save();
    this.preDraw(ctx);
    ctx.restore();

    _.each(this.particles, function(particle, i) {
      ctx.save();
      particle.drawAll(ctx);
      ctx.restore();
    });

    ctx.save();
    this.postDraw(ctx);
    ctx.restore();
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

  System.prototype.addParticle = function(particle) {
    this.particles.push(particle || this.newParticle(this.particles.length));
  };

  Move.System = System;

  //////////////
  // Particle //
  //////////////
  function Particle(options) {
    var that = this;

    options || (options = {});

    this.defaults = {
      x: 0, y: 0,
      dx: 0, dy: 0,
      r: 255, g: 0, b: 0, a: 1,
      size: 2,
      trail: false,
      draw: function(ctx, opacity, pos) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, that.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + that.r + ', ' + that.g + ', ' + that.b +
          ', ' + (that.a * opacity) + ')';
        ctx.fill();
      },
      preUpdate: function(delta) {},
      postUpdate: function(delta) {},
      isDead: function() { return false; },
      init: function() {}
    };

    _.defaults(options, this.defaults);

    this.pos = new Vector({x: options.x, y: options.y});
    this.origPos = new Vector({
      x: options.origX || options.x,
      y: options.origY || options.y
    });
    this.vel = new Vector({x: options.dx, y: options.dy});
    this.prevPos = [];

    _.each(['draw', 'isDead', 'trail', 'r', 'g', 'b', 'a', 'size', 'preUpdate',
        'postUpdate'], function(name) {
      that[name] = options[name];
    });

    options.init.bind(this)();
  }

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
    this.pos.add(temp.mult(delta));

    this.postUpdate(delta);

    return this.isDead();
  };

  Move.Particle = Particle;

  ///////////
  // Rules //
  ///////////
  var Rules = {
    gravity: function(strength) {
      return function(particle, i, delta) {
        particle.vel.y += strength * delta;
      }
    },
    resistance: function(strength) {
      return function(particle, i, delta) {
        particle.vel.mult(1 - strength * delta);
      }
    },
    magnet: function(strength) {
      return function(particle, i, delta) {
        var temp = new Vector(particle.pos);
        temp.sub(particle.origPos);
        particle.vel.sub(temp.mult(delta * strength));
      }
    },
    wallX: function(x) {
      return function(particle, i, delta) {
        if ((particle.pos.x > x) !=
            (particle.pos.x + delta * particle.vel.x > x)) {
          particle.pos.x = x;
          particle.vel.x = -particle.vel.x;
        }
      }
    },
    wallY: function(y) {
      return function(particle, i, delta) {
        if ((particle.pos.y > y) !=
            (particle.pos.y + delta * particle.vel.y > y)) {
          particle.pos.y = y;
          particle.vel.y = -particle.vel.y;
        }
      }
    }
  };

  Move.Rules = Rules;

}).call(this);
