// Illustrations: the ONE place that says which picture each screen uses.
// Shared file: agree with each other before changing it.
//
// To change an illustration:
//   1. Put the new image in assets/illustrations/ (PNG, WebP, JPG or SVG).
//   2. Change its `src` below, and `width`/`height` to the new image's size
//      in pixels (they reserve space while it loads, so nothing jumps).
// Every screen uses UI.illustration('key'), so no screen file needs editing.
// The pictures are decorative: what they show is always said in the text too.

window.ILLUSTRATIONS = {
  welcome: { src: 'assets/illustrations/welcome.png', width: 640, height: 480 },
  circle: { src: 'assets/illustrations/circle.png', width: 600, height: 547 },
  kyc: { src: 'assets/illustrations/kyc.png', width: 600, height: 514 },
  learn: { src: 'assets/illustrations/learn.png', width: 720, height: 480 },
  emptyPortfolio: { src: 'assets/illustrations/empty-portfolio.png', width: 600, height: 462 },
  purchaseSuccess: { src: 'assets/illustrations/purchase-success.png', width: 560, height: 430 },
  withdrawalPending: { src: 'assets/illustrations/withdrawal-pending.png', width: 600, height: 402 },
};
