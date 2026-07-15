import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import activityRouter from "./activity";
import quizzesRouter from "./quizzes";
import flashcardsRouter from "./flashcards";
import studyPlansRouter from "./studyPlans";
import pdfsRouter from "./pdfs";
import tutorRouter from "./tutor";
import notesRouter from "./notes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(activityRouter);
router.use(quizzesRouter);
router.use(flashcardsRouter);
router.use(studyPlansRouter);
router.use(pdfsRouter);
router.use(tutorRouter);
router.use(notesRouter);

export default router;
