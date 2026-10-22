// Navigation: shows one screen at a time and highlights its tab.
// Shared file: agree with each other before changing it.

const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');

function showScreen(name) {
  // Hide every screen except the one we want
  screens.forEach((screen) => {
    screen.hidden = screen.id !== name;
  });

  // Mark the matching tab as current (bold), clear the rest
  tabs.forEach((tab) => {
    if (tab.dataset.tab === name) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  });
}

// Switch screens when a tab is tapped
tabs.forEach((tab) => {
  tab.addEventListener('click', () => showScreen(tab.dataset.tab));
});

// Ask each screen file to draw its content once
Object.keys(Screens).forEach((name) => {
  Screens[name](document.getElementById(name));
});

// Start on Home
showScreen('home');