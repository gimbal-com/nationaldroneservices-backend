import express, { Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from '../routes';

const initializeExpress = () => {
    const app: Application = express();
    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.use('/api', router);

    return app;
}


export default initializeExpress;