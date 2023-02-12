// Started with this example: http://vasir.net/blog/game-development/how-to-build-entity-component-system-in-javascript

// setup

var ECS = {};
var canvas = document.getElementById("eatfishdisplay");

function resizeCanvas() {
  canvas.width = window.innerWidth - 50;
  canvas.height = window.innerHeight - 150;
}
resizeCanvas();

addEventListener('resize', (e) => resizeCanvas());

var maxPlayerSpeed = 2.5;
var enemySpeed = 1;

function checkVal(val, funcName) {
    if (val === undefined) {throw funcName + " given no value";}
}

var gameLevel = {
    centerPos: {x: 0, y: 0},
    levelSize: {width: 6000, height: 4000}
};

gameLevel.updateCenter = function updateCenter(pos) {
    var leftBound = canvas.width / (2 * screenSize);
    var rightBound = this.levelSize.width - canvas.width / (2 * screenSize);
    var topBound = canvas.height / (2 * screenSize);
    var bottomBound = this.levelSize.height - canvas.height / (2 * screenSize);
    this.centerPos.x = pos.x;
    this.centerPos.y = pos.y;
    if (canvas.width > this.levelSize.width * screenSize) {
        this.centerPos.x = this.levelSize.width / 2;
    } else if (pos.x < leftBound) {
        this.centerPos.x = leftBound;
    } else if (pos.x > rightBound) {
        this.centerPos.x = rightBound;
    }
    if (canvas.height > this.levelSize.height * screenSize) {
        this.centerPos.y = this.levelSize.height / 2;
    } else if (pos.y < topBound) {
        this.centerPos.y = topBound;
    } else if (pos.y > bottomBound) {
        this.centerPos.y = bottomBound;
    }
};

// entities

ECS.Entity = function Entity() {
  this.id = ++ECS.Entity.prototype.idNum;
  ECS.Entity.prototype._count++;
  this.components = {};
}
// Numbers to be used as ids
ECS.Entity.prototype.idNum = 0;
// Entity count
ECS.Entity.prototype._count = 0;

ECS.Entity.prototype.addComponent = function addComponent(component) {
  this.components[component.name] = component;
  return this;
};

ECS.Entity.prototype.removeComponent = function removeComponent(componentName) {
  delete this.components[componentName];
  return this;
};

// components

ECS.Components = {};

function hasComponent(entity, componentName) {
    var component = entity.components[componentName];
    if (component && component.value) {
        return true;
    }
}

ECS.Components.Size = function componentSize(value) {
    checkVal(value, "componentSize");
    this.value = value;
    return this;
};
ECS.Components.Size.prototype.name = "size";

ECS.Components.Color = function componentColor(color) {
    color = color || "#ff6633";
    this.value = color;
    return this;
};
ECS.Components.Color.prototype.name = "color";

ECS.Components.Position = function componentPosition(pos) {
    checkVal(pos, "componentPosition");
    this.x = pos[0];
    this.y = pos[1];
    return this;
};
ECS.Components.Position.prototype.name = "position";

ECS.Components.Vector = function componentVector(vector) {
    checkVal(vector, "componentVector");
    this.x = vector[0];
    this.y = vector[1];
    return this;
};
ECS.Components.Vector.prototype.name = "vector";

ECS.Components.PlayerControl = function componentPlayerControl(bool) {
    if (bool === false) {
        this.value = false;
    } else {
        this.value = true;
    }
    return this;
};
ECS.Components.PlayerControl.prototype.name = "playerControl";

ECS.Components.Dead = function componentDead(bool) {
    if (bool === false) {
        this.value = false;
    } else {
        this.value = true;
    }
    return this;
};
ECS.Components.Dead.prototype.name = "dead";

// systems

var context = canvas.getContext("2d");
ECS.Systems = {};
var screenSize = 1;
var screenSizeWanted = 1;

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

ECS.Systems.Draw = function systemDraw(entities) {
    clearCanvas();
    var xOffset = gameLevel.centerPos.x - canvas.width / 2;
    var yOffset = gameLevel.centerPos.y - canvas.height / 2;
    
    for (var eid in entities) {
        var entity = entities[eid];
        if (hasComponent(entity, 'playerControl')) {
            if (entity.components.size.value * screenSizeWanted > canvas.height / 12) {
                screenSizeWanted *= 0.8;
            } else if (entity.components.size.value * screenSizeWanted < canvas.height / 20) {
                screenSizeWanted *= 1.2;
            }
        }
        var transitionSpeed = 0.00007;
        if (Math.abs(screenSize - screenSizeWanted) < transitionSpeed) {
            screenSize = screenSizeWanted;
        } else if (screenSize > screenSizeWanted) {
            screenSize -= transitionSpeed;
        } else if (screenSize < screenSizeWanted) {
            screenSize += transitionSpeed;
        }
        context.fillStyle = entity.components.color.value;
        context.beginPath();
        context.arc((entity.components.position.x - xOffset) * screenSize - canvas.width * (screenSize - 1) / 2,
                (entity.components.position.y - yOffset) * screenSize - canvas.height * (screenSize - 1) / 2,
                (entity.components.size.value) * screenSize,
                0,2*Math.PI);
        context.fill();
    }
};

