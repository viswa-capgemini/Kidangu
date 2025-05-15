import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import UploadDwg from './DwgUpload/UploadDwg';
import EnquiryForm from './EnquiryForm/EnquiryForm';
import EnquiryTable from './EnquiryTable/EnquiryTable';
import ViewGA from './ViewGA/ViewGA';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
    <Router>
    <div className="App">
        <Routes>
            <Route path="/" element={<EnquiryTable />} />
            <Route path="/enquiry-form" element={<EnquiryForm />} />
            <Route path="/configurator" element={<Header />} />
            <Route path="/upload-dwg" element={<UploadDwg />} />
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/ga-view" element={<ViewGA />} />
            {/* <Route path="/sidebar" element={<Sidebar />} /> */}
        </Routes>
    </div>
</Router>
</Provider>
    
  );
}

export default App;
