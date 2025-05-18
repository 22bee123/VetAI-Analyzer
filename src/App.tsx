import { useState } from "react"
import LandingPage from "./pages/LandingPage"
import FillupForm from "./pages/FilluppForm"

function App() {
  const [currentPage, setCurrentPage] = useState<string>("form");

  const renderPage = () => {
    switch (currentPage) {
      case "form":
        return <FillupForm />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between">
          <div className="text-xl font-bold text-blue-600">VetAI Analyzer</div>
          <div className="space-x-4">

            <button 
              onClick={() => setCurrentPage("form")} 
              className={`px-3 py-1 rounded-md ${currentPage === "form" ? "bg-blue-100 text-blue-700" : "text-neutral-700"}`}
            >
              Analyze Symptoms
            </button>

          </div>
        </div>
      </nav>
      
      <main className="py-6">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
