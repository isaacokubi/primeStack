import {Router} from 'express';import {CaseStudy} from '../models/Content.js';import {mountContent} from './content.routes.js';const r=Router();mountContent(r,CaseStudy);export default r;
