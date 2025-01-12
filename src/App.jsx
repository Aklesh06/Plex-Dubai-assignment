import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/DashBoard'
import AdminHome from './components/AdminDash'
import Campaign from "./components/Campaign";
import Invoice from "./components/Invoice";
import ForgotPass from "./components/ForgotPass";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/adminDash" element={<AdminHome />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/forgotPass" element={<ForgotPass />} />
      </Routes>
    </Router>
  );
}

export default App
