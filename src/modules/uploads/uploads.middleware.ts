import multer from 'multer';
import { ApiError } from '../../utils/ApiError';

const storage = multer.memoryStorage();

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
  }
};

const documentFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF are allowed.'));
  }
};

export const uploadRegistration = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 },
]);

export const uploadSingle = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single('file');

export const uploadSingleDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single('file');
