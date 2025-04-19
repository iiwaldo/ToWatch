import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
const useFetchDetails = (card, type) => {
  const { user } = useAuth();
  const [trailerId, setTrailerId] = useState(card.trailerId || null);
  const [isWatched, setIsWatched] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [cast, setCast] = useState([]);
  const [recommendation, setRecommendation] = useState([]);
  const [numberOfSeasons, setNumberOfSeasons] = useState(null);
  const [seasonsArr, setSeasonsArr] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const fetchStatus = async () => {
    if (!user) {
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/status`, {
        params: { movieID: card.id, userEmail: user.email },
      });
      setIsWatched(response.data.isWatched);
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.log("error getting status");
    }
  };
  const fetchCast = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/details/cast`, {
        params: {
          movieID: card.id,
          datatype: card.type || (card.release_date ? "movie" : "show"),
        },
      });
      setCast(response.data);
    } catch (error) {
      setCast([]);
    }
  };
  const fetchRecommendation = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/details/recommendation`,
        {
          params: {
            id: card.id,
            dataType: card.type || (card.release_date ? "movie" : "show"),
          },
        }
      );
      const tempArr = response.data.filter(movie => movie.original_language===card.original_language); 
      setRecommendation(tempArr);
    } catch (error) {
      setRecommendation([]);
    }
  };
  const fetchTrailer = async (
    original_title = card.original_title || card.original_name,
    release_date = card.release_date || card.first_air_date
  ) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/details/trailer`, {
        params: {
          original_title: original_title,
          original_language: card.original_language,
          release_date: release_date || null,
          type: card.release_date ? "movie" : "show",
        },
      });
      setTrailerId(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trailer", error);
    }
  };
  const fetchTvDetails = async () => {
    if (card.type !== "show" && !card.first_air_date) {
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/details/tv`, {
        params: { tvID: card.id },
      });
      if (response.data.numberOfSeasons !== 0) {
        setNumberOfSeasons(response.data.numberOfSeasons);
        setSeasonsArr(response.data.seasonsArr);
      }
    } catch (error) {
      console.log("Error gettings tv details");
    }
  };
  useEffect(() => {
    if (type === "watch-later") {
      setIsSaved(true);
    } else if (type === "watched") {
      setIsWatched(true);
    } else {
      fetchStatus();
    }
    fetchTvDetails();
    fetchTrailer();
    fetchCast();
    fetchRecommendation();
  }, [card]);

  return {
    trailerId,
    isWatched,
    setIsWatched,
    isSaved,
    setIsSaved,
    cast,
    numberOfSeasons,
    seasonsArr,
    loading,
    fetchTrailer,
    recommendation
  };
};

export default useFetchDetails;
