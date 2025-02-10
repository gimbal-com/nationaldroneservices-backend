import dotenv from 'dotenv';
import initializeExpress from './config/express';
dotenv.config();

const port = process.env.PORT || 8000;
const app = initializeExpress();

app.listen(port, () => {
    console.log(`Server is Fire at https://localhost:${port}`);
});