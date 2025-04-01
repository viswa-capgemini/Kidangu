const { DerivativesApi } = require('forge-apis');
const { getInternalToken } = require('./auth.js');

async function translateObject(urn, rootFilename) {
    const job = {
        input: { urn },
        output: { formats: [{ type: 'svf', views: ['2d', '3d'] }] }
    };
    if (rootFilename) {
        job.input.compressedUrn = true;
        job.input.rootFilename = rootFilename;
    }
    const resp = await new DerivativesApi().translate(job, {}, null, await getInternalToken());
    console.log("job",job,resp);
    return resp.body;
}

async function get2DViewUrns(urn) {
    const manifest = await getManifest(urn);
    if (!manifest || !manifest.derivatives) {
        throw new Error('No derivatives found');
    }

    const derivatives = manifest.derivatives;
    const svfDerivatives = derivatives.filter(d => d.outputType === 'svf');

    let viewUrns = [];
    svfDerivatives.forEach(svf => {
        if (svf.children) {
            svf.children.forEach(child => {
                if (child.role === '2d') {
                    viewUrns.push(child.urn);
                }
            });
        }
    });

    return viewUrns;
}


async function getManifest(urn) {
    try {
        const resp = await new DerivativesApi().getManifest(urn, {}, null, await getInternalToken());
        console.log("resp in mani", resp);
        return resp.body;
    } catch (err) {
        if (err.statusCode === 404) {
            return null;
        } else {
            throw err;
        }
    }
}

function urnify(id) {
    return Buffer.from(id).toString('base64').replace(/=/g, '');
}

module.exports = {
    translateObject,
    get2DViewUrns,
    getManifest,
    urnify
};
