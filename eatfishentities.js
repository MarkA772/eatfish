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