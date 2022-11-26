window.addEventListener("load", main);

var btnHistogram, btnBubbleChart, btnAnimate;
var indicatorSelect, countrySelect; 
var indicators;
var countries, countriesFullName;
var jsonText = "[";
var data;
var svg, bars, height, width;
var barExist = 1;
var title = document.createElementNS("http://www.w3.org/2000/svg", "title")
var currentValues = [];
var canvas, context, widthC, heightC;
document.addEventListener('DOMContentLoaded', getSVGAndCanvas);

async function main() 
{
    btnHistogram = document.getElementById("btnShowGraph");
    btnBubbleChart = document.getElementById("btnBubbleChart");
    btnAnimate = document.getElementById("btnAnimate");
    btnHistogram.disabled = true;
    btnBubbleChart.disabled = true;
    btnAnimate.disabled = true;
    await fetchData();
    populateSelect();
    await getJSONData();
    btnHistogram.disabled = false;
    btnBubbleChart.disabled = false;
    btnAnimate.disabled = false;
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

    yearsSelect = document.getElementById("years-dropdown");

    //populate select
    for(year = 2006; year < 2021; year++)
    {
        var option = document.createElement("option");
        option.text = year;
        option.value = year;
        yearsSelect.add(option);
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

function getSVGAndCanvas()
{
    //get svg and bars of the histogram
    svg = document.getElementById("svg");
    bars = document.getElementById("bars");
    
    //get svg dimensions
    var dimensions = svg.getBoundingClientRect();
    height = dimensions.height - 2;
    width = dimensions.width - 2;
    
    //get canvas and dimensions
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    widthC = canvas.clientWidth;
    heightC = canvas.clientHeight;
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
            bar.setAttributeNS(null, "fill", "#F0DBDB");
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
    this.setAttributeNS(null, "fill", "#DBA39A");

    //tooltip
    var text = "Anul: " + this.id + "\n" + "Valoare: " + currentValues[this.id - 2006];
    title.textContent = text;
    this.appendChild(title);
}

function revertChanges()
{
    //revert to initial color
    this.setAttributeNS(null, "fill", "#F0DBDB");
}

function showBubbleChart()
{
    //get selected year
    var year = yearsSelect.options[yearsSelect.selectedIndex].text;

    drawBubbles(year);
}

function drawBubbles(year)
{
    //clear canvas
    context.clearRect(0, 0, widthC, heightC);

    //get data for each indicator
    var lifeExpValues = data.filter(v => v.an == year.toString() && v.indicator == "SV");
    var POPValues = data.filter(v => v.an == year.toString() && v.indicator == "POP");
    var GDPValues = data.filter(v => v.an == year.toString() && v.indicator == "PIB");

    //get reference dimensions
    var lifeExpMin = Math.min(...lifeExpValues.map(v => v.valoare));
    var lifeExpMax = Math.max(...lifeExpValues.map(v => v.valoare));
    lifeExpMax -= lifeExpMin;
    var thresholdLE = 0.01 * lifeExpMin;
    lifeExpMax += 2 * thresholdLE;

    var POPMin = Math.min(...POPValues.map(v => v.valoare));
    var POPMax = Math.max(...POPValues.map(v => v.valoare));
    POPMax -= POPMin;
    var thresholdPOP = POPMin;
    POPMax += 2 * thresholdPOP;

    var GDPMin = Math.min(...GDPValues.map(v => v.valoare));
    var GDPMax = Math.max(...GDPValues.map(v => v.valoare));
    GDPMax -= GDPMin;
    var thresholdGDP = GDPMin;
    GDPMax += 2 * thresholdGDP;

    for(const country of countries)
    {
        //get dimensions for circle
        var lifeExpValue = lifeExpValues.filter(v => v.tara == country)[0].valoare;
        var x = (lifeExpValue - lifeExpMin + thresholdLE) / lifeExpMax * widthC;

        var GDPValue = GDPValues.filter(v => v.tara == country)[0].valoare;
        var y = heightC - (GDPValue - GDPMin + thresholdGDP) / GDPMax * heightC;
    
        var POPValue = POPValues.filter(v => v.tara == country)[0].valoare;
        var radMax = 50;
        var radius = (POPValue - POPMin + thresholdPOP) / POPMax * radMax;

        //random color
        var r = Math.floor(Math.random() * 256);
        var g = 100 + Math.floor(Math.random() * 256);
        var b = 50 + Math.floor(Math.random() * 256);
        var color = "rgb(" + r + "," + g + "," + b + ")";

        //draw circle
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
        context.stroke();
    }

    //title text
    context.beginPath();
    context.font = "30px Roboto";
    context.textAlign = "center";
    context.fillStyle = "black";
    context.fillText(year, widthC / 2, 30);

    context.beginPath();
    context.font = "10px Roboto";
    context.textAlign = "left";
    context.fillText("PIB", 5, 15);

    context.beginPath();
    context.textAlign = "right";
    context.fillText("SV", widthC - 5, heightC - 10);

    //draw axes in canvas
    context.beginPath();
    context.moveTo(10, 20);
    context.lineTo(10, heightC - 10);
    context.stroke();

    context.beginPath();
    context.moveTo(10, heightC - 10);
    context.lineTo(widthC - 20, heightC - 10);
    context.stroke();
}

function animateBubbleChart()
{
    //timeout start
    var timeout = 0;

    for(year = 2006; year < 2021; year++)
    {
        //increase timeout
        show(year, timeout);
        timeout += 2000;
    }
}

function show(year, timeout)
{
    setTimeout(drawBubbles, timeout, year);
}