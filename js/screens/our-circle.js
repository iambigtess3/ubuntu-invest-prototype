// Our Circle tab
// Owner: [your name]. Ask before editing if this isn't your area.

// Shared list of screens. Every screen file adds itself to it.
window.Screens = window.Screens || {};

// Draws this screen's content inside its <section id="circle">
Screens.circle = function (el) {
  el.innerHTML = `
    <h1>Our Circle</h1>
    <p>Placeholder: your Circles will appear here.</p>
  `;
};