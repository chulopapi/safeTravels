
var geoEncode = function(city) {
    apiUrl = `https://us1.locationiq.com/v1/search.php?key=d743f42fb07378&q=${city}&format=json&countrycodes=us&limit=1&addressdetails=1`;
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(data){
                fetchCovidData(data[0].address)
            })
        }
        else {
            // alert will be replaced with better feedback later
            alert("Search was not successful.")
        }
    });
};

var fetchCovidData = function(geoData) {
    apiUrl = `https://disease.sh/v3/covid-19/historical/usacounties/${geoData.state.toLowerCase()}?lastdays=7`
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(data){
                var covidData = data
            })
        }
        else {
            // alert will be replaced with better feedback later
            alert("Search was not successful.")
        }
    });
}


