/**
 * @file Provides collision detection utilities, including swept-sphere tests.
 */
import * as THREE from 'three';

const segTmp = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  p: new THREE.Vector3(),
  cp: new THREE.Vector3(),
};

/**
 * Calculates the shortest distance between a line segment and a point.
 * This is a core component of the swept-sphere collision test.
 * @param {THREE.Vector3} a - The start point of the line segment.
 * @param {THREE.Vector3} b - The end point of the line segment.
 * @param {THREE.Vector3} p - The point to test against.
 * @returns {number} The distance from the point to the line segment.
 */
function segmentPointDistance(a, b, p) {
  const ab = segTmp.b.copy(b).sub(a);
  const t = Math.max(0, Math.min(1, segTmp.p.copy(p).sub(a).dot(ab) / ab.lengthSq()));
  segTmp.cp.copy(a).addScaledVector(ab, t);
  return segTmp.cp.distanceTo(p);
}

/**
 * Checks for a collision between a moving sphere (represented by its path over a frame)
 * and a static sphere. This is known as a "swept-sphere" test.
 *
 * @param {object} movingObject - The object in motion. Must have `position`, `userData.prev` (previous position), and `userData.radius`.
 * @param {object} staticObject - The object to check against. Must have `position` and `userData.radius`.
 * @returns {boolean} True if a collision occurred, false otherwise.
 */
export function sweptSphereCollision(movingObject, staticObject) {
  if (!movingObject?.userData?.prev || !movingObject?.userData?.radius || !staticObject?.userData?.radius) {
    return false;
  }

  const combinedRadius = movingObject.userData.radius + staticObject.userData.radius;
  const distance = segmentPointDistance(
    movingObject.userData.prev,
    movingObject.position,
    staticObject.position
  );

  return distance <= combinedRadius;
}

/**
 * A simpler axis-aligned bounding box (AABB) intersection test.
 * Faster but less accurate than swept-sphere, especially for fast objects.
 *
 * @param {THREE.Object3D} obj1 - The first object.
 * @param {THREE.Object3D} obj2 - The second object.
 * @returns {boolean} True if the bounding boxes intersect.
 */
export function boxCollision(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}