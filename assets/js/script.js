var fetchGeoData = function(city) {
    // this function fetches geographic information based on what city the user searched for
    apiUrl = `https://us1.locationiq.com/v1/search.php?key=d743f42fb07378&city=${city}&format=json&countrycodes=us&limit=1&addressdetails=1`;
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(data){
                console.log(data)
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
                    console.log("No covid information was found")
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
                console.log(weatherData)
                var current = weatherData.current
                var forecast = weatherData.daily.slice(1)
                var rain = false
                var snow = false
                var highTemp = null
                var lowTemp = null
                forecast.forEach(x => {
                    if (x.rain) {
                        rain = true
                    }
                    if (x.snow) {
                        snow = true
                    }
                    if (x.temp.max > 85) {
                        highTemp = "high"
                    }
                    if (x.temp.max > 99) {
                        highTemp = "very high"
                    }
                    if (x.day < 35) {
                        lowTemp = "low"
                    }
                    if (x.day < 1) {
                        lowTemp = "very low"
                    }
                });
                console.log("Rain:"+rain+", Snow:"+snow+", HighTemp:"+highTemp+", LowTemp:"+lowTemp)
                $("#weather-results").html(`
                <p>
                    Current Temperature: ${current.temp} °F
                    <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}.png" alt="">
                </p>
                <p> Current Windspeed: ${current.wind_speed} MPH </p>
                <p> Current Humidity: ${current.humidity}%
                `)
            })
        }
        else {
            // alert will be replaced with better user feedback later
            alert("There was a problem fetching the weather data.")
        }
    });
};
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