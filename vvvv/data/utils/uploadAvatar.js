import multer from 'multer';

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpeg" ||
        file.mimetype.split("/")[1] === "png" ||
        file.mimetype.split("/")[1] === "jpg") {
      cb(null, true);
    }
    else {
      cb(new Error("Please use .jpeg .jpg or .png images extensions"), false);
    }
};

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'resources/profile_images');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `${req.user.id}.png`);
    }
});

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

export {upload};

