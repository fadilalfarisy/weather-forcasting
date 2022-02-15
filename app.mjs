import express from "express";
import https from "https";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import nodeGeoCoder from 'node-geocoder';
import path from "path"

const __dirname = path.resolve();

const app = express();

dotenv.config()

app.use(bodyParser.urlencoded({
  extended: true
}))

const geoCoder = nodeGeoCoder({
  provider: 'openstreetmap'
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + '\\views\\index.html')
});


app.post('/location', function (req, res) {
  const city = req.body.city || 'jakarta'

  geoCoder.geocode(city)
    .then(response => {
      const lat = response[0].latitude;
      const lon = response[0].longitude;

      const breakPoint = 'https://api.openweathermap.org/data/2.5/onecall?';
      const parameter = `lat=${lat}&lon=${lon}&exclude=daily,current,minutely,alerts&units=metric&lang=id&appid=`
      const apiID = process.env.API_ID
      const url = breakPoint + parameter + apiID;

      https.get(url, function (response) {
        response.on("data", function (chunk) {
          const value = JSON.parse(chunk);
          let forecast = []
          for (let index = 0; index < value.hourly.length - 1; index++) {
            forecast.push({
              time: getFormatDate(value.hourly[index].dt),
              weather: value.hourly[index].weather
            })
          }
          res.send(forecast)

        });
      })
        .on("error", function (err) {
          console.log("Error : " + err.message);
        });
    })
    .catch(err => {
      res.send('location unknown')
      console.log(err)
    })
})


app.listen(process.env.PORT || 3000, function () {
  console.log(`http://localhost:${process.env.PORT}`);
});

const getFormatDate = (dates) => {
  const format = new Date(dates * 1000)
  const date = format.toLocaleString([], { weekday: 'short' });
  const day = format.toLocaleString([], { day: '2-digit' });
  const month = format.toLocaleString([], { month: "short" });
  const year = format.toLocaleString([], { year: 'numeric' });
  const times = format.toLocaleString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (`${date}, ${day} ${month} ${year} ${times} GMT`)
  return formatDate
}