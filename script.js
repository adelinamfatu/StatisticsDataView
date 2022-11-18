window.addEventListener("load", main);

async function main() 
{
    await fetchData();
    populateSelect();
}

var jsondata;
async function fetchData()
{
    await fetch("./media/eurostat.json")
        .then((response) => response.json())
        .then((data) => { jsondata = data });
}

async function populateSelect()
{
    var indicatorSelect = document.getElementById("indicator-dropdown");

    var indicators = new Set(jsondata?.map(i => i.indicator));
    for(const indicator of indicators)
    {
        var option = document.createElement("option");
        option.text = indicator;
        option.value = indicator;
        indicatorSelect.add(option);
    }

    var countrySelect = document.getElementById("country-dropdown");

    var countries = new Set(jsondata?.map(c => c.tara));
    for(const country of countries)
    {
        var option = document.createElement("option");
        option.text = country;
        option.value = country;
        countrySelect.add(option);
    }
}
