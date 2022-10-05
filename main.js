import "./style.css";
import { createNoise3D } from "simplex-noise";
Matter.use("matter-wrap");

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
    wireframes: false,
    background: "#000000",
  },
});

Composite.add(engine.world, [
  // walls
  //Bodies.rectangle(width / 2, -40, width, 100, { isStatic: true }),
  //Bodies.rectangle(width / 2, height - 20, width, 100, { isStatic: true }),
  //Bodies.rectangle(width, height / 2, 100, height, { isStatic: true }),
  //Bodies.rectangle(-20, height / 2, 100, width, { isStatic: true }),
]);

Render.run(render);

var runner = Runner.create();

Runner.run(runner, engine);

//On mouse click create a jelly and add it to the jelly array
var jellyOptions = {
  stiffness: 0.05,
  render: { type: "line", anchors: false },
  plugin: {
    wrap: {
      min: { x: 0, y: 0 },
      max: { x: render.canvas.width, y: render.canvas.width },
    },
  },
};
let app = document.querySelector("canvas");
app.addEventListener("mousedown", (e) => {
  let row = Math.random() * 4 + 1;
  let col = Math.random() * 4 + 1;
  let r = Math.random() * 255;
  let g = Math.random() * 255;
  let b = Math.random() * 255;
  let rgb = [r, g, b];
  var hex = rgb.map(function (x) {
    x = parseInt(x).toString(16); //Convert to a base16 string
    return x.length == 1 ? "0" + x : x; //Add zero if we get only one character
  });
  let size = Math.random() * 40 + 20;
  let inertia = 1 / size;
  var a = Composites.stack(e.clientX, e.clientY, 2, 2, 15, 15, function (x, y) {
    let circle = Bodies.circle(x, y, size, {
      render: {
        fillStyle: "#" + hex.join(""),
        wireframes: false,
      },
    });
    circle.plugin.wrap = {
      min: {
        x: -7000,
        y: -6500,
      },
      max: {
        x: render.canvas.width,
        y: render.canvas.height,
      },
    };

    Body.setInertia(circle, inertia);
    return circle;
  });

  a.plugin.wrap = {
    min: {
      x: 0,
      y: 0,
    },
    max: {
      x: render.canvas.width,
      y: render.canvas.height,
    },
  };

  var jelly = genMesh(a, 2, 2, jellyOptions);
  jelly.plugin.wrap = {
    min: {
      x: 0,
      y: 0,
    },
    max: {
      x: render.canvas.width,
      y: render.canvas.height,
    },
  };

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
          Common.extend(
            { bodyA: bodyA, bodyB: bodyB },
            {
              render: { visible: false },
            }
          )
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
            Common.extend(
              { bodyA: bodyA, bodyB: bodyB },
              {
                render: { visible: false },
              }
            )
          )
        );
      }
    }
  }
  composite.label += " Mesh";
  return composite;
}

let forceStrength = 0.001;
Events.on(runner, "beforeUpdate", updateLoop);
function updateLoop(e) {
  for (let i = 0; i < jellies.length; i++) {
    let currentComp = jellies[i];
    for (let j = 0; j < currentComp.bodies.length; j++) {
      let currentBody = currentComp.bodies[j];
      let pos = currentBody.position;
      let angle = scale(noise(pos.x, pos.y, 1), -1, 1, 0, 360);
      let vec = Matter.Vector.create(
        Math.cos(angle) * forceStrength,
        Math.sin(angle) * forceStrength
      );
      Body.applyForce(currentBody, pos, vec);
    }
  }
}

function scale(number, inMin, inMax, outMin, outMax) {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
