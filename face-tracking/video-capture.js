import {internalDimensions, domDimensions} from './constants';

export default class VideoCapture extends EventTarget {
  constructor() {
    super();

    this.frame = null;
    this.framePromise = null;
    this.imageCapture = null;
    this.imageCapturePromise = null;
    this.videoEl = null;
    this.videoCanvas = null;
    this.videoCanvasCtx = null;

    this.imageCapturePromise = (async () => {
      this.videoCanvas = document.createElement('canvas');
      this.videoCanvas.width = internalDimensions.width;
      this.videoCanvas.height = internalDimensions.height;
      this.videoCanvas.style.width = domDimensions.width + 'px';
      this.videoCanvas.style.height = domDimensions.height + 'px';
      // this.videoCanvas.style.cssText = this.videoEl.style.cssText;
      this.videoCanvasCtx = this.videoCanvas.getContext('2d');

      this.videoEl = document.createElement('video');
      this.videoEl.width = internalDimensions.width;
      this.videoEl.height = internalDimensions.height;
      this.videoEl.style.width = domDimensions.width + 'px';
      this.videoEl.style.height = domDimensions.height + 'px';

      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = mediaDevices.find(o => o.kind === 'videoinput' && !/virtual/i.test(o.label));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            ideal: internalDimensions.width,
          },
          height: {
            ideal: internalDimensions.height,
          },
          frameRate: {
            ideal: 30,
          },
          facingMode: 'user',
          deviceId: videoDevice.deviceId,
        },
      });
      const videoTrack = stream.getVideoTracks()[0];
      this.videoEl.srcObject = stream;
      this.videoEl.play();

      this.imageCapture = new ImageCapture(videoTrack);
      this.imageCapture.track.addEventListener('mute', e => {
        this.imageCapture.destroy();
        this.imageCapture = null;
      });
      this.imageCapturePromise = null;

      const _recurse = async () => {
        this.ensureFramePromise();
        requestAnimationFrame(_recurse);
      };
      _recurse();

      this.dispatchEvent(new MessageEvent('open'));
    })();
  }

  ensureFramePromise() {
    if (!this.framePromise) {
      this.framePromise = (async () => {
        // console.time('frame');
        this.videoCanvasCtx.drawImage(this.videoEl, 0, 0, internalDimensions.width, internalDimensions.height);
        this.frame && this.frame.close();
        this.frame = await createImageBitmap(this.videoCanvas);
        // console.timeEnd('frame');
        this.framePromise = null;
        return this.frame;
      })();
    }
  }

  async pullFrame() {
    if (this.imageCapturePromise) {
      await this.imageCapturePromise;
    }

    let result = this.frame;
    if (!result) {
      this.ensureFramePromise();
      result = await this.framePromise;
    }
    this.frame = null;
    return result;
  }

  destroy() {
    this.imageCapture.track.stop();
    this.videoEl.remove();
    this.videoCanvas.remove();
  }
}
