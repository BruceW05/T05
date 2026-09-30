// loaded.js — one place to change which data each chart loads.
// Edit the file paths or column names here; the chart files read everything from DATA.
// Must be loaded in index.html BEFORE the chart files.

const DATA = {

  // Donut chart — average energy use by screen technology, all sizes
  donut: {
    file: "data/Ex5_TV_energy_Allsizes_byScreenType.csv",
    columns: {
      tech:  "Screen_Tech",
      value: "Mean(Labelled energy consumption (kWh/year))"
    }
  },

  // Bar chart — average energy use by screen technology, 55-inch TVs only
  bar: {
    file: "data/Ex5_TV_energy_55inchtv_byScreenType.csv",
    columns: {
      tech:  "Screen_Tech",
      value: "Mean(Labelled energy consumption (kWh/year))"
    }
  },

  // Scatter plot — energy use vs star rating
  scatter: {
    file: "data/Ex5_TV_energy.csv",
    columns: {
      brand:  "brand",
      tech:   "screen_tech",
      size:   "screensize",
      energy: "energy_consumpt",
      stars:  "star2",
      count:  "count"
    }
  },

  // Line chart — spot electricity prices by year
  line: {
    file: "data/Ex5_ARE_Spot_Prices.csv",
    columns: {
      year:    "Year",
      average: "Average Price (notTas-Snowy)"
    },
    // One entry per grey region line: CSV column, full name, short button label
    regions: [
      { column: "Queensland ($ per megawatt hour)",      name: "Queensland",      short: "QLD" },
      { column: "New South Wales ($ per megawatt hour)", name: "New South Wales", short: "NSW" },
      { column: "Victoria ($ per megawatt hour)",        name: "Victoria",        short: "VIC" },
      { column: "South Australia ($ per megawatt hour)", name: "South Australia", short: "SA"  },
      { column: "Tasmania ($ per megawatt hour)",        name: "Tasmania",        short: "TAS" }
    ]
  }
};