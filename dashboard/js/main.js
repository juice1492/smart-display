// Entry point. Order matters: each module attaches to the shared window.App.
// Chores, photos, home-control, and agents stay in js/views but are not mounted.
import './icons.js';
import './config.js';
import './data.js';
import './app.js';
import './views/home.js';
import './views/calendar.js';
import './views/weather.js';
import './views/shopping.js';
import './diag.js';
