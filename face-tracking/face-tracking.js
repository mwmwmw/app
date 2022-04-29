import * as THREE from 'three';
// import metaversefile from "metaversefile";
import * as Kalidokit from 'kalidokit';

import {
  makeAvatar,
  switchAvatar,
} from '../player-avatar-binding.js';

import {domDimensions, internalDimensions, trackingPoints as points} from './constants.js';
import {
  clamp,
  getEyeOpen,
  getBrowRaise,
  _makeFakeAvatar,
  _copyAvatarBonePositions,
  _setAvatarToIdlePose,
  _solvePoseToAvatar,
} from './utils.js';
import VideoCapture from './video-capture.js';
import FaceTrackingWorker from './worker.js';
import {Vector3} from 'three';

import metaversefileApi from '../metaversefile-api.js';

// import Stats from 'stats.js';

const fakeAvatar = _makeFakeAvatar();

const localMatrix = new THREE.Matrix4();
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const cameraOffset = new THREE.Vector3(0, 0, -1);

export default class FaceTracker extends EventTarget {
  constructor() {
    super();

    window.faceTracker = this;

    this.canvas = null;
    this.avatar = null;
    this.previewRenderer = null;
    this.previewScene = null;
    this.oldParent = null;
    this.previewCamera = null;
    this.faceTrackingWorker = new FaceTrackingWorker();
    this.videoCapture = new VideoCapture();
    this.domElement = null;
    this.live = true;

    (async () => {
      await Promise.all([
        new Promise((accept, reject) => {
          this.faceTrackingWorker.addEventListener('open', e => {
            accept();
          });
        }),
        new Promise((accept, reject) => {
          this.videoCapture.addEventListener('open', e => {
            accept();
          });
        }),
      ]);
      this.dispatchEvent(new MessageEvent('open'));
    })();

    const canvas = document.createElement('canvas');
    canvas.width = internalDimensions.width;
    canvas.height = internalDimensions.height;
    canvas.style.width = domDimensions.width + 'px';
    canvas.style.height = domDimensions.height + 'px';
    this.domElement = canvas;


    this.localPlayer = metaversefileApi.useLocalPlayer();

    this.localPlayer.addEventListener('avatarchange', e => {
      this.localPlayer =  e.avatar.model;
    });

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      // context,
      antialias: true,
      alpha: false,
    });
    /* {
      videoEl = document.createElement('video');
      videoEl.width = dimensions.width;
      videoEl.height = dimensions.height;
      videoEl.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${displayWidth}px;
        height: auto;
        z-index: 100;
        transform: rotateY(180deg);
      `;
      // document.body.appendChild(videoEl);
    } */
    /* {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = dimensions.width;
      overlayCanvas.height = dimensions.height;
      overlayCtx = overlayCanvas.getContext('2d');

      // overlayCanvas.style.cssText = videoEl.style.cssText;
      // overlayCanvas.style.backgroundColor = '#FF000020';
      // document.body.appendChild(overlayCanvas);
    } */

    this.createCamera();
    this.createScene();

    const _recurseFrame = async () => {
      const imageBitmap = await this.videoCapture.pullFrame();
      if (!this.live) return;
      const results = await this.faceTrackingWorker.processFrame(imageBitmap);
      if (!this.live) return;
      this.onResults(results);
      this.update();
      _recurseFrame();
    };
    _recurseFrame();
  }

  createCamera() {
    this.previewCamera = new THREE.PerspectiveCamera(
      60,
      this.domElement.width / this.domElement.height,
      0.1,
      1000,
    );

    this.previewCamera.name = 'PIP Camera';
  }

  createScene() {
    this.previewScene = new THREE.Scene();
    this.previewScene.name = 'Pip';
    this.previewScene.autoUpdate = true;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    this.previewScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(1, 2, 3);
    this.previewScene.add(directionalLight);
  }

  async setAvatar(avatarApp) {
    // const oldAvatar = this.avatar;

    if (this.avatar) {
      this.previewScene.remove(this.avatar.model);
      // this.avatar = null;
    }

    // const newAvatar = await switchAvatar(null, avatarApp);
    // console.log('switch avatar', oldAvatar, newAvatar, new Error().stack);
    this.avatar = avatarApp;
    // avatar.inputs.hmd.position.y = avatar.height;

    const idleAvatar = _makeFakeAvatar();
    // _copyAvatarBonePositions(idleAvatar, avatarApp.modelBones);
    // _setAvatarToIdlePose(idleAvatar);
    this.idleAvatar = idleAvatar;

    // this.avatar.setTopEnabled(true);
    // this.avatar.setHandEnabled(0, false);
    // this.avatar.setHandEnabled(1, false);
    // this.avatar.setBottomEnabled(false);
    // this.avatar.inputs.hmd.position.y = this.avatar.height;
    // this.avatar.inputs.hmd.updateMatrixWorld();
    // this.avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    // for (let i = 0; i < 2; i++) {
    //   this.avatar.setHandEnabled(i, false);
    // }
    // avatar.update(1000);

    //

    this.previewCamera.updateProjectionMatrix();

    this.previewScene.add(this.previewCamera);

    console.log(this.avatar);

    

    // this.previewCamera.position.copy(this.avatar.position);
    // this.previewRenderer.render(this.previewScene, this.previewCamera);

    // _copyAvatar(this.avatar, fakeAvatar);
    // fakeAvatar.Root.updateMatrixWorld();
  }

  update(timeDiff) {
    // if (this.avatar) {
    //   this.avatar.avatar.update(timeDiff);
    // } 
    
    
    // set up side camera
    this.localPlayer.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    const targetPosition = localVector;
    const targetQuaternion = localQuaternion;

    this.previewCamera.position.copy(targetPosition)
      .add(
        localVector2.set(cameraOffset.x, 0, cameraOffset.z)
          .applyQuaternion(targetQuaternion),
      );
    this.previewCamera.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        this.previewCamera.position,
        targetPosition,
        localVector3.set(0, 1, 0),
      ),
    );
    this.previewCamera.position.add(
      localVector2.set(0, cameraOffset.y, 0)
        .applyQuaternion(targetQuaternion),
    );
    this.previewCamera.updateMatrixWorld();

    this.oldParent = this.avatar.parent;
    // tempPositionVector.copy(this.avatar.position);
    this.previewScene.add(this.avatar);
    // this.avatar.position.set(0, 0, 0);
    this.previewRenderer.clear();
    this.previewRenderer.render(this.previewScene, this.previewCamera);
    this.previewScene.remove(this.avatar);
    // this.avatar.position.copy(tempPositionVector);
    this.oldParent.add(this.avatar);
  }

  onResults(results) {
    // debugger;

    if (this.avatar) {
      // do something with prediction results
      // landmark names may change depending on TFJS/Mediapipe model version
      const facelm = results.faceLandmarks;
      // let poselm = results.poseLandmarks;
      const poselm3D = results.ea;
      const rightHandlm = results.rightHandLandmarks;
      const leftHandlm = results.leftHandLandmarks;

      // window.results = results;

      /* for (const lms of [
        poselm3D,
        rightHandlm,
        leftHandlm
      ]) {
        if (lms) {
          console.log('got lms', lms);
          for (const lm of lms) {
            if (typeof lm.z !== 'number') {
              debugger;
            }
            lm.z *= -1;
          }
        }
      } */

      if (facelm) {
        _solvePoseToAvatar(poselm3D, leftHandlm, rightHandlm, this.idleAvatar, fakeAvatar);
        const faceRig = Kalidokit.Face.solve(facelm, {runtime: 'mediapipe', imageSize: internalDimensions});
        // let poseRig = Kalidokit.Pose.solve(poselm3D, poselm, {runtime:'mediapipe', imageSize: internalDimensions, enableLegs: true});
        // window.poselm3D = poselm3D;
        const rightHandRig = rightHandlm ? Kalidokit.Hand.solve(rightHandlm, 'Right') : null;
        const leftHandRig = leftHandlm ? Kalidokit.Hand.solve(leftHandlm, 'Left') : null;
        // let legsRig = calcLegs(poselm3D);
        // window.poseRig = poseRig;
        // window.legsRig = legsRig;

        /* const _renderOverlay = () => {
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

          const s = 5;
          const halfS = s/2;
          const _drawLm = (index, style) => {
            overlayCtx.fillStyle = style;
            const point = facelm[index];
            overlayCtx.fillRect(point.x - halfS, point.y - halfS, s, s);
          };
          _drawLm(points.pupil.left[0], '#FF0000');
          _drawLm(points.eye.left[0], '#00FF00');
          _drawLm(points.eye.left[1], '#0000FF');

          // _drawLm(points.pupil.right[0], '#FF0000');
          // _drawLm(points.eye.right[0], '#00FF00');
          // _drawLm(points.eye.right[1], '#0000FF');
        };
        _renderOverlay(); */

        // console.log('got', faceRig, poseRig);
        if (faceRig) {
          const {
            /* eye, */
            head,
            mouth: {
              shape: {A, E, I, O, U},
            },
          } = faceRig;
          // const {degrees} = head;

          const pupilPos = (lm, side = 'left') => {
            const eyeOuterCorner = new Kalidokit.Vector(lm[points.eye[side][0]]);
            const eyeInnerCorner = new Kalidokit.Vector(lm[points.eye[side][1]]);
            const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
            const midPoint = eyeOuterCorner.lerp(eyeInnerCorner, 0.5);
            const pupil = new Kalidokit.Vector(lm[points.pupil[side][0]]);
            // console.log('got', pupil.x, midPoint.x, eyeWidth, dx/eyeWidth, eyeInnerCorner.x, eyeOuterCorner.x);
            const dx = (midPoint.x - pupil.x) / (eyeWidth / 2);
            // eye center y is slightly above midpoint
            const dy = (midPoint.y - pupil.y) / (eyeWidth / 2);

            // console.log('got dx', dx, dy);

            return {x: dx, y: dy};
          };
          const lPupil = pupilPos(facelm, 'left');
          const rPupil = pupilPos(facelm, 'right');
          const pupil = {
            x: -(lPupil.x + rPupil.x) * 0.5,
            y: (lPupil.y + rPupil.y) * 0.5,
          };
          const mouth = (() => {
            const left = new THREE.Vector3().copy(facelm[points.mouth[0]]);
            const right = new THREE.Vector3().copy(facelm[points.mouth[1]]);
            // const top = new THREE.Vector3().copy(facelm[points.mouth[2]]);
            // const bottom = new THREE.Vector3().copy(facelm[points.mouth[3]]);
            const centerTop = new THREE.Vector3().copy(facelm[points.mouth[4]]);
            const centerBottom = new THREE.Vector3().copy(facelm[points.mouth[5]]);
            const cheekLeftOuter = new THREE.Vector3().copy(facelm[points.mouth[6]]);
            const cheekRightOuter = new THREE.Vector3().copy(facelm[points.mouth[7]]);
            const cheekBottom = new THREE.Vector3().copy(facelm[points.mouth[8]]);

            const center = new THREE.Vector3().copy(centerTop).lerp(centerBottom, 0.5);

            const plane = new THREE.Plane().setFromCoplanarPoints(
              cheekLeftOuter,
              cheekRightOuter,
              cheekBottom,
            );

            const leftPlane = plane.projectPoint(left, new THREE.Vector3());
            const rightPlane = plane.projectPoint(right, new THREE.Vector3());
            // const topPlane = plane.projectPoint(top, new THREE.Vector3());
            // const bottomPlane = plane.projectPoint(bottom, new THREE.Vector3());
            const centerPlane = plane.projectPoint(center, new THREE.Vector3());
            const xAxis = rightPlane.clone().sub(leftPlane).normalize();
            const yAxis = xAxis.clone().cross(plane.normal).normalize();
            // const yAxis = topPlane.clone().sub(bottomPlane).normalize();

            /* console.log('plane normal',
              plane.normal.toArray().join(','),
              xAxis.toArray().join(','),
              yAxis.toArray().join(',')
            ); */

            const leftRightLine = new THREE.Line3(leftPlane, rightPlane);

            const centerClosestPoint = leftRightLine.closestPointToPoint(centerPlane, true, new THREE.Vector3());
            const centerOffset = centerClosestPoint.clone().sub(centerPlane);
            const centerY = centerOffset.dot(yAxis);
            if (centerY <= 2) {
              return -clamp(2 - centerY, 0, 1);
            } else {
              return clamp((centerY - 2) / 6, 0, 1);
            }
          })();
          // console.log('got mouth', mouth);

          const eyes = [
            getEyeOpen(facelm, 'left'),
            getEyeOpen(facelm, 'right'),
          ];
          const brows = [
            getBrowRaise(facelm, 'left'),
            getBrowRaise(facelm, 'right'),
          ];
          // window.brows = brows;
          this.avatar.avatar.arPose = {
            head: new THREE.Vector3()
              .copy(head.degrees)
              .multiplyScalar(Math.PI / 180),
            pose: fakeAvatar,
            hands: [
              leftHandRig,
              rightHandRig,
            ],
            face: {
              eyes: [1 - eyes[1], 1 - eyes[0]],
              brows: [1 - brows[1], 1 - brows[0]],
              pupils: [
                [pupil.x, pupil.y],
                [pupil.x, pupil.y],
              ],
              mouth,
              vowels: [A, E, I, O, U],
            },
          };
        } else {
          this.avatar.avatar.arPose = null;
        }
      }
    }
  }

  setAvatarPose(dstAvatar, srcAvatar = this.avatar.avatar) {
    dstAvatar.arPose = srcAvatar?.arPose;
  }

  destroy() {
    this.videoCapture.destroy();
    this.domElement.remove();
    this.live = false;
  }
}
