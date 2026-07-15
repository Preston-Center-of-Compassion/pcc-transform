import type { CustomHistory, Location as RouterLocation } from "preact-router";

/**
 * A minimal hash-based history for preact-router.
 *
 * GitHub Pages serves this app from a project subpath
 * (https://<org>.github.io/pcc-transform/) and has no SPA fallback, so a real
 * path like `/pcc-transform/afterschool` would 404 on refresh. Keeping the
 * route in the URL hash (e.g. `#/afterschool`) means `location.pathname` never
 * changes, so index.html always loads and the router reads the route from the
 * hash on boot.
 */
function currentLocation(): RouterLocation {
  // window.location.hash looks like "#/afterschool"; drop the leading "#".
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathname, search] = raw.split("?");
  return {
    pathname: pathname || "/",
    search: search ? `?${search}` : "",
  };
}

export function createHashHistory(): CustomHistory {
  return {
    get location() {
      return currentLocation();
    },
    push(path: string) {
      window.location.hash = path;
    },
    replace(path: string) {
      const href = `${window.location.pathname}${window.location.search}#${path}`;
      window.history.replaceState(null, "", href);
    },
    listen(callback: (location: RouterLocation) => void) {
      const handler = () => callback(currentLocation());
      window.addEventListener("hashchange", handler);
      return () => window.removeEventListener("hashchange", handler);
    },
  };
}
