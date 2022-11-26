window.addEventListener("load", main);

var btn;
var indicatorSelect, countrySelect; 
var indicators;
var countries, countriesFullName;
var jsonText = "[";
var data;
var svg, bars, height, width;
var barExist = 1;
var title = document.createElementNS("http://www.w3.org/2000/svg", "title")
var currentValues = [];
document.addEventListener('DOMContentLoaded', getSVG);

async function main() 
{
    btn = document.getElementById("btnShowGraph");
    btn.disabled = true;
    await fetchData();
    populateSelect();
    await getJSONData();
    btn.disabled = false;
}

var jsondata;
async function fetchData()
{
    //get data from local json
    jsondata = await fetch("./media/eurostat.json")
        .then((response) => response.json())
        .then((data) => { return data; });
    countriesFullName = await fetch("./media/countries.json")
        .then((response) => response.json())
        .then((data) => { return data; });
}

async function populateSelect()
{
    indicatorSelect = document.getElementById("indicator-dropdown");

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

    countrySelect = document.getElementById("country-dropdown");

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
            yearFormat = '"an": ' + '"' + year + '"' + ',';
            //life expectancy
            jsonText += countryFormat + 
                    yearFormat +
                    '"indicator": ' + '"' + 'SV'  + '"' + ',' +
                    '"valoare": ' + lifeExpectancy.value[year - 2006] + "},";
            
            //population
            jsonText += countryFormat + yearFormat +
                '"indicator": ' + '"' + 'POP'  + '"' + ',' +
                '"valoare": ' + population.value[year - 2006] + "},";

            //gdp

            jsonText += countryFormat + yearFormat +
                '"indicator": ' + '"' + 'PIB'  + '"' + ',' +
                '"valoare": ' + GDP.value[year - 2006] + "},";
        }
    }

    //remove last ,
    jsonText = jsonText.slice(0, jsonText.length - 1);
    jsonText += "]";

    //convert to json object
    data = JSON.parse(jsonText);
}

function getSVG()
{
    //get svg and bars of the histogram
    svg = document.getElementById("svg");
    bars = document.getElementById("bars");
    
    //get svg dimensions
    var dimensions = svg.getBoundingClientRect();
    height = dimensions.height - 2;
    width = dimensions.width - 2;
    console.log(height);
    console.log(width);
}

function showEvolutionGraphic()
{
    //get indicators from selector
    var indicator = indicatorSelect.options[indicatorSelect.selectedIndex].text;
    var country = countrySelect.options[countrySelect.selectedIndex].text;
    
    //get higher and lowest value
    var max = Math.max(...data.filter(v => v.tara == country &&
                        v.indicator == indicator)
                    .map(v => v.valoare));
    var min = Math.min(...data.filter(v => v.tara == country &&
                        v.indicator == indicator)
                    .map(v => v.valoare));
    max -= min;
    max *= 1.3;
    var threshold = 0.1 * max;

    var values = [];

    //get data for selected indicators
    for(year = 2006; year < 2021; year++)
    {
        var value = data.filter(v => v.tara == country &&
                                    v.indicator == indicator &&
                                    v.an == year.toString())
                                .map(v => v.valoare)[0];
        values.push(value);
    }

    var barX = 5;
    var barWidth = (width - 16 * 5) / 15; 

    //create bars for histogram
    if(barExist == 1)
    {
        for(year = 2006, i = 0; year < 2021 && i < values.length; year++, i++)
        {
            //get value for bar height
            var barHeight = (values[i] - min + threshold) / max * height;

            var bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bar.setAttributeNS(null, "id", year);
            bar.setAttributeNS(null, "x", barX);
            bar.setAttributeNS(null, "y", height - barHeight);
            bar.setAttributeNS(null, "width", barWidth);
            bar.setAttributeNS(null, "height", barHeight);
            bar.setAttributeNS(null, "fill", "#F1D3B3");
            bars.append(bar);

            //add event for mouseover and mouseout
            bar.addEventListener("mouseover", showTooltip);
            bar.addEventListener("mouseout", revertChanges);

            barX += barWidth + 5; 
        }
        barExist = 0;
    }
    else
    {
        for(year = 2006, i = 0; year < 2021 && i < values.length; year++, i++)
        {
            var barHeight = (values[i] - min + threshold) / max * height;

            //var id = '"' + year + '"';
            var bar = document.getElementById(year);
            bar.setAttributeNS(null, "id", year);
            bar.setAttributeNS(null, "x", barX);
            bar.setAttributeNS(null, "y", height - barHeight);
            bar.setAttributeNS(null, "width", barWidth);
            bar.setAttributeNS(null, "height", barHeight);
            bars.append(bar);

            barX += barWidth + 5; 
        }
    }

    //add legend
    //var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    var text = document.getElementById("text");
    text.textContent = "Graficul ";
    if(indicator == "SV")
    {
        text.textContent += "sperantei la viata ";
    }
    else if(indicator == "POP")
    {
        text.textContent += "populatiei ";
    }
    else
    {
        text.textContent += "PIB-ului ";
    }
    text.textContent += "al tarii " 
                    + (countriesFullName.filter(c => c.tara == country))[0].nume
                    + " pe perioada 2006-2020";
    text.setAttributeNS(null, "x", width / 4);

    //save current values locally
    currentValues = values;
}

function showTooltip()
{
    //set new color
    this.setAttributeNS(null, "fill", "#C7BCA1");

    //tooltip
    var text = "Anul: " + this.id + "\n" + "Valoare: " + currentValues[this.id - 2006];
    title.textContent = text;
    this.appendChild(title);
}

function revertChanges()
{
    //revert to initial color
    this.setAttributeNS(null, "fill", "#F1D3B3");
}