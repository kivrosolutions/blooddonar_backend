export class UploadsService {
  getFileInfo(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
  }
}
