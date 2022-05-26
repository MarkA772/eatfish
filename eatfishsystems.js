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
        keys = ECS.Systems.Input.keys;
        vector = entity.components.vector;
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




