/* eslint-disable camelcase */
import * as THREE from 'three';
import Avatar from '../avatars/avatars';
import {trackingPoints as points} from './constants';

import {Quaternion, Vector3} from 'three';
import metaversefile from 'metaversefile';

// const y180Quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
// const slightLeftRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI*0.1);
// const rollRightRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI*0.5);
// const upRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI*0.5);

const debug_shoulders = false;
const debug_elbows = false;
const debug_hands = false;

const local_shiftLeftQuaternion = new Quaternion()
  .premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI * 0.5));
const local_shiftRightQuaternion = new Quaternion()
  .premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * 0.5));

const local_deltaQuaternion = new Quaternion();
const local_deltaQuaternion2 = new Quaternion();
const local_deltaQuaternion3 = new Quaternion();
const local_deltaQuaternion4 = new Quaternion();

// left
// arm
const local_px = new Quaternion();
const local_p0 = new Quaternion();
const local_p1 = new Quaternion();

// elbow
const local_ax = new Quaternion();
const local_a0 = new Quaternion();
const local_a1 = new Quaternion();

// hand
const local_bx = new Quaternion();
const local_b0 = new Quaternion();
const local_b1 = new Quaternion();

// right
// arm
const local_qx = new Quaternion();
const local_q0 = new Quaternion();
const local_q1 = new Quaternion();

// elbow
const local_cx = new Quaternion();
const local_c0 = new Quaternion();
const local_c1 = new Quaternion();

// hand
const local_dx = new Quaternion();
const local_d0 = new Quaternion();
const local_d1 = new Quaternion();

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector9 = new THREE.Vector3();
const localTriangle = new THREE.Triangle();
const localMatrix = new THREE.Matrix4();
const zeroVector = new THREE.Vector3();

const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix2 = new THREE.Matrix4();

/* const remap = (val, min, max) => {
  //returns min to max -> 0 to 1
  return (clamp(val, min, max) - min) / (max - min);
}; */

const eyeLidRatio = (
  eyeOuterCorner,
  eyeInnerCorner,
  eyeOuterUpperLid,
  eyeMidUpperLid,
  eyeInnerUpperLid,
  eyeOuterLowerLid,
  eyeMidLowerLid,
  eyeInnerLowerLid,
) => {
  eyeOuterCorner = new THREE.Vector3().copy(eyeOuterCorner);
  eyeInnerCorner = new THREE.Vector3().copy(eyeInnerCorner);

  eyeOuterUpperLid = new THREE.Vector3().copy(eyeOuterUpperLid);
  eyeMidUpperLid = new THREE.Vector3().copy(eyeMidUpperLid);
  eyeInnerUpperLid = new THREE.Vector3().copy(eyeInnerUpperLid);

  eyeOuterLowerLid = new THREE.Vector3().copy(eyeOuterLowerLid);
  eyeMidLowerLid = new THREE.Vector3().copy(eyeMidLowerLid);
  eyeInnerLowerLid = new THREE.Vector3().copy(eyeInnerLowerLid);

  // use 2D Distances instead of 3D for less jitter
  const eyeWidth = eyeOuterCorner.distanceTo(eyeInnerCorner, 2);
  const eyeOuterLidDistance = eyeOuterUpperLid.distanceTo(eyeOuterLowerLid, 2);
  const eyeMidLidDistance = eyeMidUpperLid.distanceTo(eyeMidLowerLid, 2);
  const eyeInnerLidDistance = eyeInnerUpperLid.distanceTo(eyeInnerLowerLid, 2);
  const eyeLidAvg = (eyeOuterLidDistance + eyeMidLidDistance + eyeInnerLidDistance) / 3;
  const ratio = eyeLidAvg / eyeWidth;

  return ratio;
};

const getEyeOpen = (lm, side = 'left', {high = 0.85, low = 0.55} = {}) => {
  const eyePoints = points.eye[side];
  const eyeDistance = eyeLidRatio(
    lm[eyePoints[0]],
    lm[eyePoints[1]],
    lm[eyePoints[2]],
    lm[eyePoints[3]],
    lm[eyePoints[4]],
    lm[eyePoints[5]],
    lm[eyePoints[6]],
    lm[eyePoints[7]],
  );
    // human eye width to height ratio is roughly .3
  const maxRatio = 0.285;
  // compare ratio against max ratio
  const ratio = clamp(eyeDistance / maxRatio, 0, 2);
  return ratio;
  /* // remap eye open and close ratios to increase sensitivity
    let eyeOpenRatio = remap(ratio, low, high);
    return {
        // remapped ratio
        norm: eyeOpenRatio,
        // ummapped ratio
        raw: ratio,
    }; */
};
const getBrowRaise = (lm, side = 'left') => {
  const browPoints = points.brow[side];
  const browDistance = eyeLidRatio(
    lm[browPoints[0]],
    lm[browPoints[1]],
    lm[browPoints[2]],
    lm[browPoints[3]],
    lm[browPoints[4]],
    lm[browPoints[5]],
    lm[browPoints[6]],
    lm[browPoints[7]],
  );

  const min = 0.6;
  const max = 1;
  const browRaiseRatio = clamp(((browDistance - min) / (max - min)) * 5, 0, 2);
  // console.log('brow distance', browRaiseRatio);
  return browRaiseRatio;

  /*
    let maxBrowRatio = 1.15;
    let browHigh = 0.125;
    let browLow = 0.07;
    let browRatio = browDistance / maxBrowRatio - 1;
    let browRaiseRatio = (clamp(browRatio, browLow, browHigh) - browLow) / (browHigh - browLow);
    return browRaiseRatio; */
};

