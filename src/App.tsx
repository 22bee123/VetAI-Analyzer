import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Pages/Home';
import VetMap from './Pages/map';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-800">VetAI Analyzer</div>
              <div className="space-x-4">
                <Link to="/" className="text-blue-700 hover:text-blue-900 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Home</Link>
                <Link to="/find-vet" className="text-blue-700 hover:text-blue-900 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Find a Vet</Link>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/find-vet" element={<VetMap />} />
        </Routes>

        <footer className="bg-white shadow-inner mt-10 py-6">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-600">
              <p>© {new Date().getFullYear()} VetAI Analyzer. All rights reserved.</p>
              <p className="text-sm mt-2">Disclaimer: This tool is for informational purposes only and should not replace professional veterinary care.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
