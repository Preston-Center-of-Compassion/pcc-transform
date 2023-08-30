import { h } from "preact";
import Router from "preact-router";
import { Link } from "preact-router/match";
import CampPage from "../pages/CampPage";
import AfterschoolPage from "../pages/AfterschoolPage";

function App() {
  return <div>
    <nav className="flex gap-4 mx-auto px-5">
      <Link activeClassName="font-bold" href="/">Camp</Link>
      <Link activeClassName="font-bold" href="/afterschool">Afterschool</Link>
    </nav>

    <Router>
      <CampPage path="/" />
      <AfterschoolPage path="/afterschool" />
    </Router>
  </div>
}

export default App;
