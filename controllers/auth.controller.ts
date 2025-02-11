import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../config/database';
import { LoginData, RegisterData, User } from '../types/auth';
import jwt from 'jsonwebtoken';

export const register = (req: Request, res: Response) => {
    const { username, password, email, accountType }: RegisterData = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (row) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const confirmationToken = crypto.randomBytes(16).toString('hex');

        db.run(
            'INSERT INTO users (username, password, email, account_type, confirmed, confirmation_token) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email, accountType, false, confirmationToken],
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to register user' });
                }

                return res.status(201).json({ success: true, message: 'User registered successfully' });
            }
        );
    });
};

export const login = (req: Request, res: Response) => {
    const { username, password }: LoginData = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: User) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!row) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (!bcrypt.compareSync(password, row.password)) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: row.id, email: row.email, username: row.username, accountType: row.account_type }, process.env.JWT_SECRET || 'secret', {expiresIn: '1h'});

        res.status(200).json({ success: true, message: 'Login successful', token: token, user: { username, email: row.email, accountType: row.account_type, id: row.id } });
    });
}

export const confirmEmail = (req: Request, res: Response) => {
    const { token } = req.params;

    db.get('SELECT * FROM users WHERE confirmation_token = ?', [token], (err, row: User) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!row) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        if (row.confirmed) {
            return res.status(400).json({ success: false, message: 'Account already confirmed' });
        }

        db.run(
            'UPDATE users SET confirmed = ?, confirmation_token = NULL WHERE confirmation_token = ?',
            [true, token],
            function (err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to confirm account' });
                }

                res.status(200).json({ success: true, message: 'Account successfully confirmed' });
            }
        );
    });
}

