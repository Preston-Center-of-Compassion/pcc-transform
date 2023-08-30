import { h } from "preact";
import Router from "preact-router";
import CampPage from "../pages/CampPage";
import AfterschoolPage from "../pages/AfterschoolPage";

function App() {
  return <Router>
    <CampPage path="/" />
    <AfterschoolPage path="/afterschool" />
  </Router>
}

export default App;
