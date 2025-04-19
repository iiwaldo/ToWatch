import express from "express";
import axios from "axios";
import dotenv from "dotenv"; // Import dotenv
import detailController from "../controllers/detailController.js";
dotenv.config();

const router = express.Router();

router.get("/popular", detailController.getPopularMovies);
router.get("/search/movie", detailController.getSearchedMovie);
router.get("/search/tv", detailController.getSearchedTv);
router.get("/trailer", detailController.getTrailer);
router.get("/movie-genres", detailController.getMovieGenres);
router.get("/tv-genres", detailController.getTvGenres);
router.get("/filter", detailController.getFilter);
router.get("/cast", detailController.getCast);
router.get("/combined_credits", detailController.getCombinedCredits);
router.get("/tv", detailController.getTvDetails);
router.get("/recommendation", detailController.getRecommendation);
export default router;
