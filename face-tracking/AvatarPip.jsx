import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './AvatarPip.module.css';

import {world} from '../world.js';

import metaversefile from '../metaversefile-api.js';
import ioManager from '../io-manager.js';

let arControl = true;
export default function AvatarPip({
  app,
}) {
  const [faceTrackingEnabled, setFaceTrackingEnabled] = useState(true);
  const [faceTrackingOpen, setFaceTrackingOpen] = useState(true);
  const [arAvatarEnabled, setArAvatarEnabled] = useState(false);
  const [arCameraEnabled, setArCameraEnabled] = useState(false);
  const [arPoseEnabled, setArPoseEnabled] = useState(false);

  useEffect(() => {
    function getFaceTracker() {
      const faceTracker = ioManager.getFaceTracker();
      if (faceTracker) {
        const localPlayer = metaversefile.useLocalPlayer();
        if (arControl) {
          faceTracker.setAvatarPose(localPlayer);
        } else {
          faceTracker.setAvatarPose(localPlayer, null);
        }
        console.log('set ar pose', localPlayer.arPose);
      }
    }

    world.appManager.addEventListener('frame', getFaceTracker);
    return () => {
      world.appManager.removeEventListener('frame', getFaceTracker);
    };
  });

  const arUiContentRef = useRef();

  const _isSomeArOpen = () => arAvatarEnabled || arCameraEnabled || arPoseEnabled;
  useEffect(() => {
    if (faceTrackingEnabled && !_isSomeArOpen()) {
      _toggleFaceTracking();
    }
  }, [arAvatarEnabled, arCameraEnabled, arPoseEnabled]);
  const _toggleFaceTracking = () => {
    arControl = false;

    const newFaceTracking = !ioManager.getFaceTracking();
    if (arUiContentRef.current) {
      arUiContentRef.current.append(newFaceTracking.videoCanvas);
    }
    ioManager.setFaceTracking(newFaceTracking);
    setFaceTrackingEnabled(newFaceTracking);
    setFaceTrackingOpen(false);
    setArAvatarEnabled(false);
    setArCameraEnabled(false);
    setArPoseEnabled(false);
    if (newFaceTracking) {
      _toggleArAvatar();

      const faceTracker = ioManager.getFaceTracker();
      faceTracker.addEventListener('open', e => {
        setFaceTrackingOpen(true);
      }, {once: true});
    }
  };
  const _toggleArAvatar = () => {
    const {domElement, videoCapture: {videoCanvas}} = ioManager.getFaceTracker();
    if (!domElement.parentElement) {
      const videoCanvasParent = videoCanvas.parentElement;
      if (videoCanvasParent) {
        videoCanvas.remove();
      }

      domElement.classList.add(styles['avatar-canvas']);
      arUiContentRef.current.appendChild(domElement);

      if (videoCanvasParent) {
        videoCanvasParent.appendChild(videoCanvas);
      }
    } else {
      domElement.remove();
    }

    setArAvatarEnabled(!!domElement.parentElement);
  };
  const _toggleArCamera = () => {
    const {domElement, videoCapture: {videoCanvas}} = ioManager.getFaceTracker();
    if (!videoCanvas.parentElement) {
      videoCanvas.classList.add(styles['camera-canvas']);
      arUiContentRef.current.appendChild(videoCanvas);
    } else {
      videoCanvas.remove();
    }

    setArCameraEnabled(!!videoCanvas.parentElement);
  };
  const _toggleArPose = () => {
    arControl = !arControl;

    setArPoseEnabled(!arPoseEnabled);
  };

  return (
    <div className={styles.container} onClick={e => {
      e.stopPropagation();
    }}>
      <div className={styles.inner}>
        <div className={styles['ar-ui']}>
          {faceTrackingEnabled ? <div className={styles.switches}>
            <div className={classnames(styles.switch, arAvatarEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArAvatar();
            }}>AVA</div>
            <div className={classnames(styles.switch, arCameraEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArCamera();
            }}>CAM</div>
            <div className={classnames(styles.switch, arPoseEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArPose();
            }}>POSE</div>
            <div className={styles.switch} onClick={e => {
              _toggleFaceTracking();
            }}>EXIT</div>
          </div> : null}
          <div className={
            classnames(
              // styles['content-placeholder'],
              // styles.visible,
              /*, faceTrackingEnabled && !faceTrackingOpen ? styles.visible : null) */
            )} >
            {/* <h1>Standby...</h1> */}
          </div>
          <div className={classnames(
            // styles.content,
            /*, faceTrackingEnabled && faceTrackingOpen ? styles.visible : null */
          )} ref={arUiContentRef} />
        </div>
      </div>
    </div>
  );
}
