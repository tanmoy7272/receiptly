import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = (file.originalname || '').toLowerCase();

  const isImage = mime.startsWith('image/') || ext.match(/\.(jpg|jpeg|png|webp|heic|heif|bmp|tiff)$/i);
  const isPdf = mime.includes('pdf') || ext.endsWith('.pdf');
  const isDoc = mime.includes('word') || mime.includes('officedocument') || ext.match(/\.(doc|docx)$/i);

  if (isImage || isPdf || isDoc || mime === 'application/octet-stream') {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file format. Please upload a valid image, PDF, or Word document.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter,
});

export const uploadReceiptFile = upload.single('file');
