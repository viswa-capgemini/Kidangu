import React, { useEffect } from "react";

const CustomLoading = () => {
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.loader}></div>
      <p style={styles.text}>Kindly Wait Until the Layout is Ready</p>
    </div>
  );
};

// Styles for the loading overlay
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    zIndex: 9999,
  },
  loader: {
    width: "50px",
    height: "50px",
    border: "5px solid #fff",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  text: {
    color: "#fff",
    marginTop: "15px",
    fontSize: "18px",
  },
};

export default CustomLoading;
