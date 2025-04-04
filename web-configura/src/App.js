import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import UploadDwg from './DwgUpload/UploadDwg';
import EnquiryForm from './EnquiryForm/EnquiryForm';
import EnquiryTable from './EnquiryTable/EnquiryTable';
import ViewGA from './ViewGA/ViewGA';

function App() {
  return (
    <Router> {/* ✅ Ensure Router wraps the entire app */}
    <div className="App">
        <Routes>
            <Route path="/" element={<EnquiryTable />} />
            <Route path="/enquiry-form" element={<EnquiryForm />} />
            <Route path="/configurator" element={<Header />} />
            <Route path="/upload-dwg" element={<UploadDwg />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/ga-view" element={<ViewGA />} />
        </Routes>
    </div>
</Router>
    
  );
}

export default App;
