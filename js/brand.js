// Brand settings: the ONE place to change the LYNK logo.
// Shared file: agree with each other before changing it.
//
// To use a new logo:
//   1. Put the new file in assets/ (SVG recommended; PNG works too).
//   2. Change `logo.src` below. If the new file already contains the words
//      the brand name, set `includesName: true` so the text isn't shown twice.
//   3. Set `aspect` to the new file's width ÷ height (1 for a square mark).
// Every screen uses UI.logo(), which sizes the logo by height inside a fixed
// box, so a different shape won't move other parts of the layout.

window.BRAND = {
  name: 'LYNK',
  logo: {
    // Symbol + "lynk" wordmark (mint and white), for dark backgrounds
    src: 'assets/lynk-logo.png',
    includesName: true,
    aspect: 950 / 360,
  },
};
