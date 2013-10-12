$(function() {
  function createCanvas(cls, w, h) {
    return $('<canvas class="' + cls + '" width="' + w + '" height="' +
      h + '"></canvas>').appendTo('body')[0];
  }

  function createPausePlay(ctrl) {
    $('<br>').appendTo('body');
    $('<button>Play</button>').appendTo('body').on('click', function() {
      ctrl.start();
    });
    $('<button>Pause</button>').appendTo('body').on('click', function() {
      ctrl.pause();
    });
  }

  var width = 800,
      height = 500,
      depth = 500,
      mouseX = 0,
      mouseY = 0;

  (function initEvents() {
    var windowHalfX = width / 2,
        windowHalfY = height / 2;

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    function onDocumentTouchStart(event) {
      if (event.touches.length == 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
      }
    }

    function onDocumentTouchMove(event) {
      if (event.touches.length == 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
      }
    }
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
  })();

  $('<h2>3D</h2>').appendTo('body');
  (function demo1() {
    var camera = new THREE.PerspectiveCamera(55, width / height, 2, 2000),
        scene = new THREE.Scene(),
        geometry = new THREE.Geometry(),
        sprite = THREE.ImageUtils.loadTexture('../img/ball.png'),
        material,
        particles,
        cubeSize = 500,
        system = new Move.System({
          rules: [
            Move.Rules.gravity(-100),
            Move.Rules.resistance(.1),
            Move.Rules.wallX(cubeSize + 1),
            Move.Rules.wallX(-cubeSize - 1),
            Move.Rules.wallY(cubeSize + 1),
            Move.Rules.wallY(-cubeSize - 1),
            Move.Rules.wallZ(cubeSize + 1),
            Move.Rules.wallZ(-cubeSize - 1)
          ]
        }),
        controller;

    function randXYZ() {
      var x = Math.random() * 2 - 1,
          y = Math.random() * 2 - 1,
          z = Math.random() * 2 - 1,
          len = Math.sqrt(x * x + y * y + z * z);
      return {x: x / len, y: y / len, z: z / len};
    }

    camera.position.z = 1800;

    for (i = 0; i < 5000; i ++) {
      var angle = _.random(0, 628) / 100,
          strength = _.random(1000) / 5,
          vertex = new THREE.Vector3();

      geometry.vertices.push(vertex);
      geometry.colors.push(new THREE.Color().setRGB(
        _.random(255), _.random(255), _.random(255)));
      system.addParticle(new Move.Particle({
        pos: vertex,
        vel: new Move.Vector(randXYZ()).multiplyScalar(strength)
      }));
    }

    material = new THREE.ParticleBasicMaterial({
      size: 85,
      map: sprite,
      vertexColors: true,
      transparent: true
    });
    material.color.setHSL(1.0, 0.9, 0.1);

    particles = new THREE.ParticleSystem(geometry, material);
    particles.sortParticles = true;
    scene.add(particles);
    renderer = new THREE.WebGLRenderer({
      clearAlpha: 1,
      canvas: createCanvas('black', width, height)
    });
    renderer.setSize(width, height);

    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    controller = new Move.Controller({draw: render});
    controller.addSystem(system);

    createPausePlay(controller);
  })();

});
