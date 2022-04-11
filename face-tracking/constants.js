
const domDimensions = {
  width: Math.floor(640 / 1.5),
  height: Math.floor(480 / 1.5),
};
const internalDimensions = {
  width: domDimensions.width * window.devicePixelRatio,
  height: domDimensions.height * window.devicePixelRatio,
};
const trackingPoints = {
  eye: {
    left: [130, 133, 160, 159, 158, 144, 145, 153],
    right: [359, 362, 387, 386, 385, 373, 374, 380],
  },
  brow: {
    right: [35, 244, 63, 105, 66, 229, 230, 231],
    left: [265, 464, 293, 334, 296, 449, 450, 451],
  },
  pupil: {
    right: [473, 474, 475, 476, 477],
    left: [468, 469, 470, 471, 472],
  },
  mouth: [61, 291, 164, 118, 13, 14, 50, 280, 200],
};

export {domDimensions, internalDimensions, trackingPoints};
