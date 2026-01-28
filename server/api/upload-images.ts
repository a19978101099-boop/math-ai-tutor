import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { randomBytes } from "crypto";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-images", upload.fields([
  { name: "problemImage", maxCount: 1 },
  { name: "solutionImage", maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const result: any = {};

    // Upload problem image
    if (files.problemImage && files.problemImage[0]) {
      const file = files.problemImage[0];
      const randomSuffix = randomBytes(8).toString("hex");
      const fileKey = `problems/problem-${Date.now()}-${randomSuffix}.${file.mimetype.split("/")[1]}`;
      
      const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
      result.problemImageUrl = url;
      result.problemImageKey = fileKey;
    }

    // Upload solution image
    if (files.solutionImage && files.solutionImage[0]) {
      const file = files.solutionImage[0];
      const randomSuffix = randomBytes(8).toString("hex");
      const fileKey = `problems/solution-${Date.now()}-${randomSuffix}.${file.mimetype.split("/")[1]}`;
      
      const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
      result.solutionImageUrl = url;
      result.solutionImageKey = fileKey;
    }

    res.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
