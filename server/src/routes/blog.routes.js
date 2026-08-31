import {Router} from 'express';import {BlogPost} from '../models/Content.js';import {mountContent} from './content.routes.js';const r=Router();mountContent(r,BlogPost);export default r;
