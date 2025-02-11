import express, { Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import router from '../routes';
import passport from './passport';

const initializeExpress = () => {
    const app: Application = express();
    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(morgan('dev'));


    app.use('/api', router);
    app.use(passport.initialize());
    

    return app;
}


export default initializeExpress;