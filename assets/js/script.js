
var geoEncode = function(city) {
    // this function takes the 
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
    // will need a check to see  if the state is DC here later
    // url would be https://disease.sh/v3/covid-19/historical/usacounties/district%20of%20columbia?lastdays=7
    apiUrl = `https://disease.sh/v3/covid-19/historical/usacounties/${geoData.state.toLowerCase()}?lastdays=7`
    fetch(apiUrl)
    .then(function(response){
        if (response.ok) {
            response.json().then(function(stateCovidData){
                // the API fetch returns covid data for every county in the state, we need to fish out the 
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
                // we're just logging the info for now, later we'll set this up to display on the page
                console.log(`There have been ${newCases} new cases in the county of ${geoData.county} in the past week`)
                console.log(`There have been ${newDeaths} new deaths in the county of ${geoData.county} in past week`)
            })
        }
        else {
            // alert will be replaced with better feedback later
            alert("Search was not successful.")
        }
    });
}


