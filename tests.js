var t = {
  world: document.querySelector('#world'),
  points: [
    { x1: 200, y1: 200, x2: 300, y2: 300, hitX: 235.3553390593273775, hitY: 235.3553390593273775, c1: 'red', c2: 'blue' }
  ],

  init: function() {

    // create original path
    this.points.forEach((p) => {
      const p1 = dom.createProjectileElement({ x: p.x1, y: p.y1, color: p.c1 });
      const p2 = dom.createProjectileElement({ x: p.x2, y: p.y2, color: p.c2 });

      this.world.appendChild(p1);
      this.world.appendChild(p2);
    });

    // create 3 new paths originating from the hit coords
    this.points.forEach((p) => {
      const data = this.distanceAndAngleBetweenTwoPoints(p.hitX, p.hitY, p.x2, p.y2);
      const velocity = 10;
      const tv1 = new this.Vector(velocity, this.getVariedAngle(data.angle));
      const tv2 = new this.Vector(velocity, this.getVariedAngle(data.angle));
      const tv3 = new this.Vector(velocity, this.getVariedAngle(data.angle));

      console.log("tv1", tv1);
      console.log("tv2", tv2);
      console.log("tv3", tv3);

      const es = 15;
            
      // const x = (toTargetVector.magnitudeX);// * elapsedSeconds);
      // const y = (toTargetVector.magnitudeY);// * elapsedSeconds);
      
      const p3 = dom.createProjectileElement({ x: tv1.magnitudeX * es, y: tv1.magnitudeY * es, color: '#2196f3' });
      const p4 = dom.createProjectileElement({ x: tv2.magnitudeX * es, y: tv2.magnitudeY * es, color: '#e91e63' });
      const p5 = dom.createProjectileElement({ x: tv3.magnitudeX * es, y: tv3.magnitudeY * es, color: '#4caf50' });
      
      this.world.appendChild(p3);
      this.world.appendChild(p4);
      this.world.appendChild(p5);
    });
  },

  getVariedAngle: function(angle) {
    const angleVariance = 15;
    return this.getRandomArbitrary(angle - angleVariance, angle + angleVariance);
  },

  getRandomArbitrary: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  updateProjectilePositions: function(delta) {
    projectiles.forEach((p, i) => {

      const data = distanceAndAngleBetweenTwoPoints(p.x1, p.y1, p.x2, p.y2);
      const velocity = PROJECTILE_SPEED; //data.distance / speed; //just going to use a constant speed
      const toTargetVector = new Vector(velocity, data.angle);
      const elapsedSeconds = delta * 100;

      p.x += (toTargetVector.magnitudeX * elapsedSeconds);
      p.y += (toTargetVector.magnitudeY * elapsedSeconds);

      checkProjectileAgainstBounds(p, i);
    });
  },

  Vector: function(magnitude, angle) {
    const angleRadians = (angle * Math.PI) / 180;

    this.magnitudeX = magnitude * Math.cos(angleRadians);
    this.magnitudeY = magnitude * Math.sin(angleRadians);
  },

  distanceAndAngleBetweenTwoPoints: function(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    return {
      // x^2 + y^2 = r^2
      distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      //convert radians to degrees
      angle: Math.atan2(deltaY, deltaX) * 180 / Math.PI
    }
  }
}
