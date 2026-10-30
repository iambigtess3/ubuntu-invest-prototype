// Illustrations: the ONE place that says which picture each screen uses.
// Shared file: agree with each other before changing it.
//
// To change an illustration:
//   1. Put the new image in assets/illustrations/ (PNG, WebP, JPG or SVG).
//   2. Change its `src` below, and `width`/`height` to the new image's size
//      in pixels (they reserve space while it loads, so nothing jumps).
//      File names must match exactly, including capital letters.
// Every screen uses UI.illustration('key'), so no screen file needs editing.
// The pictures are decorative: what they show is always said in the text too.

window.ILLUSTRATIONS = {
  // LYNK welcome: exactly 4 seamless repeats of the glass spiral stacked in one
  // image (the welcome page moves it up by one repeat in a loop). If you change
  // this path, change the matching preload line in index.html too.
  welcome: { src: 'assets/illustrations/lynk-spiral-loop.webp', width: 720, height: 2512 },
  circle: { src: 'assets/illustrations/circle-network.png', width: 600, height: 547 },
  kyc: { src: 'assets/illustrations/verified_id.png', width: 600, height: 514 },
  learn: { src: 'assets/illustrations/learn-growth.png', width: 640, height: 587 },
  emptyPortfolio: { src: 'assets/illustrations/empty-portfolio.png', width: 600, height: 462 },
  purchaseSuccess: { src: 'assets/illustrations/green-check.png', width: 560, height: 430 },
  withdrawalPending: { src: 'assets/illustrations/withdrawal_pending.png', width: 600, height: 402 },
};
