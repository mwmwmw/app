import * as THREE from 'three';

// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
// const slightLeftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.1);
// const rollRightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI*0.5);
// const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);

window.THREE = THREE;
window.lol1 = true;
// window.lol2 = true;
// window.lol3 = true;

window.shiftLeftQuaternion = new THREE.Quaternion()
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5));
window.shiftRightQuaternion = new THREE.Quaternion()
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5));

window.deltaQuaternion = new THREE.Quaternion();
// .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
window.deltaQuaternion2 = new THREE.Quaternion();
// .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.75))
// .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
window.deltaQuaternion3 = new THREE.Quaternion();
// .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
window.deltaQuaternion4 = new THREE.Quaternion();
// .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))

// left
// arm
{
  window.px = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5));
  window.p0 = new THREE.Quaternion();
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
  window.p1 = new THREE.Quaternion();
}

// elbow
{
  window.ax = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5));
  window.a0 = new THREE.Quaternion();
  // .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5)
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
  // .premultiply(window.ax)
  window.a1 = new THREE.Quaternion();
  // .premultiply(window.ax.clone().invert())
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
  // window.d2 = new THREE.Quaternion()
}

// hand
{
  window.bx = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5));
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5))
  window.b0 = new THREE.Quaternion();
  // .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5)
  // .premultiply(window.bx)
  window.b1 = new THREE.Quaternion();
  // .premultiply(window.bx.clone().invert())
}

// right
// arm
{
  window.qx = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5));
  window.q0 = new THREE.Quaternion();
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
  window.q1 = new THREE.Quaternion();
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
}

// elbow
{
  window.cx = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5));
  window.c0 = new THREE.Quaternion();
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
  // .premultiply(window.ax)
  window.c1 = new THREE.Quaternion();
  // .premultiply(window.ax.clone().invert())
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5))
  // window.d2 = new THREE.Quaternion()
}

// hand
{
  window.dx = new THREE.Quaternion()
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5))
    .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.5));
  // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5))
  window.d0 = new THREE.Quaternion();
  // .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5)
  // .premultiply(window.bx)
  window.d1 = new THREE.Quaternion();
  // .premultiply(window.bx.clone().invert())
}


