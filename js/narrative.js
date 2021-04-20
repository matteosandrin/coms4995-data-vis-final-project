var barmargin = { top: 30, right: 30, bottom: 70, left: 60 },
  barwidth = 460 - barmargin.left - barmargin.right,
  barheight = 400 - barmargin.top - barmargin.bottom;

const bar_chart_height = 400;
const bar_chart_width = 500;
var barsvg = d3
  .select("#bar-svg")
  .attr("viewBox", [0, 0, bar_chart_width, bar_chart_height])
  .append("g")
  .attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")");

var y = d3.scaleLinear().domain([0, 0.5]).range([barheight, 0]);
d3.csv("data/ages.csv").then(function (data) {
  //X axis
  var x = d3
    .scaleBand()
    .range([0, barwidth])
    .domain(
      data.map(function (d) {
        return d.age;
      })
    )
    .padding(0.2);
  barsvg
    .append("g")
    .attr("transform", "translate(0," + barheight + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10, 0)rotate(-45)")
    .style("text-anchor", "end");

  // text label for the x axis
  barsvg
    .append("text")
    .attr(
      "transform",
      "translate(" +
        barwidth / 2 +
        " ," +
        (barheight + barmargin.top + 20) +
        ")"
    )
    .style("text-anchor", "middle")
    .style("fill", "white")
    .text("Ages");

  var formatPercent = d3.format(".0%");

  //y axis
  barsvg.append("g").call(d3.axisLeft(y).tickFormat(formatPercent));

  // text label for the y axis
  barsvg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - barmargin.left)
    .attr("x", 0 - barheight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Percentage")
    .style("fill", "white");
    
  //bars
  barsvg
    .append('g')
    .selectAll("bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return x(d.age);
    })
    .attr("y", function (d) {
      return y(d.percentage);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      return barheight - y(d.percentage);
    })
    .attr("fill", "#beff00");

  //bars to hover
  barsvg
    .append('g')
    .selectAll("bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return x(d.age);
    })
    .attr("y", function (d) {
      return y(.5);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      return barheight;
    })
    .attr("opacity", 0)
    .on("mouseover", function(event, selectedData) {
      mouseOverBarChart(this, selectedData)
    })
    .on("mouseout", function(event, selectedData) {
      mouseOutBarChart(this, selectedData);
    });
});

function mouseOutBarChart(t, selectedDate) {
  d3.select("#bartooltip").remove();
}

function mouseOverBarChart(t, selectedData) {
  //console.log(selectedData);
  //console.log(t);

  var ttbar = d3.select("#bar-svg")
      .append("g")
      .attr("id", "bartooltip");
  
  var formatPercent = d3.format(".0%");

  ttbar.append("text")
  .attr("x", 5)
  .attr("y", 20)
  .attr("text-anchor", "left")
  .attr("font-family", "sans-serif")
  .attr("font-size", "20")
  .attr("font-weight", "bold")
  .attr("fill", "black")
  .text(formatPercent(selectedData.percentage));
  
  ttbar.append("text")
  .attr("x", 5)
  .attr("y", 40)
  .attr("text-anchor", "left")
  .attr("font-family", "sans-serif")
  .attr("font-size", "16")
  .attr("font-style", "italic")
  .attr("fill", "black")
  .text(selectedData.age);

  ttbar.append("rect")
  .attr("width", function(d) {
      text_width = this.parentNode.getBBox().width;
      return this.parentNode.getBBox().width + 10;
  })
  .attr("height", "45")
  .attr("fill", "white")
  .attr("stroke", "black")
  .attr("stroke-width", 1)
  .lower();

  const curr_x = parseFloat(d3.select(t).attr("x"));
  const x_offset = 90;
  const xpos = curr_x + x_offset;

  const curr_y = y(selectedData.percentage);
  const y_offset = -20;
  const ypos = curr_y + y_offset;

  ttbar.attr("transform", `translate(${xpos}, ${ypos})`);
}


function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var data1 = {};
var data2 = {};
d3.csv("data/top_10_subs.csv").then(function (data) {
  var columns = ["Rank*", "Streamer", "Subscribers"];
  var dataArray = data.map((d) => [d.Rank, d.Name, d.Subscriber_Count]);
  tabulate(dataArray, columns);
});

var tabulate = function (data, columns) {
  var table = d3
    .select("#table-container")
    .append("table")
    .attr("class", "table");
  var thead = table.append("thead");
  var tbody = table.append("tbody");

  thead
    .append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function (d) {
      return d;
    });

  var rows = tbody.selectAll("tr").data(data).enter().append("tr");

  var cells = rows
    .selectAll("td")
    .data(function (row) {
      return row;
    })
    .enter()
    .append("td")
    .text(function (d) {
      return numberWithCommas(d);
    });

  return table;
};

d3.csv("data/gender.csv").then(function (data) {
  data1 = { female: data[0].Female, male: data[0].Male };
  data2 = { female: data[1].Female, male: data[1].Male };

  updateGenderPieChart(data2);
});

var width = 555;
var height = 450;
var pie_margin = 40;

var radius = Math.min(width, height) / 2 - pie_margin;

var arc = d3
  .arc()
  .outerRadius(radius * 1.0)
  .innerRadius(radius * 0.0);

var svg = d3
  .select("#pie-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var color = d3
  .scaleOrdinal()
  .domain(["female", "male"])
  .range([d3.rgb("#bfabFF"), d3.rgb("#57bee6")]);

function updateGenderPieChart(data) {
  if (data == data2)
  {
    $("#viewersbutt").removeClass('button-selected');
    $("#top100butt").addClass('button-selected');
  } else {
    $("#top100butt").removeClass('button-selected');
    $("#viewersbutt").addClass('button-selected');
  }
  

  var arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

  var pie = d3
    .pie()
    .value(function (d) {
      return d[1];
    })
    .sort(function (a, b) {
      return d3.ascending(a.key, b.key);
    });

  var data_ready = pie(Object.entries(data));

  var u = svg.selectAll("path").data(data_ready);

  u.enter()
    .append("path")
    .merge(u)
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      var interpolate = d3.interpolate(this._current, d);
      var _this = this;
      return function (t) {
        _this._current = interpolate(t);
        return arc(_this._current);
      };
    })
    .attr("fill", function (d) {
      return color(d.data[0]);
    })
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 1);

  u.enter()
    .data(data_ready)
    .append("text")
    .text(function (d) {
      return d.data[0];
    })
    .style("text-anchor", "middle")
    .style("font-size", 17);

  svg.selectAll('text')
    .data(data_ready)
    .join('text')
    .transition()
    .duration(1000)
    .attr("transform", function (d) {
      return "translate(" + arcGenerator.centroid(d) + ")";
    });

  u.exit().remove();
}

