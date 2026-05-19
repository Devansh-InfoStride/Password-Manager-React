import { Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Signup from "./components/Signup";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
