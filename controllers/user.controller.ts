import { Request, Response } from 'express';
import db from '../config/database';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const getCertificateFiles = (req: Request, res: Response) => {
    const userId = req.query.userId;

    db.run(
        `SELECT * FROM cert_files WHERE user_id = ?`,
        [userId],
        (err: any, certs: any) => {
            if(err) {
                console.log(err);
                return res.status(402).json({ success: false, certs: null });
            }

            return res.status(200).json({ success: true, certs });
        }
    )
}

export const uploadCertFiles = (req: Request, res: Response) => {
    const userId = req.query.userId;
    
    const uploadDir = path.join(__dirname, '../uploads/certs');
    const form = formidable({ keepExtensions: true });

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse the form to handle file uploads
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing the files:', err);
            return res.status(500).json({ success: false, message: 'File upload error' });
        }

        const fileEntries = files.files;

        let newFiles: any = [];

        fileEntries?.forEach((file: any) => {
            const oldPath = file.filepath;
            const newPath = path.join(uploadDir, file.newFilename);

            // Move the uploaded file to the designated folder
            fs.writeFileSync(newPath, fs.readFileSync(oldPath));

            // Insert file record into the database
            db.run(
                `INSERT INTO cert_files (user_id, path) VALUES (?, ?)`,
                [userId, file.newFilename],
                (dbErr) => {
                    if (dbErr) {
                        console.error('Error saving file record:', dbErr);
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                }
            );

            newFiles.push({user_id: userId, path: file.newFilename});
        })

        res.status(200).json({ success: true, message: 'Files uploaded successfully', files: newFiles });
    });
}