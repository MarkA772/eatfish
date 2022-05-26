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