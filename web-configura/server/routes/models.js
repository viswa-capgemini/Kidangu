const express = require('express');
const formidable = require('express-formidable');
const { listObjects, uploadObject } = require("../services/forge/oss.js")
const { translateObject, getManifest, urnify } = require('../services/forge/md.js');

let router = express.Router();

// GET /api/models
// List all uploaded models.
router.get('/', async function (req, res, next) {
    try {
        const objects = await listObjects();
        res.json(objects.map(o => ({
            name: o.objectKey,
            urn: urnify(o.objectId)
        })));
    } catch (err) {
        next(err);
    }
});

// POST /api/models
// Upload new model and kick-off its translation.
router.post('/', formidable(), async function (req, res, next) {
    const file = req.files['model-file'];
    if (!file) {
        res.status(400).send('The required field ("model-file") is missing.');
        return;
    }
    try {
        const obj = await uploadObject(file.name, file.path);
        await translateObject(urnify(obj.objectId), req.fields['model-zip-entrypoint']);
        res.json({
            name: obj.objectKey,
            urn: urnify(obj.objectId)
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;