window.addEventListener("load", main);

var indicators;
var countries;
var jsonText = "[";
var data;

async function main() 
{
    await fetchData();
    populateSelect();
    await getJSONData();
}

var jsondata;
async function fetchData()
{
    //get data from local json
    jsondata = await fetch("./media/eurostat.json")
        .then((response) => response.json())
        .then((data) => { return data; });
}

async function populateSelect()
{
    var indicatorSelect = document.getElementById("indicator-dropdown");

    //get distinct indicators from json
    indicators = new Set(jsondata?.map(i => i.indicator));

    //populate select
    for(const indicator of indicators)
    {
        var option = document.createElement("option");
        option.text = indicator;
        option.value = indicator;
        indicatorSelect.add(option);
    }

    var countrySelect = document.getElementById("country-dropdown");

    //get distinct countries from json
    countries = new Set(jsondata?.map(c => c.tara));

    //populate select
    for(const country of countries)
    {
        var option = document.createElement("option");
        option.text = country;
        option.value = country;
        countrySelect.add(option);
    }
}

async function getJSONData()
{
    var linkLifeExpectancy, linkPopulation, linkGDP;
    for(const country of countries)
    {
        //url format
        linkLifeExpectancy = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1&sinceTimePeriod=2006";
        linkPopulation = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?sex=T&age=TOTAL&sinceTimePeriod=2006";
        linkGDP = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB&sinceTimePeriod=2006";
        linkLifeExpectancy += "&geo=" + country;
        linkPopulation += "&geo=" + country;
        linkGDP += "&geo=" + country;

        //get data from url for each country
        var lifeExpectancy = await fetch(linkLifeExpectancy)
        .then((response) => response.json())
        .then((data) => { return data });
        var population = await fetch(linkPopulation)
        .then((response) => response.json())
        .then((data) => { return data });
        var GDP = await fetch(linkGDP)
        .then((response) => response.json())
        .then((data) => { return data });

        //add data to json text
        countryFormat = '{"tara": ' + '"' + country + '"' + ',';

        for(year = 2006; year < 2021; year++)
        {
            jsonText += countryFormat + 
            '"an": ' + '"' + year + '"' + ',' +
            '"indicator": ' + '"' + 'SV'  + '"' + ',' +
            '"valoare": ' + lifeExpectancy.value[year - 2006] + "},";
        }
    }

    //remove last ,
    jsonText = jsonText.slice(0, jsonText.length - 1);
    jsonText += "]";

    //convert to json object
    data = JSON.parse(jsonText);
}

function showEvolutionGraphic()
{
    
}