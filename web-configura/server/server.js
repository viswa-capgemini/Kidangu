const express = require("express");
const config = require("config");

const app = express();

const cors = require("cors");

const PORT = 8000;

app.use(express.json({ limit: "500mb"}));
app.use(cors());
app.use(express.urlencoded({limit: "500mb", extended: true}));

app.use("/save/files", require("./routes/files/upload.js"))
app.use('/api', require('./routes/getAccessToken.js'));
app.use("/api/models", require('./routes/models.js'))

app.listen(PORT , () => {
    console.log(`Server is running: ${PORT}`);
})