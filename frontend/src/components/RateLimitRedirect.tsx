import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { RATE_LIMIT_RETURN_KEY, TOO_MANY_REQUESTS_PATH } from "@/constants";
import { setRateLimitHandler } from "@/api";

export function RateLimitRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setRateLimitHandler(() => {
      if (location.pathname === TOO_MANY_REQUESTS_PATH) {
        return;
      }

      sessionStorage.setItem(RATE_LIMIT_RETURN_KEY, `${location.pathname}${location.search}${location.hash}`);
      navigate(TOO_MANY_REQUESTS_PATH, { replace: true });
    });

    return () => setRateLimitHandler(null);
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
