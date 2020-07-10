var fetchGeoData = function(city) {
    // this function fetches geographic information based on what city the user searched for
    apiUrl = `https://us1.locationiq.com/v1/search.php?key=d743f42fb07378&city=${city}&format=json&countrycodes=us&limit=1&addressdetails=1`;
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(data){
                var address = data[0].address
                // check if they searched for DC, adjust data if so
                if (address.state === "Washington, D.C.") {
                    address.state = "District of Columbia"
                    address.county = "District of Columbia"
                }
                // checks if city data is missing, if so checks for some other data types 
                // and uses those instead
                if (!address.city){
                    if (address.village) {
                        address.city = address.village
                    }
                    if (address.city_district) {
                        address.city = address.city_district
                    }
                }
                $("#city-holder").html(`<h6 class="light bold">${address.city }, ${address.state}</h6>`)
                fetchCovidData(address)
                fetchWeatherData(data[0].lat,data[0].lon)
                if (address.city){
                    saveSearch(address.city)
                }
            })
        }
        else {
            $("#city-holder").html(
                '<div class="valign-wrapper"> \
                <span class="badge center white-text red lighten-2">Search Failed</span> \
                </div>'
            )
            }
    });
};
var fetchCovidData = function(geoData) {
    apiUrl = `https://disease.sh/v3/covid-19/historical/usacounties/${geoData.state.toLowerCase()}?lastdays=7`
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(stateCovidData){
                // the API fetch returns covid data for every county in a state, we need to fish out the 
                // specific county for the city that the user searched for
                var countyCovidData = null
                for(i=0;i<stateCovidData.length;i++) {
                    // we loop through the counties in the covid search results and use a regular expression to 
                    // compare the counties from the covid search results and the geodata we got from the first API call
                    var currentCounty = RegExp(stateCovidData[i].county,'i')
                    if (currentCounty.test(geoData.county)) {
                        countyCovidData = stateCovidData[i]
                        break
                    }
                }
                if(!countyCovidData) {
                    $("#covid-results").html(`
                    <p class="center"> No COVID data found. </p>
                    `)
                    return
                }
                // This section parses the data from the covid results into more useful numbers
                var cases = Object.values(countyCovidData.timeline.cases)
                var deaths = Object.values(countyCovidData.timeline.deaths)
                var newCases = Math.max(...cases) - Math.min(...cases)
                var newDeaths = Math.max(...deaths) - Math.min(...deaths)
                // Display the results onto the page
                $("#covid-results").html(
                    `
                    <h6 class="center"> Showing results for <span class ="bold">${geoData.county}</span></h6>
                    <p class="center">In the last week, there have been ${newCases} new cases and ${newDeaths} new deaths 
                    related to COVID-19</p>
                    `
                )
            })
        }
        else {
            $("#covid-results").html(
                '<div class="valign-wrapper"> \
                <span class="badge center white-text red lighten-2">Unable to fetch covid data.</span> \
                </div>'
            )
        }
    });
};
var fetchWeatherData = function(lat,lon) {
    // takes the latitude and longitude from the geo encoding call and uses them to fetch weather data
    apiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=imperial&appid=d1cd3159572faa76d674791448dcb10b`;
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(weatherData){
                var current = weatherData.current
                var forecast = weatherData.daily.slice(1)
                results = $("#weather-results")
                results.html(`
                <p>
                    Current Temperature: ${current.temp} °F
                    <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}.png" alt="">
                </p>
                <p> Current Windspeed: ${current.wind_speed} MPH </p>
                <p> Current Humidity: ${current.humidity}% </p>
                `)
                parsedForecast = parseForecastData(forecast)
                if (parsedForecast.rain) {
                    results.append("<p>Rain is forecast in the next week.</p>")
                }
                if (parsedForecast.snow) {
                    results.append("<p>Snow is forecast in the next week.</p>")
                }
                if (parsedForecast.highTemp) {
                    results.append(`<p>Temperatures as high as ${parsedForecast.highTemp} °F are expected in the next week.</p>`)
                }
                if (parsedForecast.lowTemp) {
                    results.append(`<p>Temperatures as low as ${parsedForecast.lowTemp} °F are expected in the next week.</p>`)
                }
                if (!parsedForecast.rain && !parsedForecast.snow && !parsedForecast.highTemp && !parsedForecast.lowTemp) {
                    results.append("<p>No adverse weather conditions are forecast for the next week.</p>")
                }
            })
        }
        else {
            // alert will be replaced with better user feedback later
            alert("There was a problem fetching the weather data.")
        }
    });
};
var parseForecastData = function(forecast) {
    var forecastData = {
        rain: false,
        snow: false,
        highTemp: [],
        lowTemp: []
    }
    forecast.forEach(x => {
        if (x.rain) {
            forecastData.rain = true
        }
        if (x.snow) {
            snow = true
        }
        if (x.temp.max >= 85) {
            forecastData.highTemp.push(x.temp.max)
        }
        if (x.temp.day <= 35) {
            forecastData.lowTemp.push(x.temp.day)
        }
    });
    if (forecastData.highTemp[0]) {
        forecastData.highTemp = Math.max(...forecastData.highTemp)
    }
    else {
        forecastData.highTemp = null
    }
    if (forecastData.lowTemp[0]) {
        forecastData.lowTemp = Math.min(...forecastData.lowTemp)
    }
    else {
        forecastData.lowTemp = null
    }
    return forecastData
}
var saveSearch = function(city) {
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"))
    if (!searchHistory) {
        searchHistory = []
    }
    if (searchHistory.includes(city)) {
        return
    }
    searchHistory.unshift(city)
    searchHistory = searchHistory.slice(0,10)
    localStorage.setItem("searchHistory",JSON.stringify(searchHistory))
    drawSearchHistory()
}
var drawSearchHistory = function() {
    var searchHistory = JSON.parse(localStorage.getItem("searchHistory"))
    var targetList = $("#previous-searches")
    targetList.empty()
    if (!searchHistory) {
        targetList.append(`<li><a  class="grey-text center" href="#!">None</a></li>`)
        return
    }
    searchHistory.forEach(city => {
        targetList.append(`<li><a  class="light-blue-text center" href="#!">${city}</a></li>`)
    });
}
var cityInputHandler = function(event) {
    event.preventDefault()
    var searchField = $("#city-input")
    if (searchField.val()){
        fetchGeoData(searchField.val().trim())
        searchField.val("")
        searchField.blur()
    }
}
$("#city-form").on("submit",cityInputHandler)
$('.dropdown-trigger').dropdown();
drawSearchHistory()