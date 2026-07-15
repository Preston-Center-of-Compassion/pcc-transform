import { h } from "preact";
import Router from "preact-router";
import { Link } from "preact-router/match";
import CampPage from "../pages/CampPage";
import AfterschoolPage from "../pages/AfterschoolPage";
import { createHashHistory } from "../lib/hashHistory";

// Hash routing keeps the app working under the GitHub Pages project subpath,
// where there is no SPA fallback for real paths.
const history = createHashHistory();

function App() {
  return <div>
    <nav className="flex gap-4 mx-auto px-5">
      <Link activeClassName="font-bold" href="/">Camp</Link>
      <Link activeClassName="font-bold" href="/afterschool">Afterschool</Link>
    </nav>

    <Router history={history}>
      <CampPage path="/" />
      <AfterschoolPage path="/afterschool" />
    </Router>
  </div>
}

export default App;
