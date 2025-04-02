import React, { useState } from 'react';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, FormHelperText, Grid, Paper, Typography } from '@mui/material';
import axios from 'axios';
import dynamoDB from "../aws-config.js";
import { useNavigate } from "react-router-dom";

const EnquiryForm = () => {
    const [formData, setFormData] = useState({
        customerName: '',
        contactNumber: '',
        emailId: '',
        enquiryNumber: `ENQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        referenceNumber: '',
        productGroup: [],
        address: '',
        createdDate: new Date().toISOString().split('T')[0],
        actions: '',
    });

    const navigate = useNavigate();

    const productGroupOptions = [
        'SPR', 'Cantilever', 'Mezzanine', 'Mobile shelving', 'Shuttle racking',
        'Altius Lite Single tier', 'Altius Titan Single tier', 'Altius Titan Multi tier'
    ];

    const customerNameOptions = [
        'Coca Cola', 'Pepsi', 'Nestle', 'Aachi'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleProductGroupChange = (event) => {
        setFormData({ ...formData, productGroup: event.target.value });
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        console.log('Form Data:', formData);

        const params = {
            TableName: "EnquiryTable",
            Item: {
                enquiryId: formData.enquiryNumber,
                customerName: formData.customerName,
                contactNumber: formData.contactNumber,
                emailId: formData.emailId,
                referenceNumber: formData.referenceNumber,
                productGroup: formData.productGroup,
                address: formData.address,
                createdDate: formData.createdDate,
                actions: formData.actions,
            }
        };
    
        try {
            const response = await dynamoDB.put(params).promise();
            console.log("Data saved successfully:", response);
            navigate("/configurator", {
                state: { enquiryNumber: formData.enquiryNumber },
            }); 
            // alert("Data saved successfully in DynamoDB!");
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data.");
        }
    };

    const validatePhoneNumber = (number) => /^[0-9]{10}$/.test(number);
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return (
        <Paper elevation={3} style={{ padding: 20, maxWidth: 600, margin: '20px auto' }}>
            <Typography variant="h5" gutterBottom>Enquiry Form</Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Customer Name</InputLabel>
                            <Select value={formData.customerName} onChange={handleChange} name="customerName" required>
                                {customerNameOptions.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>Select a customer</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required error={formData.contactNumber && !validatePhoneNumber(formData.contactNumber)} helperText={formData.contactNumber && !validatePhoneNumber(formData.contactNumber) ? 'Invalid phone number' : ''} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Email ID" name="emailId" type="email" value={formData.emailId} onChange={handleChange} required error={formData.emailId && !validateEmail(formData.emailId)} helperText={formData.emailId && !validateEmail(formData.emailId) ? 'Invalid email ID' : ''} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Action" name="actions" value={formData.actions} onChange={handleChange} required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Enquiry Number" name="enquiryNumber" value={formData.enquiryNumber} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Reference Number" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Product Group</InputLabel>
                            <Select multiple value={formData.productGroup} onChange={handleProductGroupChange} name="productGroup" renderValue={(selected) => selected.join(', ')}>
                                {productGroupOptions.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>Select one or more options</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} required multiline rows={3} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Created Date" name="createdDate" type="date" value={formData.createdDate} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" color="primary" fullWidth>Submit</Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default EnquiryForm;
