import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";      // ✅ Default import
import TestAuth from "./TestAuth";    // ✅ Default import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestAuth />} />
      </Routes>
    </Router>
  );
}

export default App; // ✅ Default export