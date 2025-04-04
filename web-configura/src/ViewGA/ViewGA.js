import React, { useEffect } from "react";
// import { Autodesk } from "@forge/viewer";

const ViewGA = () => {
    const urn = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6ZHdnLWFwaS9HQV9maW5hbF92Mi5kd2c";

    useEffect(() => {
        const options = {
            env: "AutodeskProduction",
            getAccessToken: async (onSuccess, onError) => {
                try {
                    const response = await fetch("http://localhost:8000/api/getAccessToken");
                    const { access_token, expires_in } = await response.json();
                    onSuccess(access_token, expires_in);
                } catch (error) {
                    onError(error);
                }
            },
        };

        window.Autodesk.Viewing.Initializer(options, () => {
            const viewerDiv = document.getElementById("forgeViewer");
            const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerDiv);
            viewer.start();

            window.Autodesk.Viewing.Document.load(
                `urn:${urn}`,
                (doc) => {
                    const defaultModel = doc.getRoot().getDefaultGeometry();
                    viewer.loadDocumentNode(doc, defaultModel);
                },
                (error) => {
                    console.error("Error loading document:", error);
                }
            );
        });

        return () => {
            window.Autodesk.Viewing.shutdown();
        };
    }, [urn]);

    return <div id="forgeViewer" style={{ width: "100%", height: "100vh" }}></div>;
};

export default ViewGA;