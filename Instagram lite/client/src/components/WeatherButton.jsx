import { useEffect, useRef, useState } from "react";
import { getWeather } from "../api/weather";

export default function WeatherButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadWeather() {
    setIsLoading(true);
    setError("");

    try {
      setWeather(await getWeather());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load weather");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleOpen() {
    if (!isOpen) {
      loadWeather();
    }

    setIsOpen((prev) => !prev);
  }

  return (
    <div className="weather-widget" ref={containerRef}>
      <button
        className="weather-button"
        onClick={toggleOpen}
        aria-label="Weather"
        title="Weather in Bengaluru"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>

      {isOpen && (
        <div className="weather-dropdown">
          <h4>Weather</h4>

          {isLoading && <p className="muted weather-message">Loading weather...</p>}

          {error && <p className="error-text weather-message">{error}</p>}

          {!isLoading && !error && weather && (
            <div className="weather-details">
              <div className="weather-main">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width="64"
                  height="64"
                />
                <div>
                  <div className="weather-temp">{Math.round(weather.temperature)}°C</div>
                  <div className="weather-description">{weather.description}</div>
                </div>
              </div>

              <div className="weather-city">
                {weather.city}, {weather.country}
              </div>

              <ul className="weather-stats">
                <li>Feels like <strong>{Math.round(weather.feelsLike)}°C</strong></li>
                <li>Humidity <strong>{weather.humidity}%</strong></li>
                <li>Wind <strong>{weather.windSpeed} m/s</strong></li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
