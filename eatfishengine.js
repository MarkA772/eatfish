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
            entity = new ECS.Entity();
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