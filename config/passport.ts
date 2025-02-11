import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import db from './database';
import passport from 'passport';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'secret', // Replace with your actual secret
};

passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
        db.get('SELECT * FROM users WHERE id = ?', [jwt_payload.id], (err, user: any) => {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    })      
);

export default passport;