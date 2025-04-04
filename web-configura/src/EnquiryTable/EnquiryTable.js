import React, { useEffect, useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';
import dynamoDB from "../aws-config.js";
import { useNavigate } from "react-router-dom";

const EnquiryTable = () => {
    const columns = [
        'Customer Name',
        'Actions',
        'Created Date',
        'Contact Number',
        'Email ID',
        'Enquiry ID',
        'Reference Number',
        'Product Group',
        'Billing Address',
        'Status',
        'View GA',
        'View BOM',
        'Edit/Delete',
    ];

    const columnMapping = {
        "Customer Name": "customerName",
        "Actions": "actions",
        "Created Date": "createdDate",
        "Contact Number": "contactNumber",
        "Email ID": "emailId",
        "Enquiry ID": "enquiryId",
        "Reference Number": "referenceNumber",
        "Product Group": "productGroup",
        "Billing Address": "address",
    };

    const [rows, setRows] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEnquiryData();
    }, []);

    const fetchEnquiryData = async () => {
        const params = {
            TableName: "EnquiryTable", // Ensure this matches exactly
        };

        try {
            const data = await dynamoDB.scan(params).promise();
            console.log("Fetched Data:", data.Items);
            setRows(data.Items);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <h2>Enquiry List</h2>
                <Box>
                    <Button variant="contained" onClick={() => navigate("/enquiry-form")} color="primary" style={{ marginRight: '10px' }}>
                        Create Enquiry
                    </Button>
                    <Button variant="contained" color="secondary">
                        Create Customer
                    </Button>
                </Box>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableCell key={index}>{column}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length > 0 ? (
                            rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex}>
                                            {column === "Edit/Delete" ? (
                                                <>
                                                    <Button variant="contained" color="primary">
                                                        Edit
                                                    </Button>
                                                    <Button variant="contained" color="error">
                                                        Delete
                                                    </Button>
                                                </>
                                            ) : column === "Product Group" && Array.isArray(row[columnMapping[column]]) ? (
                                                row[columnMapping[column]].join(", ")
                                            ) : column === "View GA" ? (
                                                <Button variant="contained" color="primary" onClick={() => navigate("/ga-view", { state: { enquiryId: row.enquiryId } })}>
                                                    View GA
                                                </Button>
                                            ) :(
                                                row[columnMapping[column]] || "N/A"
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center">
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EnquiryTable;