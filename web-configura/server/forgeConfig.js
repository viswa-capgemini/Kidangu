let { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET, PORT } = {
    FORGE_CLIENT_ID: '', 
    FORGE_CLIENT_SECRET: '', 
    FORGE_BUCKET: 'dwg-api'
};
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
FORGE_BUCKET = FORGE_BUCKET || `${FORGE_CLIENT_ID.toLowerCase()}-basic-app`;
PORT = PORT || 8000;

module.exports = {
    FORGE_CLIENT_ID,
    FORGE_CLIENT_SECRET,
    FORGE_BUCKET,
    PORT
};
