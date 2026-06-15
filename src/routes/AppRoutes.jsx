import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import AboutUs from "../pages/AboutUs";
import Capabilities from "../pages/Capabilities";
import Tracking from "../pages/Tracking";
import Contact from "../pages/Contact";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/capabilities" element={<Capabilities />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}
