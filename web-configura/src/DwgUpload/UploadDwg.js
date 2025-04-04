import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { Upload } from '@mui/icons-material';
import axios from "axios";
import {uploadData} from '@aws-amplify/storage';

const steps = ['Upload a DWG file', 'DWG Viewer', 'DWG Properties'];

const UploadDwg = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const urn = useRef("dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHdnLWFwaS9HQV9maW5hbF92Mi5kd2c");
  const viewerContainerRef = useRef(null);
  const viewerRef = useRef(null);

  const isStepOptional = (step) => step === 1;
  const isStepSkipped = (step) => skipped.has(step);

  useEffect(() => {
    if (!window.Autodesk) {
      console.error("Autodesk Viewer not loaded");
      return;
    }
    if (!urn.current || !accessToken) return;
    if (activeStep !== 1) return;
  
    const options = {
      env: "AutodeskProduction",
      accessToken: accessToken,
    };
  
    if(activeStep === 1) {
      window.Autodesk.Viewing.Initializer(options, () => {
        if (viewerRef.current && !viewer) {
          const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
          viewerInstance.start();
          setViewer(viewerInstance);
    
          const documentId = `urn:${urn.current}`;
          // loadModal(viewerInstance, documentId);
        window.Autodesk.Viewing.Document.load(documentId, (doc) => {
          const defaultModel = doc.getRoot().getDefaultGeometry();
          viewerInstance.loadDocumentNode(doc, defaultModel);
        });
        }
      });
    }
  
    return () => {
      if (viewer) {
        viewer.finish();
        setViewer(null);
      }
    };
  }, [urn.current, accessToken, activeStep]);

  useEffect(() => {
    if (activeStep === 2) {
      fetchModelMetadata(urn.current);
    }
  }, [activeStep, urn.current]);

  const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  
  async function getAccessToken() {
    try {
      const resp = await fetch('http://localhost:8000/api/getAccessToken');
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const { access_token, expires_in } = await resp.json();
      console.log("access_token, expires_in", access_token, expires_in);
      setAccessToken(access_token);
      // callback(access_token, expires_in);
    } catch (err) {
      alert('Could not obtain access token. See the console for more details.');
      console.error(err);
    }
  }

  const loadModal = async (viewer, urn) => {
    return new Promise(function (resolve, reject) {
      function onDocumentLoadSuccess(doc) {
          resolve(viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()));
      }
      function onDocumentLoadFailure(code, message, errors) {
          reject({ code, message, errors });
      }
      viewer.setLightPreset(0);
      window.Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  });
  }

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');

      const data = await response.json();

      handleNext();
    setUploading(false);

      if (data.length > 0) {
        // setUrn(data[2].urn); // Assuming URN is returned in the response
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setUploading(false);
    }
  };

  const fetchModelMetadata = async (urn) => {
    console.log("urn in fetchModelMetadata", urn)
    try {
      const response = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) throw new Error('Failed to fetch model metadata');
  
      const metadata = await response.json();
      console.log('Model Metadata:', metadata);
      // return metadata;
    } catch (error) {
      console.error('Error fetching model metadata:', error);
    }
  };
  

  const handleUploadAPS = async(formData) => {
    formData.append("model-file", file);
    if (file.name.endsWith('.zip')) { // When uploading a zip file, ask for the main design file in the archive
      const entrypoint = window.prompt('Please enter the filename of the main design inside the archive.');
      formData.append('model-zip-entrypoint', entrypoint);
  }
  try {
    const resp = await fetch('http://localhost:8000/api/models', { method: 'POST', body: formData });
    if (!resp.ok) {
        throw new Error(await resp.text());
    }
    const model = await resp.json();
    // setUrn(model.urn);
    urn.current = model.urn;
    console.log("model", urn.current);
    getAccessToken()
    fetchModels();
    
} catch (err) {
    console.error(err);
    setUploading(false);
}
  }

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("You can't skip a step that isn't optional.");
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }
  
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
  
    console.log("file in handleUpload", file);
  
    axios.post("http://localhost:8000/save/files", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    .then((res) => {
      if(res.status === 200) {
        console.log("res in API Upload", res.data);
      handleUploadAPS(formData);
      } else {
        console.log("Upload error", res.data)
      }
    })
    .catch((err) => {
      console.log("err in API Upload", err);
      setUploading(false);
    });
  };
  

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label} completed={isStepSkipped(index) ? false : undefined}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button onClick={handleReset} sx={{ mt: 2 }} variant="contained">Reset</Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {activeStep === 0 && (
            <Box sx={{
              border: '2px dashed grey',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}>
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button disabled={uploading} variant="contained" component="span" startIcon={<Upload />}>Choose File</Button>
              </label>
              {file && <Typography>{file.name}</Typography>}
              <Button
                onClick={handleUpload}
                variant="contained"
                color="primary"
                disabled={uploading || !file}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ width: '100%' }} />}
            </Box>
          )}
          {activeStep === 1 && (
            <Box sx={{
              border: '2px dashed grey',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}>
              {/* DWG Viewer Content */}
              <div ref={viewerRef} style={{ width: '100%', height: '500px' }}></div>
            </Box>
          )}
          {activeStep === 2 && (
            <Box sx={{
              border: '2px dashed grey',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}>
              {/* DWG Properties Content */}
              <Typography>Properties</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button color="inherit" disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip}>Skip</Button>
            )}
            {activeStep !== 0 && (
              <Button onClick={handleNext}>{activeStep === steps.length - 1 ? 'Finish' : 'Next'}</Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UploadDwg;
