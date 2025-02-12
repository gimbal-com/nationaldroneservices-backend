import { Request, Response } from 'express';  
import bcrypt from 'bcryptjs'; 
import crypto from 'crypto';  
import db from '../config/database';  
import { LoginData, RegisterData, User } from '../types/auth';  
import jwt from 'jsonwebtoken';  

/**
 * @description Registers a new user by validating input, hashing the password, and inserting the user into the database
 * @param req Request object containing user registration data
 * @param res Response object to send back the result of the registration process
 */
export const register = (req: Request, res: Response) => {
    const { username, password, email, accountType }: RegisterData = req.body;                            // Extract user input from the request body

    // Check if the username already exists in the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });                   // Handle any database errors
        }

        if (row) {
            return res.status(400).json({ success: false, message: 'Username already exists' });          // Return error if username already exists
        }

        // Hash the password using bcrypt and generate a random token for email confirmation
        const hashedPassword = bcrypt.hashSync(password, 10);
        const confirmationToken = crypto.randomBytes(16).toString('hex');

        // Insert the new user data into the database
        db.run(
            'INSERT INTO users (username, password, email, account_type, confirmed, confirmation_token) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email, accountType, false, confirmationToken],                     // Insert user details into the users table
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to register user' });  // Handle errors during insertion
                }

                return res.status(201).json({ success: true, message: 'User registered successfully' });  // Return success message upon successful registration
            }
        );
    });
};

/**
 * @description Authenticates the user by verifying the password and generating a JWT token for further requests
 * @param req Request object containing login data
 * @param res Response object to send back the result of the login process
 */
export const login = (req: Request, res: Response) => {
    const { username, password }: LoginData = req.body;                                       // Extract username and password from the request body

    // Check if the username exists in the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: User) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });      // Handle database errors
        }

        if (!row) {
            return res.status(400).json({ success: false, message: 'User not found' });      // Return error if user is not found
        }

        // Compare the provided password with the stored hashed password
        if (!bcrypt.compareSync(password, row.password)) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });  // Return error if passwords don't match
        }

        // Generate a JWT token with the user's details, using a secret key and setting an expiration time
        const token = jwt.sign({ id: row.id, email: row.email, username: row.username, accountType: row.account_type }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        // Send back the success message along with the token and user details
        res.status(200).json({ success: true, message: 'Login successful', token: token, user: { username, email: row.email, accountType: row.account_type, id: row.id } });
    });
};

/**
 * @description Confirms the user's email by validating the confirmation token and updating the user status in the database
 * @param req Request object containing the token to confirm the user's email
 * @param res Response object to send back the result of the email confirmation process
 */
export const confirmEmail = (req: Request, res: Response) => {
    const { token } = req.params;  // Extract the confirmation token from the request parameters

    // Look for the user with the corresponding confirmation token
    db.get('SELECT * FROM users WHERE confirmation_token = ?', [token], (err, row: User) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });  // Handle database errors
        }

        if (!row) {
            return res.status(400).json({ success: false, message: 'Invalid token' });  // Return error if the token is invalid
        }

        if (row.confirmed) {
            return res.status(400).json({ success: false, message: 'Account already confirmed' });  // Return error if the account is already confirmed
        }

        // Update the user account to mark it as confirmed and clear the confirmation token
        db.run(
            'UPDATE users SET confirmed = ?, confirmation_token = NULL WHERE confirmation_token = ?',
            [true, token],
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to confirm account' });  // Handle errors during account confirmation
                }

                // Send success message after successfully confirming the user's email
                res.status(200).json({ success: true, message: 'Account successfully confirmed' });
            }
        );
    });
};