function checkCollision(id, entities) {
    for (var eid in entities) {
        if (id == eid) {continue;}
        if (entityTooClose(entities[id], entities[eid], 0)) {
            collide(entities[id], entities[eid]);
        }
    }
}

function collide(ent1, ent2) {
    var larger = ent1;
    var smaller = ent2;
    if (ent1.components.size.value < ent2.components.size.value) {
        larger = ent2;
        smaller = ent1;
    } else if (ent1.components.size.value == ent2.components.size.value){
        if (Math.random() > 0.5) {
            larger = ent2;
            smaller = ent2;
        }
    }
    smaller.addComponent(new ECS.Components.Dead());
    var r1sq = Math.pow(larger.components.size.value, 2);
    var r2sq = Math.pow(smaller.components.size.value, 2);
    var newArea = (22 / 7 * r1sq) + ((22 / 7 * r2sq) / 4); // Grows by 1/3 area
    larger.components.size.value = Math.sqrt(newArea * 7 / 22);
}

ECS.Systems.Move = function systemMove(entities) {
    for (var eid in entities) {
        var entity = entities[eid];
        var pos = entity.components.position;
        var vect = entity.components.vector;
        var size = entity.components.size.value;
        pos.x += vect.x;
        pos.y += vect.y;
        var levelSize = gameLevel.levelSize;
        if (pos.x < 0 + size) { // Left bounding
            pos.x = 0 + size;
        } else if (pos.x > levelSize.width - size) { // Right bounding
            pos.x = levelSize.width - size;
        }
        if (pos.y < 0 + size) { // Top bounding
            pos.y = 0 + size;
        } else if (pos.y > levelSize.height - size) { // Bottom bounding
            pos.y = levelSize.height - size;
        }
        if (hasComponent(entity, 'playerControl')) {
            gameLevel.updateCenter(pos);
        }
        checkCollision(eid, entities);
        // strong deceleration instead of instantly stopping
        vect.x *= 0.8;
        vect.y *= 0.8;
    }
};

ECS.Systems.Kill = function systemKill(entities) {
    for (var eid in entities) {
        var entity = entities[eid];
        if (hasComponent(entity, 'dead')) {
            delete ECS.Entities[entity.id];
        }
    }
};

ECS.Systems.Input = function systemInput(entities) {
    for (var eid in entities) {
        var entity = entities[eid];
        if (!hasComponent(entity, 'playerControl')){
            continue;
        }
        var keys = ECS.Systems.Input.keys;
        var vector = entity.components.vector;
        // x^2 + y^2 < 3^2
        // Normalizing diagonal movement
        if (Math.pow(vector.x, 2) + Math.pow(vector.y, 2) > Math.pow(maxPlayerSpeed, 2)) {
            continue;
        }
        if (keys && keys[37] && vector.x > -maxPlayerSpeed) { // Left
            vector.x -= maxPlayerSpeed / 2.5 / screenSize;
        }
        if (keys && keys[39] && vector.x < maxPlayerSpeed) { // Right
            vector.x += maxPlayerSpeed / 2.5 / screenSize;
        }
        if (keys && keys[38] && vector.y > -maxPlayerSpeed) { // Up
            vector.y -= maxPlayerSpeed / 2.5 / screenSize;
        }
        if (keys && keys[40] && vector.y < maxPlayerSpeed) { // Down
            vector.y += maxPlayerSpeed / 2.5 / screenSize;
        }
    }
};

ECS.Systems.Input.keys = [];

window.addEventListener('keydown', function (e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
    ECS.Systems.Input.keys = (ECS.Systems.Input.keys || []);
    ECS.Systems.Input.keys[e.keyCode] = (e.type == "keydown");
});
window.addEventListener('keyup', function (e) {
    ECS.Systems.Input.keys[e.keyCode] = (e.type == "keydown");            
});