const _makeFakeAvatar = () => {
  const Root = new THREE.Object3D();
  const Hips = new THREE.Object3D();
  const Spine = new THREE.Object3D();
  const Chest = new THREE.Object3D();
  const UpperChest = new THREE.Object3D();

  const Neck = new THREE.Object3D();
  const Head = new THREE.Object3D();
  const Eye_L = new THREE.Object3D();
  const Eye_R = new THREE.Object3D();

  const Left_shoulder = new THREE.Object3D();
  const Left_elbow = new THREE.Object3D();
  const Left_arm = new THREE.Object3D();
  const Left_wrist = new THREE.Object3D();
  const Left_thumb0 = new THREE.Object3D();
  const Left_thumb1 = new THREE.Object3D();
  const Left_thumb2 = new THREE.Object3D();
  const Left_indexFinger1 = new THREE.Object3D();
  const Left_indexFinger2 = new THREE.Object3D();
  const Left_indexFinger3 = new THREE.Object3D();
  const Left_middleFinger1 = new THREE.Object3D();
  const Left_middleFinger2 = new THREE.Object3D();
  const Left_middleFinger3 = new THREE.Object3D();
  const Left_ringFinger1 = new THREE.Object3D();
  const Left_ringFinger2 = new THREE.Object3D();
  const Left_ringFinger3 = new THREE.Object3D();
  const Left_littleFinger1 = new THREE.Object3D();
  const Left_littleFinger2 = new THREE.Object3D();
  const Left_littleFinger3 = new THREE.Object3D();

  const Left_leg = new THREE.Object3D();
  const Left_knee = new THREE.Object3D();
  const Left_ankle = new THREE.Object3D();
  const Left_toe = new THREE.Object3D();

  const Right_shoulder = new THREE.Object3D();
  const Right_elbow = new THREE.Object3D();
  const Right_arm = new THREE.Object3D();
  const Right_wrist = new THREE.Object3D();
  const Right_thumb0 = new THREE.Object3D();
  const Right_thumb1 = new THREE.Object3D();
  const Right_thumb2 = new THREE.Object3D();
  const Right_indexFinger1 = new THREE.Object3D();
  const Right_indexFinger2 = new THREE.Object3D();
  const Right_indexFinger3 = new THREE.Object3D();
  const Right_middleFinger1 = new THREE.Object3D();
  const Right_middleFinger2 = new THREE.Object3D();
  const Right_middleFinger3 = new THREE.Object3D();
  const Right_ringFinger1 = new THREE.Object3D();
  const Right_ringFinger2 = new THREE.Object3D();
  const Right_ringFinger3 = new THREE.Object3D();
  const Right_littleFinger1 = new THREE.Object3D();
  const Right_littleFinger2 = new THREE.Object3D();
  const Right_littleFinger3 = new THREE.Object3D();

  const Right_leg = new THREE.Object3D();
  const Right_knee = new THREE.Object3D();
  const Right_ankle = new THREE.Object3D();
  const Right_toe = new THREE.Object3D();

  Root.add(Hips);
  Hips.add(Spine);
  Spine.add(Chest);
  Chest.add(UpperChest);

  UpperChest.add(Neck);
  Neck.add(Head);
  Head.add(Eye_L);
  Head.add(Eye_R);

  UpperChest.add(Left_shoulder);
  Left_shoulder.add(Left_arm);
  Left_arm.add(Left_elbow);
  Left_elbow.add(Left_wrist);

  Left_wrist.add(Left_thumb0);
  Left_thumb0.add(Left_thumb1);
  Left_thumb1.add(Left_thumb2);

  Left_wrist.add(Left_indexFinger1);
  Left_indexFinger1.add(Left_indexFinger2);
  Left_indexFinger2.add(Left_indexFinger3);

  Left_wrist.add(Left_middleFinger1);
  Left_middleFinger1.add(Left_middleFinger2);
  Left_middleFinger2.add(Left_middleFinger3);

  Left_wrist.add(Left_ringFinger1);
  Left_ringFinger1.add(Left_ringFinger2);
  Left_ringFinger2.add(Left_ringFinger3);

  Left_wrist.add(Left_littleFinger1);
  Left_littleFinger1.add(Left_littleFinger2);
  Left_littleFinger2.add(Left_littleFinger3);

  Hips.add(Left_leg);
  Left_leg.add(Left_knee);
  Left_knee.add(Left_ankle);
  Left_ankle.add(Left_toe);

  UpperChest.add(Right_shoulder);
  Right_shoulder.add(Right_arm);
  Right_arm.add(Right_elbow);
  Right_elbow.add(Right_wrist);

  Right_wrist.add(Right_thumb0);
  Right_thumb0.add(Right_thumb1);
  Right_thumb1.add(Right_thumb2);

  Right_wrist.add(Right_indexFinger1);
  Right_indexFinger1.add(Right_indexFinger2);
  Right_indexFinger2.add(Right_indexFinger3);

  Right_wrist.add(Right_middleFinger1);
  Right_middleFinger1.add(Right_middleFinger2);
  Right_middleFinger2.add(Right_middleFinger3);

  Right_wrist.add(Right_ringFinger1);
  Right_ringFinger1.add(Right_ringFinger2);
  Right_ringFinger2.add(Right_ringFinger3);

  Right_wrist.add(Right_littleFinger1);
  Right_littleFinger1.add(Right_littleFinger2);
  Right_littleFinger2.add(Right_littleFinger3);

  Hips.add(Right_leg);
  Right_leg.add(Right_knee);
  Right_knee.add(Right_ankle);
  Right_ankle.add(Right_toe);

  return {
    Root,

    Hips,
    Spine,
    Chest,
    UpperChest,
    Neck,
    Head,
    Eye_L,
    Eye_R,

    Left_shoulder,
    Left_arm,
    Left_elbow,
    Left_wrist,
    Left_thumb2,
    Left_thumb1,
    Left_thumb0,
    Left_indexFinger3,
    Left_indexFinger2,
    Left_indexFinger1,
    Left_middleFinger3,
    Left_middleFinger2,
    Left_middleFinger1,
    Left_ringFinger3,
    Left_ringFinger2,
    Left_ringFinger1,
    Left_littleFinger3,
    Left_littleFinger2,
    Left_littleFinger1,
    Left_leg,
    Left_knee,
    Left_ankle,

    Right_shoulder,
    Right_arm,
    Right_elbow,
    Right_wrist,
    Right_thumb2,
    Right_thumb1,
    Right_thumb0,
    Right_indexFinger3,
    Right_indexFinger2,
    Right_indexFinger1,
    Right_middleFinger3,
    Right_middleFinger2,
    Right_middleFinger1,
    Right_ringFinger3,
    Right_ringFinger2,
    Right_ringFinger1,
    Right_littleFinger3,
    Right_littleFinger2,
    Right_littleFinger1,
    Right_leg,
    Right_knee,
    Right_ankle,
    Left_toe,
    Right_toe,
  };
};

