import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';  
import db from './database'; 
import passport from 'passport';  

// Options for JWT authentication
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),   // Extract JWT from the Authorization header as a Bearer token
    secretOrKey: 'secret',                                      // Replace with your actual secret or key for verifying the JWT signature
};

// Configuring passport to use the JwtStrategy
passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {              // JwtStrategy validates the JWT and extracts the payload
        // Query the database to find a user with the ID from the JWT payload
        db.get('SELECT * FROM users WHERE id = ?', [jwt_payload.id], (err, user: any) => {
            if (err) {
                return done(err, false);                        // If an error occurs while querying the database, pass the error to done()
            }
            if (user) {
                return done(null, user);                        // If the user is found, pass the user to done()
            } else {
                return done(null, false);                       // If no user is found, pass false to done()
            }
        });
    })      
);

export default passport;
