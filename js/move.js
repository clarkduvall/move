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
    _.defaults(options, {x: 0, y: 0, z: 0});
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;
  }

  Vector.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  };

  Vector.prototype.sub = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  };

  Vector.prototype.multiplyScalar = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  };

  Vector.prototype.length = function() {
    return Math.sqrt(this.lengthSq());
  };

  Vector.prototype.lengthSq = function() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  };

  Move.Vector = Vector;

  ////////////////
  // Controller //
  ////////////////
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

  Controller.prototype.reset = function() {
    _.each(this.systems, function(system) {
      system.reset();
    });
  };

  Controller.prototype.addSystem = function(system) {
    this.systems.push(system);
    return this;
  };

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

  System.prototype.reset = function() {
    this.particles = [];
    for (var i = 0; i < this.numParticles; i++) {
      this.addParticle();
    }
  };

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
      pos: new Vector(),
      vel: new Vector(),
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

    if (!options.origPos) {
      options.origPos = new Vector(options.pos);
    }
    this.prevPos = [];

    _.each(['draw', 'isDead', 'trail', 'r', 'g', 'b', 'a', 'size', 'preUpdate',
        'postUpdate', 'pos', 'vel', 'origPos'], function(name) {
      that[name] = options[name];
    });

    options.init.call(this);
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
    this.pos.add(temp.multiplyScalar(delta));

    this.postUpdate(delta);

    return this.isDead();
  };

  Move.Particle = Particle;

  ///////////
  // Rules //
  ///////////
  Move.Rules = {
    gravity: function(strength) {
      return function(particle, i, delta) {
        particle.vel.y += strength * delta;
      }
    },
    resistance: function(strength) {
      return function(particle, i, delta) {
        particle.vel.multiplyScalar(1 - strength * delta);
      }
    },
    attract: function(strength, pos) {
      return function(particle, i, delta) {
        var pos2 = pos || particle.origPos,
            temp = new Vector(particle.pos);
        temp.sub(pos2);
        particle.vel.sub(temp.multiplyScalar(delta * strength));
      }
    },
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
    wallX: function(wx) {
      return function(particle, i, delta) {
        var vel = particle.vel.x * delta,
            pos = particle.pos.x,
            x = wx + particle.size * (vel > 0 ? -1 : 1);
        if ((pos > x) != (pos + vel > x)) {
          particle.pos.x = 2 * x - vel - pos;
          particle.vel.x = -particle.vel.x;
        }
      }
    },
    wallY: function(wy) {
      return function(particle, i, delta) {
        var vel = particle.vel.y * delta,
            pos = particle.pos.y,
            y = wy + particle.size * (vel > 0 ? -1 : 1);
        if ((pos > y) != (pos + vel > y)) {
          particle.pos.y = 2 * y - vel - pos;
          particle.vel.y = -particle.vel.y;
        }
      }
    },
    wallZ: function(wz) {
      return function(particle, i, delta) {
        var vel = particle.vel.z * delta,
            pos = particle.pos.z,
            z = wz + particle.size * (vel > 0 ? -1 : 1);
        if ((pos > z) != (pos + vel > z)) {
          particle.pos.z = 2 * z - vel - pos;
          particle.vel.z = -particle.vel.z;
        }
      }
    }
  };

}).call(this);