/* const _retargetAnimation = (srcAnimation, srcBaseModel, dstBaseModel) => {
    const srcModelBones = getModelBones(srcBaseModel);
    const dstModelBones = getModelBones(dstBaseModel);

    // console.log('retarget', srcAnimation, srcModelBones, dstModelBones); // XXX

    const dstAnimation = srcAnimation.clone();

    const numFrames = srcAnimation.interpolants['mixamorigHead.quaternion'].sampleValues.length / 4;
    for (let frame = 0; frame < numFrames; frame++) {
      const srcModelBones2 = cloneModelBones(srcModelBones);
      const dstModelBones2 = cloneModelBones(dstModelBones);
      srcModelBones2.Root.updateMatrixWorld();
      dstModelBones2.Root.updateMatrixWorld();

      _setSkeletonToAnimationFrame(srcModelBones2, srcAnimation, frame);
      _setSkeletonWorld(dstModelBones2, srcModelBones2);
      _setAnimationFrameToSkeleton(dstAnimation, frame, dstModelBones2);
    }

    decorateAnimation(dstAnimation);

    return dstAnimation;
  }; */
const _setSkeletonWorld = (() => {
  return (dstModelBones, srcModelBones, srcModelBonesWhitelist) => {
    const srcBoneToModelNameMap = new Map();
    for (const k in srcModelBones) {
      srcBoneToModelNameMap.set(srcModelBones[k], k);
    }

    const _recurse = (srcModelBone, dstModelBone) => {
      if (srcModelBonesWhitelist.indexOf(srcModelBone) !== -1) {
        dstModelBone.position.copy(srcModelBone.position);
        dstModelBone.quaternion.copy(srcModelBone.quaternion);
        dstModelBone.scale.copy(srcModelBone.scale);
        dstModelBone.updateMatrixWorld();
        /* // srcModelBone.matrixWorld.decompose(localVector, localQuaternion, localVector2);
          localQuaternion.copy(srcModelBone.quaternion);
          // console.log('got hips', localQuaternion.toArray().join(','));
          dstModelBone.matrixWorld.decompose(localVector3, localQuaternion2, localVector4);

          dstModelBone.matrixWorld.compose(
            srcModelBone === srcModelBones.Hips ? srcModelBone.position : localVector3,
            localQuaternion,
            localVector4
          );
          dstModelBone.matrix.copy(dstModelBone.matrixWorld)
            .premultiply(localMatrix2.copy(dstModelBone.parent.matrixWorld).invert())
            .decompose(dstModelBone.position, dstModelBone.quaternion, dstModelBone.scale);
          // dstModelBone.quaternion.premultiply(dstModelBone.initialQuaternion);
          dstModelBone.updateMatrixWorld(); */
      }

      for (let i = 0; i < srcModelBone.children.length; i++) {
        const srcChild = srcModelBone.children[i];
        const modelBoneName = srcBoneToModelNameMap.get(srcChild);
        if (modelBoneName) {
          const dstChild = dstModelBones[modelBoneName];
          if (dstChild) {
            _recurse(srcChild, dstChild);
          }
        }
      }
    };
    _recurse(srcModelBones.Root, dstModelBones.Root);
  };
})();

