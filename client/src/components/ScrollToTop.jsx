import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("window is running");
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth", // or 'auto'
    });
  }, [location.pathname,location.search]);
  return null;
};
export default ScrollToTop;
