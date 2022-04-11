
export default class FaceTrackingWorker extends EventTarget {
  constructor() {
    super();

    this.messageChannel = new MessageChannel();
    this.messagePort = this.messageChannel.port1;
    this.open = false;

    this.iframe = document.createElement('iframe');
    // this.iframe.style.visibility = 'hidden';
    this.iframe.style.cssText = `\
      position: absolute;
      top: 0;
      left: 0;
      border: 0;
      height: 30px;
      width: 30px;
      /* height: 0;
      width: 0; */
      z-index: 10;
      pointer-events: none;
    `;
    this.iframe.allow = 'cross-origin-isolated';
    // window.iframe = this.iframe;

    const l = window.location;
    const port = parseInt(l.port, 10) || 0;
    const u = `${l.protocol}//${l.host.replace(/webaverse\.com$/, 'webaverse.online')}/face-tracking/face-tracking.html`;
    // const targetOrigin = `https://localhost.webaverse.com`;
    this.iframe.src = u;
    this.iframe.addEventListener('load', e => {
      this.iframe.contentWindow.postMessage({
        _webaverse: true,
        messagePort: this.messageChannel.port2,
      }, '*', [this.messageChannel.port2]);

      const _handleMessage = e => {
        if (!this.open) {
          this.dispatchEvent(new MessageEvent('open'));
          this.open = true;
        }

        this.dispatchEvent(new MessageEvent('result', {
          data: e.data,
        }));
      };
      this.messagePort.onmessage = _handleMessage;
    }, {once: true});
    document.body.appendChild(this.iframe);
  }

  pushImage(image) {
    this.messagePort.postMessage({
      image,
    }, [image]);
  }

  async processFrame(image) {
    // console.log('process frame 0');
    this.pushImage(image);

    // console.log('process frame 1');
    const result = await new Promise((resolve, reject) => {
      this.addEventListener('result', e => {
        if (!e.data.error) {
          resolve(e.data.result);
        } else {
          reject(e.data.error);
        }
      }, {once: true});
    });
    // console.log('process frame 2');
    return result;
  }

  destroy() {
    this.iframe.remove();
  }
}
