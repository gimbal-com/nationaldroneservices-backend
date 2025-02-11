import { Request, Response } from 'express';
import db from '../config/database';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const createJob = (req: Request, res: Response) => {
    const { title, description, budget, address, polygons, userId } = req.body;

    db.run(
        `INSERT INTO jobs (title, description, budget, address, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, budget, address, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to save job' });
            }

            const jobId = this.lastID; // Get the ID of the newly created job

            // Create the default "Images" folder for the job
            db.run(
                `INSERT INTO folders (job_id, name) VALUES (?, ?)`,
                [jobId, 'Images'],
                (folderErr) => {
                    if (folderErr) {
                        console.error('Failed to create default Images folder:', folderErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create default Images folder',
                        });
                    }

                    // Insert polygons if provided
                    if (polygons && Array.isArray(polygons)) {
                        polygons.forEach(polygon => {
                            db.run(
                                `INSERT INTO polygons (job_id, geojson) VALUES (?, ?)`,
                                [jobId, JSON.stringify(polygon)],
                                (polygonErr) => {
                                    if (polygonErr) {
                                        console.error("Failed saving polygon", polygonErr);
                                    }
                                }
                            );
                        });
                    }

                    // Respond with success after creating the job and its default folder
                    res.status(200).json({
                        success: true,
                        jobId,
                        message: 'Job and default Images folder created successfully',
                    });
                }
            );
        }
    );
}

export const getJobDetail = (req: Request, res: Response) => {
    const { id } = req.params;
    db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, job) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to fetch job details' });
        }

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Return the fetched job details
        res.status(200).json({ success: true, job });
    });
}

export const getJobList = (req: Request, res: Response) => { 
    const userId = req.query.userId;

    db.all(
        'SELECT * FROM jobs WHERE user_id = ?',
        [userId],
        (err, jobs) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
            }

            res.status(200).json({ success: true, jobs });
        }
    );
}

export const getFoldersByJobId = (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`Fetching folders for job ID: ${id}`); // Log job ID

    db.all('SELECT * FROM folders WHERE job_id = ?', [id], (err, folders) => {
        if (err) {
            console.error('Database error:', err); // Log database errors
            return res.status(500).json({ success: false, message: 'Database error occurred' });
        }

        if (!folders || folders.length === 0) {
            console.warn(`No folders found for job ID: ${id}`); // Log warning for missing folders
            return res.status(404).json({ success: false, message: 'No folders found for this job' });
        }

        console.log(`Folders found for job ID: ${id}`, folders); // Log found folders
        res.status(200).json({ success: true, folders });
    });
}

export const createFolderByJobId = async (req: Request, res: Response) => {
    const { jobId } = req.params; // Get jobId from the URL
    const { name } = req.body;   // Get folder name from the request body

    if (!name || !jobId) {
        res
            .status(400)
            .json({ success: false, message: 'Invalid folder name or job ID' });
    }

    // Insert the new folder into the folders table
    db.run(
        `INSERT INTO folders (job_id, name) VALUES (?, ?)`,
        [jobId, name],
        function (err) {
            if (err) {
                console.error('Failed to create folder:', err);
                return res
                    .status(500)
                    .json({ success: false, message: 'Failed to create folder' });
            }

            const folderId = this.lastID; // Get auto-incremented ID of the new folder
            return res.status(201).json({
                success: true,
                folder: { id: folderId, jobId: Number(jobId), name }
            });
        }
    );
}

export const getFilesByJobIdAndFolderId = (req: Request, res: Response) => {
    const { jobId, folderId } = req.params;

    console.log(`Fetching files for folder ${folderId} in job ${jobId}`);

    // Assuming you have a `files` table that contains `folder_id`, `job_id`, and `name`
    db.all('SELECT * FROM files WHERE job_id = ? AND folder_id = ?', [jobId, folderId], (err, files) => {
        if (err) {
            console.error('Database error fetching files:', err);
            return res.status(500).json({ success: false, message: 'Database error occurred' });
        }

        if (!files || files.length === 0) {
            console.warn(`No files found for folder ${folderId} in job ${jobId}`);
            return res.status(404).json({ success: false, message: 'No files found for this folder' });
        }

        console.log(`Files found for folder ${folderId}:`, files);
        res.status(200).json({ success: true, files });
    });
}

export const uploadFiles = (req: Request, res: Response) => {
    const { jobId, folderId } = req.params;

    const uploadDir = path.join(__dirname, '../../uploads');
    const form = new formidable.IncomingForm({uploadDir: uploadDir, keepExtensions: true});

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing the files:', err);
            return res.status(500).json({ success: false, message: 'File upload error' });
        }

        if (!jobId || !folderId) {
            return res.status(400).json({ success: false, message: 'Invalid job ID or folder ID' });
        }

        const fileEntries = Object.values(files);

        fileEntries.forEach((file: any) => {
            const oldPath = file.path;
            const newPath = path.join(uploadDir, file.name);

            fs.rename(oldPath, newPath, (renameErr) => {
                if (renameErr) {
                    console.error('Error moving the file:', renameErr);
                    return res.status(500).json({ success: false, message: 'File move error' });
                }

                // Insert file record into the database
                db.run(
                    `INSERT INTO files (job_id, folder_id, name, path) VALUES (?, ?, ?, ?)`,
                    [jobId, folderId, file.name, newPath],
                    (dbErr) => {
                        if (dbErr) {
                            console.error('Error saving file record:', dbErr);
                            return res.status(500).json({ success: false, message: 'Database error' });
                        }
                    }
                );
            });
        });

        res.status(200).json({ success: true, message: 'Files uploaded successfully' });
    });
};