import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const useFetchDetails = (card, type) => {
  console.log("card = ", card);

  const { user } = useAuth();
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // Trailer is NOT fetched automatically
  const [trailerId, setTrailerId] = useState(null);

  const [isWatched, setIsWatched] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [cast, setCast] = useState([]);
  const [recommendation, setRecommendation] = useState([]);
  const [numberOfSeasons, setNumberOfSeasons] = useState(null);
  const [seasonsArr, setSeasonsArr] = useState([]);

  // Loading is only for trailer requests
  const [loading, setLoading] = useState(false);

  const [providers, setProviders] = useState([]);

  // ----------------------------------------
  // Fetch user status
  // ----------------------------------------
  const fetchStatus = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/status`, {
        params: {
          movieID: card.id,
          userEmail: user.email,
        },
      });

      setIsWatched(response.data.isWatched);
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.log("Error getting status");
    }
  };

  // ----------------------------------------
  // Fetch providers
  // ----------------------------------------
  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/details/providers`, {
        params: {
          id: card.id,
          dataType: card.type || (card.release_date ? "movie" : "show"),
        },
      });

      setProviders(response.data);
    } catch (error) {
      setProviders([]);
    }
  };

  // ----------------------------------------
  // Fetch cast
  // ----------------------------------------
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

  // ----------------------------------------
  // Fetch recommendations
  // ----------------------------------------
  const fetchRecommendation = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/details/recommendation`,
        {
          params: {
            id: card.id,
            dataType: card.type || (card.release_date ? "movie" : "show"),
          },
        },
      );

      const tempArr = response.data.filter(
        (movie) => movie.original_language === card.original_language,
      );

      setRecommendation(tempArr);
    } catch (error) {
      setRecommendation([]);
    }
  };

  // ----------------------------------------
  // Fetch trailer
  //
  // IMPORTANT:
  // This function is NOT called automatically.
  //
  // It only runs when the user clicks
  // "Watch Trailer".
  // ----------------------------------------
  const fetchTrailer = async (seasonNumber = null) => {
    try {
      setLoading(true);

      const isMovie = card.release_date && !card.first_air_date;

      const response = await axios.get(`${BACKEND_URL}/api/details/trailer`, {
        params: {
          movieID: card.id,
          title: card.original_title || card.original_name,

          type: isMovie ? "movie" : "show",

          language: card.original_language,

          seasonNumber: seasonNumber,
          date: card.release_date || card.first_credit_air_date,
        },
      });

      console.log("Trailer response:", response.data);

      // ----------------------------------------
      // No trailer found
      // ----------------------------------------
      if (!response.data || !response.data.key) {
        setTrailerId(null);
        return null;
      }

      // Trailer exists
      setTrailerId(response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching trailer:", error);

      setTrailerId(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // Fetch TV details
  // ----------------------------------------
  const fetchTvDetails = async () => {
    if (card.type !== "show" && !card.first_air_date) {
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/details/tv`, {
        params: {
          tvID: card.id,
        },
      });

      if (response.data.numberOfSeasons !== 0) {
        setNumberOfSeasons(response.data.numberOfSeasons);

        setSeasonsArr(response.data.seasonsArr);
      }
    } catch (error) {
      console.log("Error getting TV details");
    }
  };

  // ----------------------------------------
  // Fetch details when card changes
  //
  // NOTICE:
  // fetchTrailer() is NOT here.
  // ----------------------------------------
  useEffect(() => {
    if (type === "watch-later") {
      setIsSaved(true);
    } else if (type === "watched") {
      setIsWatched(true);
    } else {
      fetchStatus();
    }

    fetchTvDetails();
    fetchCast();
    fetchRecommendation();
    fetchProviders();

    // Reset trailer when card changes
    setTrailerId(null);
    setLoading(false);
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
    recommendation,
    providers,
  };
};

export default useFetchDetails;
