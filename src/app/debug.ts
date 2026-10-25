/**
 * Diagnostics switch: ?debug in any URL turns it on for the rest of the browser session (in-app
 * navigation drops the query). Read once at startup.
 */
let on = false;
try {
  on = new URLSearchParams(window.location.search).has('debug');
  if (on) sessionStorage.setItem('el-debug', '1');
  on ||= sessionStorage.getItem('el-debug') === '1';
} catch {
  // storage blocked: only the URL counts
}

export const debugOn = () => on;
