import {Router} from 'express';import {Job} from '../models/Content.js';import {mountContent} from './content.routes.js';const r=Router();mountContent(r,Job);export default r;
