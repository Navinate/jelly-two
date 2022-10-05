import "./style.css";
import { createNoise3D } from "simplex-noise";
Matter.use(
  "matter-wrap", // not required, just for demo
  "matter-attractors" // PLUGIN_NAME
);

const noise = createNoise3D();

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Composites = Matter.Composites,
  Composite = Matter.Composite,
  Common = Matter.Common,
  Constraint = Matter.Constraint,
  Body = Matter.Body,
  Bodies = Matter.Bodies,
  Events = Matter.Events;

var width = screen.width;
var height = screen.height;
let jellies = [];

//set up engine and renderer
var engine = Engine.create();
engine.world.gravity.y = 0;
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: width,
    height: height,
    showAngleIndicator: false,
    background: "#000000",
  },
});

Composite.add(engine.world, [
  // walls
  Bodies.rectangle(width / 2, -40, width, 100, { isStatic: true }),
  Bodies.rectangle(width / 2, height - 20, width, 100, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 100, height, { isStatic: true }),
  Bodies.rectangle(-20, height / 2, 100, width, { isStatic: true }),
]);

Render.run(render);

var runner = Runner.create();

Runner.run(runner, engine);

//On mouse click create a jelly and add it to the jelly array
var jellyOptions = {
  stiffness: 0.1,
  render: { type: "line", anchors: false },
  plugin: {
    wrap: {
      min: { x: 0, y: 0 },
      max: { x: 900, y: 900 },
    },
  },
};
let app = document.querySelector("canvas");
app.addEventListener("mousedown", (e) => {
  let size = 40; //Math.random() * 60 + 20;
  let inertia = 1; //Math.random() * 1 + 0.1;
  var a = Composites.stack(e.clientX, e.clientY, 2, 2, 5, 5, function (x, y) {
    let circle = Bodies.circle(x, y, size);
    Body.setInertia(circle, inertia);
    circle.render.fillStyle = "#FF0000";
    return circle;
  });

  var jelly = genMesh(a, 2, 2, jellyOptions);

  jellies.push(jelly);
  Composite.add(engine.world, jelly);
});

let remove = document.querySelector("#remove");
remove.addEventListener("mousedown", (e) => {
  if (jellies.length > 0) {
    Composite.remove(engine.world, jellies.shift());
  }
});

function genMesh(composite, columns, rows, options) {
  var bodies = composite.bodies,
    row,
    col,
    bodyA,
    bodyB;

  for (row = 0; row < rows; row++) {
    for (col = 1; col < columns; col++) {
      bodyA = bodies[col - 1 + row * columns];
      bodyB = bodies[col + row * columns];
      Composite.addConstraint(
        composite,
        Matter.Constraint.create(
          Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)
        )
      );
    }

    if (row > 0) {
      for (col = 0; col < columns; col++) {
        bodyA = bodies[col + (row - 1) * columns];
        bodyB = bodies[col + row * columns];
        Composite.addConstraint(
          composite,
          Constraint.create(
            Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)
          )
        );
      }
    }
  }
  composite.label += " Mesh";
  composite.plugin.wrap = {
    min: {
      x: 0,
      y: 0,
    },
    max: {
      x: render.canvas.width,
      y: render.canvas.height,
    },
  };
  return composite;
}

let forceStrength = 0.0002;
Events.on(runner, "beforeUpdate", updateLoop);
function updateLoop(e) {
  for (let i = 0; i < jellies.length; i++) {
    let currentComp = jellies[i];
    for (let j = 0; j < currentComp.bodies.length; j++) {
      let currentBody = currentComp.bodies[j];
      let pos = currentBody.position;
      let angle = noise(pos.x, pos.y, e.timestamp);
      let vec = Matter.Vector.create(
        Math.cos(angle) * forceStrength,
        Math.sin(angle) * forceStrength
      );
      console.log(angle);
      Body.applyForce(currentBody, pos, vec);
    }
  }
}