function getVector(posFrom, posTo, vect) {
    var currentVect = checkDistance(posFrom, posTo);
    var magnitudeRatio = vect / currentVect;
    var x = (posTo.x - posFrom.x) * magnitudeRatio;
    var y = (posTo.y - posFrom.y) * magnitudeRatio;
    return {x: x, y: y};
}

ECS.Systems.AI = function systemAI(entities) {
    for (var eid in entities) {
        var entity = entities[eid];
        if (hasComponent(entity, 'playerControl')) {
            continue;
        }
        var closestEnt = undefined;
        for (var eid2 in entities) {
            if (eid == eid2){
                continue;
            }
            var distance = entityDistance(entity, entities[eid2]) - entity.components.size.value - entities[eid2].components.size.value;
            if (closestEnt === undefined) {
                closestEnt = [distance, entities[eid2]];
                continue;
            }
            if (distance < closestEnt[0]) {
                closestEnt = [distance, entities[eid2]];
            }
        }
        if (!closestEnt) {
            continue;
        }
        if (closestEnt[0] > 200 + closestEnt[1].components.size.value + entity.components.size.value) {
            continue;
        }
        var vect;
        if (entity.components.size.value > closestEnt[1].components.size.value) {
            vect = getVector(entity.components.position, closestEnt[1].components.position, 1.5 * enemySpeed);
            entity.components.vector.x = vect.x;
            entity.components.vector.y = vect.y;
        } else {
            vect = getVector(entity.components.position, closestEnt[1].components.position, 2 * enemySpeed);
            entity.components.vector.x = -vect.x;
            entity.components.vector.y = -vect.y;
        }
    }
};

// engine

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function checkDistance(pos1, pos2) {
  var a = Math.abs(pos1.x - pos2.x);
  var b = Math.abs(pos1.y - pos2.y);
  return Math.sqrt(a*a + b*b);
}

function entityDistance(entity1, entity2) {
  return checkDistance(entity1.components.position, entity2.components.position);
}

function entityTooClose(entity1, entity2, buffer) {
  if (buffer === undefined) {
      buffer = 0;
  }
  var size1 = entity1.components.size.value;
  var size2 = entity2.components.size.value;
  var dist = entityDistance(entity1, entity2);
  if (dist > size1 + size2 + buffer) {
      return false;
  }
  return true;
}

function spawnEnemies(number, minSize, maxSize) {
  for (var i = 0; i < number; i++) {
      var goodPlacement = false;
      var attempts = 0;
      var maxAttempts = 500;
      var levelSize = gameLevel.levelSize;
      while (!goodPlacement && attempts < maxAttempts) {
          goodPlacement = true;
          var entity = new ECS.Entity();
          var entitySize = randomInt(minSize, maxSize);
          entity.addComponent(new ECS.Components.Size(entitySize));
          entity.addComponent(new ECS.Components.Color("blue"));
          var entityX = randomInt(entitySize + 5, levelSize.width - entitySize - 5);
          var entityY = randomInt(entitySize + 5, levelSize.height - entitySize - 5);
          entity.addComponent(new ECS.Components.Position([entityX, entityY]));
          entity.addComponent(new ECS.Components.Vector([0, 0]));
          for (var eid in ECS.Entities) {
              if (entityTooClose(ECS.Entities[eid], entity, 100)) {
                  goodPlacement = false;
              }
          }
          attempts++;
      }
      if (attempts < maxAttempts) {
          ECS.Entities[entity.id] = entity;
      } else {
          console.log("Failed to place entity, no space.");
      }
  }
}

var systems = [ECS.Systems.Input, ECS.Systems.AI, ECS.Systems.Move, ECS.Systems.Kill, ECS.Systems.Draw];
var animationFrameId;

function gameLoop() {
  for (var i=0; i < systems.length; i++){
      systems[i](ECS.Entities);
  }
  animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
  }
  ECS.Entities = {};
  ECS.Entity.prototype.idNum = 0;
  ECS.Entity.prototype._count = 0;
  screenSize = 1;
  screenSizeWanted = 1;
  var entity = new ECS.Entity();
  entity.addComponent(new ECS.Components.Size(40));
  entity.addComponent(new ECS.Components.Color());
  entity.addComponent(new ECS.Components.Position([gameLevel.levelSize.width / 2, gameLevel.levelSize.height / 2]));
  entity.addComponent(new ECS.Components.Vector([0, 0]));
  entity.addComponent(new ECS.Components.PlayerControl(true));
  gameLevel.updateCenter(entity.components.position);
  ECS.Entities[entity.id] = entity;
  
  spawnEnemies(150, 20, 35);
  spawnEnemies(100, 45, 150);
  
  gameLoop();
}

document.getElementById("startButton").onclick = startGame;


