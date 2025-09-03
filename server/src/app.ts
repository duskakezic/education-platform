import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { AuthController } from './WebAPI/controllers/AuthController';
import { CoursesController } from './WebAPI/controllers/CoursesController';
import { AnnouncementsController } from './WebAPI/controllers/AnnouncementsController';
import { ReactionsCommentsController } from './WebAPI/controllers/ReactionsCommentsController';
import { MaterialsController } from './WebAPI/controllers/MaterialsController';

dotenv.config();

require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads to mirror FastAPI
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(process.cwd(), uploadDir)));
// Also serve legacy FastAPI upload location (existing files) if present
app.use('/uploads', express.static(path.resolve(process.cwd(), '../backend/uploads')));

// Routers mounted under /api to match FastAPI
const authController = new AuthController();
app.use('/api', authController.getRouter());
const coursesController = new CoursesController();
app.use('/api', coursesController.getRouter());
const announcementsController = new AnnouncementsController();
app.use('/api', announcementsController.getRouter());
const reactionsCommentsController = new ReactionsCommentsController();
app.use('/api', reactionsCommentsController.getRouter());
const materialsController = new MaterialsController();
app.use('/api', materialsController.getRouter());
// app.use('/api', newCoursesRouter);
// app.use('/api', newAnnouncementsRouter);
// app.use('/api', newMaterialsRouter);

export default app;