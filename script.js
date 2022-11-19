window.addEventListener("load", main);

var indicators;
var countries;
var lifeExpectancies, population, GDP;

async function main() 
{
    await fetchData();
    populateSelect();
    await getJSONData();
}

var jsondata;
async function fetchData()
{
    jsondata = await fetch("./media/eurostat.json")
        .then((response) => response.json())
        .then((data) => { return data; });
}

async function populateSelect()
{
    var indicatorSelect = document.getElementById("indicator-dropdown");

    indicators = new Set(jsondata?.map(i => i.indicator));
    for(const indicator of indicators)
    {
        var option = document.createElement("option");
        option.text = indicator;
        option.value = indicator;
        indicatorSelect.add(option);
    }

    var countrySelect = document.getElementById("country-dropdown");

    countries = new Set(jsondata?.map(c => c.tara));
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
        linkLifeExpectancy = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1&sinceTimePeriod=2006";
        linkPopulation = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?sex=T&age=TOTAL&sinceTimePeriod=2006";
        linkGDP = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB&sinceTimePeriod=2006";
        linkLifeExpectancy += "&geo=" + country + "?format=JSON";
        linkPopulation += "&geo=" + country + "?format=JSON";
        linkGDP += "&geo=" + country + "?format=JSON";
        lifeExpectancies = await fetch(linkLifeExpectancy)
        .then((response) => response.json())
        .then((data) => { return data });
        population = await fetch(linkPopulation)
        .then((response) => response.json())
        .then((data) => { return data });
        GDP = await fetch(linkGDP)
        .then((response) => response.json())
        .then((data) => { return data });
    }
}

function showEvolutionGraphic()
{
    
}