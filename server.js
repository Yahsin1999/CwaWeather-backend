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
// --- [原始程式碼行數 85-118 區塊的替換] ---

    // 取得時間序列，這是所有 weatherElement 共享的
    const timeElements = locationData.weatherElement[0].time;

    // 遍歷所有預報時段
    timeElements.forEach((timePeriod, i) => {
        const forecast = {};
        
        // 🌟 關鍵修正：將 startTime 和 endTime 加入 forecast 物件
        forecast.startTime = timePeriod.startTime; 
        forecast.endTime = timePeriod.endTime;
        
        // 遍歷所有天氣元素，並將其值加入 forecast 物件
        locationData.weatherElement.forEach((element) => {
            // 確保該元素在當前時間點 i 有資料
            if (element.time && element.time[i] && element.time[i].parameter) {
                const value = element.time[i].parameter;
                switch (element.elementName) {
                    case "Wx": // 天氣現象
                        forecast.weather = value.parameterName;
                        break;
                    case "PoP": // 降雨機率
                        forecast.rain = value.parameterName + "%";
                        break;
                    case "MinT": // 最低溫度
                        forecast.minTemp = value.parameterName;
                        break;
                    case "MaxT": // 最高溫度
                        forecast.maxTemp = value.parameterName;
                        break;
                    case "CI": // 舒適度
                        forecast.comfort = value.parameterName;
                        break;
                    case "WS": // 風速
                        forecast.windSpeed = value.parameterName;
                        break;
                }
            }
        });
        
        // 確保溫度單位 (前端需要純數字，我們在前端處理 °C)
        if (forecast.minTemp) forecast.minTemp = forecast.minTemp.replace("°C", "");
        if (forecast.maxTemp) forecast.maxTemp = forecast.maxTemp.replace("°C", "");
        
        weatherData.forecasts.push(forecast);
    });
// --- [替換結束] ---

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
