require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 動態取得縣市天氣
const getWeather = async (req, res) => {
  const cityName = req.params.city;
  try {
    if (!CWA_API_KEY) {
      return res.status(500).json({
        error: "伺服器設定錯誤",
        message: "請在 .env 設定 CWA_API_KEY",
      });
    }

    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          locationName: cityName,
        },
      }
    );

    const locationData = response.data.records.location[0];

    if (!locationData) {
      return res.status(404).json({
        error: "查無資料",
        message: `無法取得 ${cityName} 天氣資料`,
      });
    }

    const weatherData = {
      city: locationData.locationName,
      updateTime: response.data.records.datasetDescription,
      forecasts: [],
    };

    locationData.weatherElement[0].time.forEach((_, i) => {
      const forecast = {};
      locationData.weatherElement.forEach((element) => {
        const value = element.time[i].parameter;
        switch (element.elementName) {
          case "Wx":
            forecast.weather = value.parameterName;
            break;
          case "PoP":
            forecast.rain = value.parameterName + "%";
            break;
          case "MinT":
            forecast.minTemp = value.parameterName + "°C";
            break;
          case "MaxT":
            forecast.maxTemp = value.parameterName + "°C";
            break;
          case "CI":
            forecast.comfort = value.parameterName;
            break;
          case "WS":
            forecast.windSpeed = value.parameterName;
            break;
        }
      });
      weatherData.forecasts.push(forecast);
    });

    res.json({ success: true, data: weatherData });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "取得天氣資料失敗",
      message: err.message,
    });
  }
};

// Routes
app.get("/weather", async (req, res) => {
    try {
        const city = req.query.city || "臺北市";
        const response = await axios.get(`${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}&locationName=${encodeURIComponent(city)}`);

        const record = response.data.records.location[0];
        const weatherElement = record.weatherElement;
        const weather = weatherElement[0].time[0].parameter.parameterName;
        const temp = weatherElement[2].time[0].parameter.parameterName;

        res.json({
            location: record.locationName,
            weather: weather,
            temperature: temp
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

app.get("/api/weather/:city", getWeather);

app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 CWA 天氣預報 API",
    endpoints: {
      weather: "/api/weather/:city",
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "找不到此路徑",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器運作中，PORT ${PORT}`);
  console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
});
