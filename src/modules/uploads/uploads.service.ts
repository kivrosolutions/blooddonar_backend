import imagekit from '../../config/imagekit';
import { ApiError } from '../../utils/ApiError';

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
  mimetype: string;
}

export class UploadsService {
  async uploadToImageKit(
    fileBuffer: Buffer,
    fileName: string,
    folder: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    const response = await imagekit.files.upload({
      file: dataUri,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    return {
      url: response.url || '',
      fileId: response.fileId || '',
      name: response.name || '',
      size: response.size || 0,
      mimetype: mimeType,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await imagekit.files.delete(fileId);
    } catch {
      throw ApiError.internal('Failed to delete file from ImageKit');
    }
  }

  async replaceFile(
    oldFileId: string | null,
    fileBuffer: Buffer,
    fileName: string,
    folder: string,
    mimeType: string,
  ): Promise<UploadResult> {
    if (oldFileId) {
      await this.deleteFile(oldFileId);
    }

    return this.uploadToImageKit(fileBuffer, fileName, folder, mimeType);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadToImageKit(file.buffer, file.originalname, folder, file.mimetype),
    );

    return Promise.all(uploadPromises);
  }

  getRegistrationFiles(req: Express.Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    return {
      profileImage: files?.profileImage?.[0] || null,
      cnicFront: files?.cnicFront?.[0] || null,
      cnicBack: files?.cnicBack?.[0] || null,
    };
  }
}
