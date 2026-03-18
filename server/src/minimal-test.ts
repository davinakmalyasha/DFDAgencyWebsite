import express from 'express';
const app = express();
const PORT = 5001;

app.get('/', (req, res) => {
    res.send('Minimal server is running');
});

app.listen(PORT, () => {
    console.log(`Minimal server listening on ${PORT}`);
    process.exit(0);
});