const _copyAvatarBonePositions = (dstModelBones, srcModelBones) => {
  for (const k in dstModelBones) {
    dstModelBones[k].position.copy(srcModelBones[k].position);
  }
};

const _setAvatarToIdlePose = dstModelBones => {
  const animations = Avatar.getAnimations();
  const animationConfig = Avatar.getAnimationMappingConfig();
  const idleAnimation = animations.find(animation => animation.name === 'idle.fbx');
  for (const animationMapping of animationConfig) {
    const {animationTrackName, boneName, isPosition} = animationMapping;
    const interpolant = idleAnimation.interpolants[animationTrackName];
    const {sampleValues} = interpolant;
    const bone = dstModelBones[boneName];
    bone[isPosition ? 'position' : 'quaternion'].fromArray(sampleValues, 0);
  }
  dstModelBones.Root.updateMatrixWorld();
};

const _solvePoseToAvatar = (() => {
  const tempAvatar = _makeFakeAvatar();
  const boneBuffers = {
    leftHip: new THREE.Vector3(),
    rightHip: new THREE.Vector3(),
    leftShoulder: new THREE.Vector3(),
    rightShoulder: new THREE.Vector3(),
    leftElbow: new THREE.Vector3(),
    rightElbow: new THREE.Vector3(),
    leftHand: new THREE.Vector3(),
    rightHand: new THREE.Vector3(),
    leftPinky: new THREE.Vector3(),
    rightPinky: new THREE.Vector3(),
    leftIndex: new THREE.Vector3(),
    rightIndex: new THREE.Vector3(),
    leftThumb: new THREE.Vector3(),
    rightThumb: new THREE.Vector3(),
    leftKnee: new THREE.Vector3(),
    rightKnee: new THREE.Vector3(),
    leftAnkle: new THREE.Vector3(),
    rightAnkle: new THREE.Vector3(),
    leftHeel: new THREE.Vector3(),
    rightHeel: new THREE.Vector3(),
    leftToe: new THREE.Vector3(),
    rightToe: new THREE.Vector3(),
  };
  window.boneBuffers = boneBuffers;
  const debugMeshes = (() => {
    const meshes = {};
    const cubeGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const cubeRedMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00FF,
    });
    const cubeBlueMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF00ff,
    });
    const cubeGreenMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FFFF,
    });
    const cubeWhiteMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
    });
    for (const k in boneBuffers) {
      let color;
      if (k === 'rightToe' || k === 'leftToe') {
        color = cubeRedMaterial;
      } else if (k === 'rightKnee' || k === 'leftKnee') {
        color = cubeGreenMaterial;
      } else if (k === 'leftHip' || k === 'rightHip') {
        color = cubeWhiteMaterial;
      } else {
        color = cubeBlueMaterial;
      }
      const mesh = new THREE.Mesh(cubeGeometry, color);
      meshes[k] = mesh;

      const {scene} = metaversefile.useInternals();
      scene.add(mesh);
    }
    return meshes;
  })();
  console.log(debugMeshes);

  return (lm3d, leftHandLm, rightHandLm, idleAvatar, avatar) => {
    boneBuffers.leftHip.copy(lm3d[23]);
    boneBuffers.rightHip.copy(lm3d[24]);
    boneBuffers.leftShoulder.copy(lm3d[11]);
    boneBuffers.rightShoulder.copy(lm3d[12]);
    boneBuffers.leftElbow.copy(lm3d[13]);
    boneBuffers.rightElbow.copy(lm3d[14]);
    boneBuffers.leftHand.copy(lm3d[15]);
    boneBuffers.rightHand.copy(lm3d[16]);
    boneBuffers.leftPinky.copy(lm3d[17]);
    boneBuffers.rightPinky.copy(lm3d[18]);
    boneBuffers.leftIndex.copy(lm3d[19]);
    boneBuffers.rightIndex.copy(lm3d[20]);
    boneBuffers.leftThumb.copy(lm3d[21]);
    boneBuffers.rightThumb.copy(lm3d[22]);
    boneBuffers.leftKnee.copy(lm3d[25]);
    boneBuffers.rightKnee.copy(lm3d[26]);
    boneBuffers.leftAnkle.copy(lm3d[27]);
    boneBuffers.rightAnkle.copy(lm3d[28]);
    boneBuffers.leftHeel.copy(lm3d[29]);
    boneBuffers.rightHeel.copy(lm3d[30]);
    boneBuffers.leftToe.copy(lm3d[31]);
    boneBuffers.rightToe.copy(lm3d[32]);

    for (const k in boneBuffers) {
      // boneBuffers[k].x *= -1;
      boneBuffers[k].y *= -1;
      boneBuffers[k].z *= -1;
    }

    const _updateDebugMeshes = () => {
      for (const k in boneBuffers) {
        const boneBuffer = boneBuffers[k];
        const debugMesh = debugMeshes[k];
        debugMesh.position.copy(boneBuffer);
        debugMesh.position.y += 1;
        // debugMesh.quaternion.copy(boneBuffer.quaternion);
        // debugMesh.scale.copy(boneBuffer.scale);
        debugMesh.updateMatrixWorld();
      }
    };
    _updateDebugMeshes();

    /* window.lm3d = lm3d;
    window.leftHip = leftHip;
    window.rightHip = rightHip;
    window.leftShoulder = leftShoulder;
    window.rightShoulder = rightShoulder; */

    const bodyCenter = localVector.copy(boneBuffers.leftHip)
      .add(boneBuffers.rightHip)
      .add(boneBuffers.leftShoulder)
      .add(boneBuffers.rightShoulder)
      .divideScalar(4);

    const leftMiddle = localVector2.copy(boneBuffers.leftPinky)
      .add(boneBuffers.leftIndex)
      .divideScalar(2);

    const rightMiddle = localVector3.copy(boneBuffers.rightPinky)
      .add(boneBuffers.rightIndex)
      .divideScalar(2);

    let leftWristNormal;
    let leftPointerStart;
    let leftPointerEnd;
    if (leftHandLm) {
      localTriangle.a.copy(leftHandLm[0]);
      localTriangle.b.copy(leftHandLm[5]);
      localTriangle.c.copy(leftHandLm[17]);
      leftPointerStart = new THREE.Vector3().copy(leftHandLm[0]);
      leftPointerEnd = new THREE.Vector3().copy(leftHandLm[5]);
    } else {
      localTriangle.a.copy(boneBuffers.leftIndex);
      localTriangle.b.copy(boneBuffers.leftPinky);
      localTriangle.c.copy(boneBuffers.leftThumb);
      leftPointerStart = boneBuffers.leftHand.clone();
      leftPointerEnd = boneBuffers.leftIndex.clone();
    }
    [
      localTriangle.a,
      localTriangle.b,
      localTriangle.c,
    ].forEach(v => {
      v.x *= -1;
      v.y *= -1;
      v.z *= -1;
    });
    leftWristNormal = localTriangle.getNormal(localVector4);
    [
      leftWristNormal,
      leftPointerStart,
      leftPointerEnd,
    ].forEach(v => {
      v.x *= -1;
      v.y *= -1;
      // v.x *= -1;
      // v.y *= -1;
    });

    /* local_lol = [
      boneBuffers.leftIndex.toArray().join(', '),
      boneBuffers.leftPinky.toArray().join(', '),
      boneBuffers.leftThumb.toArray().join(', '),
      leftWristNormal.toArray().join(', '),
    ]; */

    let rightWristNormal;
    if (rightHandLm) {
      localTriangle.a.copy(rightHandLm[0]);
      localTriangle.b.copy(rightHandLm[17]);
      localTriangle.c.copy(rightHandLm[5]);
      [
        localTriangle.a,
        localTriangle.b,
        localTriangle.c,
      ].forEach(v => {
        v.x *= -1;
      });
      rightWristNormal = localTriangle.getNormal(localVector5);
    } else {
      localTriangle.a.copy(boneBuffers.rightPinky);
      localTriangle.b.copy(boneBuffers.rightIndex);
      localTriangle.c.copy(boneBuffers.rightHand);
      rightWristNormal = localTriangle.getNormal(localVector5);
    }

    const fakeQuaternion = (() => {
      const now = performance.now();
      const i = Math.floor(now / 2000) % 4;
      const y = Math.sin(((now % 2000) / 2000) * (Math.PI * 2)) * Math.PI;

      if (i === 0 || i === 1) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, y, -1),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(0, 1, 0),
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          ),
        );
      } else if (i === 2) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(y, 0, -1),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(0, 1, 0),
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          ),
        );
      } else if (i === 3) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(y, 1, 0),
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          ),
        );
      } else {
        debugger;
      }
    })();

    /* avatar.Root.updateMatrixWorld();
    const q = avatar.Left_arm.getWorldQuaternion(new THREE.Quaternion());
    console.log('got q', q);
    debugger; */

    /* const topHip = localVector6.copy(boneBuffers.leftHip)
      .add(boneBuffers.rightHip)
      .divideScalar(2)
      .add(localVector7.set(0, Math.max(boneBuffers.leftHip.y, boneBuffers.rightHip.y) + 0.1, 0)); */

    /* const topShoulder = localVector7.copy(boneBuffers.leftShoulder)
      .add(boneBuffers.rightShoulder)
      .divideScalar(2)
      .add(localVector8.set(0, 0.1, 0)); */

    {
      localTriangle.a.copy(bodyCenter);
      localTriangle.b.copy(boneBuffers.leftHip);
      localTriangle.c.copy(boneBuffers.rightHip);
      const hipsDirection = localTriangle.getNormal(localVector8);
      // hipsDirection.x *= -1;
      tempAvatar.Hips.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          zeroVector,
          hipsDirection,
          localVector9.set(0, 1, 0),
        ),
      );
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      localTriangle.a.copy(boneBuffers.leftShoulder);
      localTriangle.b.copy(bodyCenter);
      localTriangle.c.copy(boneBuffers.rightShoulder);
      const upperChestDirection = localTriangle.getNormal(localVector8);
      // hipsDirection.x *= -1;
      tempAvatar.UpperChest.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          zeroVector,
          upperChestDirection,
          localVector9.set(0, 1, 0),
        ),
      );
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }

    // const y = Math.sin(((performance.now() % 2000) / 2000) * (Math.PI*2)) * Math.PI;

    // {
    //   tempAvatar.Left_arm.quaternion.identity();

    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(local_shiftLeftQuaternion);

    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(idleAvatar.Left_arm.getWorldQuaternion(localQuaternion).invert());
    //   // .premultiply(idleAvatar.Left_arm.quaternion.clone().invert())

    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(local_p0)
    //     /* .premultiply(
    //       new THREE.Quaternion().setFromRotationMatrix(
    //         new THREE.Matrix4().lookAt(
    //           new THREE.Vector3(0, 0, 0),
    //           new THREE.Vector3(1, 0, 0),
    //           new THREE.Vector3(0, 1, 0)
    //         )
    //       )
    //     ) */
    //     .premultiply(local_px);

    //   if (debug_shoulders) {
    //     /* tempAvatar.Left_arm.quaternion
    //       .premultiply(fakeQuaternion) */
    //     tempAvatar.Left_arm.quaternion
    //       .premultiply(fakeQuaternion)
    //       /* .premultiply(
    //         new THREE.Quaternion().setFromRotationMatrix(
    //           new THREE.Matrix4().lookAt(
    //             boneBuffers.leftShoulder,
    //             boneBuffers.leftElbow,
    //             new THREE.Vector3(0, 1, 0)
    //               // .applyQuaternion(local_deltaQuaternion)
    //           )
    //         )
    //       ) */
    //       .premultiply(local_deltaQuaternion);
    //   }

    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(local_px.clone().invert());
    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(local_p1);
    //   /* .setFromUnitVectors(
    //       new THREE.Vector3(1, 0, 0),
    //       boneBuffers.leftElbow.clone().sub(boneBuffers.leftShoulder).normalize()
    //     ) */
    // }
    // {
    //   tempAvatar.Left_elbow.quaternion.identity()
    //     // .premultiply(tempAvatar.Left_arm.quaternion.clone().invert())
    //     .premultiply(local_a0)
    //     /* .setFromRotationMatrix(
    //       localMatrix.lookAt(
    //         new THREE.Vector3(0, 0, 0),
    //         new THREE.Vector3(1, 0, 0),
    //         new THREE.Vector3(0, 0, 1)
    //       )
    //     ) */
    //     .premultiply(local_ax);
    //   // .premultiply(local_d2)

    //   tempAvatar.Left_arm.quaternion
    //     .premultiply(idleAvatar.Left_elbow.quaternion.clone().invert());
    //   // .premultiply(idleAvatar.Left_arm.quaternion.clone().invert())
    //   if (debug_elbows) {
    //     tempAvatar.Left_elbow.quaternion
    //       .premultiply(fakeQuaternion)
    //       /* .premultiply(
    //         new THREE.Quaternion().setFromRotationMatrix(
    //           new THREE.Matrix4().lookAt(
    //             boneBuffers.leftElbow,
    //             boneBuffers.leftHand,
    //             new THREE.Vector3(0, 1, 0)
    //             // leftWristNormal
    //               // .applyQuaternion(local_deltaQuaternion2)
    //           )
    //         )
    //       ) */
    //       .premultiply(local_deltaQuaternion2);
    //   }
    //   tempAvatar.Left_elbow.quaternion
    //     .premultiply(local_ax.clone().invert());
    //   tempAvatar.Left_elbow.quaternion
    //     .premultiply(local_a1);
    // }
    // {
    //   tempAvatar.Left_wrist.quaternion.identity()
    //     .premultiply(local_b0)
    //     .premultiply(local_bx);

    //   if (debug_hands) {
    //     tempAvatar.Left_wrist.quaternion
    //       .premultiply(fakeQuaternion)
    //       /* .premultiply(
    //         new THREE.Quaternion().setFromRotationMatrix(
    //           new THREE.Matrix4().lookAt(
    //             leftPointerStart,
    //             leftPointerEnd,
    //             leftWristNormal
    //           )
    //         )
    //       ) */
    //       .premultiply(local_deltaQuaternion3);
    //     // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI))
    //   }
    //   // .premultiply(fakeQuaternion)
    //   /* .premultiply(
    //       new THREE.Quaternion().setFromRotationMatrix(
    //         localMatrix.lookAt(
    //           new THREE.Vector3(0, 0, 0),
    //           new THREE.Vector3(1, y, 0),
    //           new THREE.Vector3(0, 0, 1)
    //         )
    //       )
    //     ) */
    //   tempAvatar.Left_wrist.quaternion
    //     .premultiply(local_bx.clone().invert());
    //   tempAvatar.Left_wrist.quaternion
    //     .premultiply(local_b1);
    // }

    // {
    //   tempAvatar.Right_arm.quaternion.identity();

    //   tempAvatar.Right_arm.quaternion
    //     .premultiply(local_shiftRightQuaternion);

    //   tempAvatar.Right_arm.quaternion
    //     .premultiply(idleAvatar.Right_arm.getWorldQuaternion(localQuaternion).invert());
    //   // .premultiply(idleAvatar.Left_arm.quaternion.clone().invert())

    //   tempAvatar.Right_arm.quaternion
    //     .premultiply(local_q0)
    //     /* .premultiply(
    //       new THREE.Quaternion().setFromRotationMatrix(
    //         new THREE.Matrix4().lookAt(
    //           new THREE.Vector3(0, 0, 0),
    //           new THREE.Vector3(1, 0, 0),
    //           new THREE.Vector3(0, 1, 0)
    //         )
    //       )
    //     ) */
    //     .premultiply(local_qx);
    //   if (debug_shoulders) {
    //     /* tempAvatar.Right_arm.quaternion
    //       .premultiply(fakeQuaternion) */
    //     tempAvatar.Right_arm.quaternion
    //       .premultiply(fakeQuaternion)
    //       /* .premultiply(
    //         new THREE.Quaternion().setFromRotationMatrix(
    //           new THREE.Matrix4().lookAt(
    //             boneBuffers.rightShoulder,
    //             boneBuffers.rightElbow,
    //             new THREE.Vector3(0, 1, 0)
    //               // .applyQuaternion(local_deltaQuaternion)
    //           )
    //         )
    //       ) */
    //       .premultiply(local_deltaQuaternion4);
    //   }
    //   tempAvatar.Right_arm.quaternion
    //     .premultiply(local_qx.clone().invert());
    //   tempAvatar.Right_arm.quaternion
    //     .premultiply(local_q1);
    //   /* .setFromUnitVectors(
    //       new THREE.Vector3(1, 0, 0),
    //       boneBuffers.leftElbow.clone().sub(boneBuffers.leftShoulder).normalize()
    //     ) */
    // }

    // {
    //   tempAvatar.Right_elbow.quaternion.identity()
    //   // .premultiply(local_q2)
    //     /* .setFromRotationMatrix(
    //       localMatrix.lookAt(
    //         new THREE.Vector3(0, 0, 0),
    //         new THREE.Vector3(1, 0, 0),
    //         new THREE.Vector3(0, 0, 1)
    //       )
    //     ) */
    //     .premultiply(local_c0)
    //     .premultiply(local_cx);
    //   if (debug_elbows) {
    //     tempAvatar.Right_elbow.quaternion
    //       .premultiply(fakeQuaternion);
    //   }
    //   tempAvatar.Right_elbow.quaternion
    //     .premultiply(local_cx.clone().invert());
    //   tempAvatar.Right_elbow.quaternion
    //     .premultiply(local_c1);
    // }

    // {
    //   tempAvatar.Right_wrist.quaternion.identity()
    //     .premultiply(local_d0)
    //     .premultiply(local_dx);
    //   if (debug_hands) {
    //     tempAvatar.Right_wrist.quaternion
    //       .premultiply(fakeQuaternion);
    //   }
    //   // .premultiply(fakeQuaternion)
    //   /* .premultiply(
    //       new THREE.Quaternion().setFromRotationMatrix(
    //         localMatrix.lookAt(
    //           new THREE.Vector3(0, 0, 0),
    //           new THREE.Vector3(1, y, 0),
    //           new THREE.Vector3(0, 0, 1)
    //         )
    //       )
    //     ) */
    //   tempAvatar.Right_wrist.quaternion
    //     .premultiply(local_dx.clone().invert());
    //   tempAvatar.Right_wrist.quaternion
    //     .premultiply(local_d1);
    // }

    tempAvatar.Left_arm.position.copy(boneBuffers.leftShoulder);
    tempAvatar.Left_arm.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        boneBuffers.leftShoulder,
        boneBuffers.leftElbow,
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, -1),
      ),
    );

    tempAvatar.Left_elbow.position.copy(boneBuffers.leftElbow);
    tempAvatar.Left_elbow.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        boneBuffers.leftElbow,
        boneBuffers.leftHand,
        new THREE.Vector3(0, -1, 0),
      ),
    );
    )//.invert();

    tempAvatar.Right_arm.position.copy(boneBuffers.rightShoulder);
    tempAvatar.Right_arm.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        boneBuffers.rightShoulder,
        boneBuffers.rightElbow,
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, -1),
      ),
    );

    tempAvatar.Right_elbow.position.copy(boneBuffers.rightElbow);
    tempAvatar.Right_elbow.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        boneBuffers.rightElbow,
        boneBuffers.rightHand,
        new THREE.Vector3(0, -1, 0),
      ),
    );
    )//.invert();

    tempAvatar.Right_wrist.position.copy(boneBuffers.rightHand);
    tempAvatar.Left_wrist.position.copy(boneBuffers.leftHand);
    


    /* {
      tempAvatar.Left_leg.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftHip,
          boneBuffers.leftKnee,
          new THREE.Vector3(0, 0, 1)
        )
      )
    }
    {
      tempAvatar.Left_knee.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftKnee,
          boneBuffers.leftAnkle,
          new THREE.Vector3(0, 0, 1)
        )
      )
    }
    {
      tempAvatar.Left_ankle.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftHeel,
          boneBuffers.leftToe,
          new THREE.Vector3(0, 1, 0)
        )
      )
    } */
    // window.leftLeg = tempAvatar.Left_leg;

    const modelBoneWhiteliest = [
      tempAvatar.Hips,
      tempAvatar.UpperChest,
      // tempAvatar.Left_shoulder,
      // tempAvatar.Right_shoulder,
      tempAvatar.Left_arm,
      tempAvatar.Right_arm,
      tempAvatar.Left_elbow,
      tempAvatar.Right_elbow,
      tempAvatar.Left_wrist,
      tempAvatar.Right_wrist,
      // tempAvatar.Left_leg,
      // tempAvatar.Left_knee,
      // tempAvatar.Left_ankle,
    ];
    _setSkeletonWorld(avatar, tempAvatar, modelBoneWhiteliest);
  };
})();
const _copyAvatar = (srcAvatar, dstModelBones) => {
  for (const k in srcAvatar.modelBones) {
    const srcBone = srcAvatar.modelBones[k];
    const dstBone = dstModelBones[k];
    dstBone.position.copy(srcBone.position);
    dstBone.quaternion.copy(srcBone.quaternion);
    // dstBone.initialQuaternion = srcBone.initialQuaternion.clone();
    // console.log('copy initial quaternion', dstBone.initialQuaternion.toArray().join(','));
  }
};

export {clamp, eyeLidRatio, getEyeOpen, getBrowRaise, _makeFakeAvatar, _copyAvatar, _copyAvatarBonePositions, _setAvatarToIdlePose, _solvePoseToAvatar};
