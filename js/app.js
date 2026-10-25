// Navigation: shows one screen at a time and highlights its tab.
// Shared file: agree with each other before changing it.

const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const scrollArea = document.querySelector('.screens');

// Each tab remembers its own scroll position, so switching tabs never
// lands you halfway down another screen.
const scrollPositions = {};
let currentScreen = null;

function showScreen(name) {
  if (currentScreen) scrollPositions[currentScreen] = scrollArea.scrollTop;

  // Hide every screen except the one we want
  screens.forEach((screen) => {
    screen.hidden = screen.id !== name;
  });

  // Mark the matching tab as current, clear the rest
  tabs.forEach((tab) => {
    if (tab.dataset.tab === name) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  scrollArea.scrollTop = scrollPositions[name] || 0;
  currentScreen = name;
}

// Lets screens reset a tab's remembered position (used by the demo reset)
window.resetScrollPositions = () => {
  Object.keys(scrollPositions).forEach((key) => delete scrollPositions[key]);
  scrollArea.scrollTop = 0;
};

// Switch screens when a tab is tapped. Tapping the tab you're already on tells
// that screen to go back to its main view (e.g. Invest's list, Profile's main page).
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    if (name === currentScreen) {
      document.getElementById(name).dispatchEvent(new CustomEvent('tabreselect'));
      scrollArea.scrollTop = 0;
      return;
    }
    showScreen(name);
  });
});

// Screens without a tab (Transaction history) are opened with App.show() and
// closed with App.back(), which returns to the screen you came from.
let previousScreen = 'home';
window.App = {
  show(name) {
    if (name !== currentScreen) previousScreen = currentScreen || 'home';
    showScreen(name);
  },
  back() {
    showScreen(previousScreen);
    const tab = document.querySelector(`.tab[data-tab="${previousScreen}"]`);
    if (tab) tab.focus();
  },
  get current() {
    return currentScreen;
  },
};

// Ask each screen file to draw its content once
Object.keys(Screens).forEach((name) => {
  Screens[name](document.getElementById(name));
});

// Start on Home
showScreen('home');
