var barmargin = {top: 30, right: 30, bottom: 70, left: 60},
barwidth = 460 - barmargin.left - barmargin.right,
barheight = 400 - barmargin.top - barmargin.bottom;

var barsvg = d3.select("#bar-container")
.append("svg")
.attr("width", barwidth + barmargin.left + barmargin.right)
.attr("height", barheight + barmargin.top + barmargin.bottom)
.append("g")
.attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")");
d3.csv("data/ages.csv").then(function(data){

  //X axis
  var x = d3.scaleBand()
  .range([ 0, barwidth ])
  .domain(data.map(function(d) {  return d.age; }))
  .padding(0.2);
  barsvg.append("g")
    .attr("transform", "translate(0," + barheight + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10, 0)rotate(-45)")
    .style("text-anchor", "end");

  // text label for the x axis
  barsvg.append("text")             
  .attr("transform",
        "translate(" + (barwidth/2) + " ," + 
                      (barheight + barmargin.top + 20) + ")")
  .style("text-anchor", "middle")
  .style("fill", "white")
  .text("Ages");

  var formatPercent = d3.format(".0%");

  //y axis
  var y = d3.scaleLinear()
    .domain([0, .5])
    .range([ barheight, 0])
  barsvg.append("g")
    .call(d3.axisLeft(y).tickFormat(formatPercent));


  // text label for the y axis
  barsvg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - barmargin.left)
  .attr("x",0 - (barheight / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("Percentage")
  .style("fill", "white");

  //bars
  barsvg.selectAll("bar")
  .data(data)
  .enter()
  .append("rect")
    .attr("x", function(d) { return x(d.age); })
    .attr("y", function(d) { return y(d.percentage)} )
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return barheight - y(d.percentage); })
    .attr("fill", "#69b3a2")
})

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var data1 = {}
var data2 = {}
d3.csv("data/top_10_subs.csv").then(function(data) {
    var columns = ['Rank', 'Streamer', 'Subscribers'];
    var dataArray = data.map(d => [d.Rank, d.Name, d.Subscriber_Count])
    tabulate(dataArray, columns);
    
});

var tabulate = function (data,columns) {
    var table = d3.select('#table-container').append('table').attr('class','table');
      var thead = table.append('thead')
      var tbody = table.append('tbody')
  
      thead.append('tr')
        .selectAll('th')
          .data(columns)
          .enter()
        .append('th')
          .text(function (d) { return d })
  
      var rows = tbody.selectAll('tr')
          .data(data)
          .enter()
        .append('tr');
  
      var cells = rows.selectAll('td')
        .data(function(row) {
              return row;
        })
        .enter()
        .append('td')
        .text(function (d) { return numberWithCommas(d) })
  
    return table;
  }

  d3.csv("data/gender.csv").then(function(data) {
    data1 = {female: data[0].Female, male: data[0].Male }
    data2 = {female: data[1].Female, male: data[1].Male }
    
    update(data2);
  });


  var width = 450
  var height = 450
  var pie_margin = 40

  var radius = Math.min(width, height) / 2 - pie_margin

  var svg = d3.select("#pie-container")
  .append("svg").attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var color = d3.scaleOrdinal()
  .domain(["female", "male"])
  .range([d3.rgb("#bfabFF"), d3.rgb("#57bee6")]);

  function update(data)
  {

    var arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)

    var pie = d3.pie()
    .value(function(d) { return d[1]; })
    .sort(function(a, b) { return d3.ascending(a.key, b.key);})
    
    var data_ready = pie(Object.entries(data))

    var u = svg.selectAll("path")
    .data(data_ready)    


    u
    .enter()
    .append('path')
    .merge(u)
    .transition()
    .duration(1000)
    .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
    )
    .attr('fill', function(d) {
        return(color(d.data[0]))
    })
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 1)

    u.enter()
    .data(data_ready)
    .append('text')
    .text(function(d) { return d.data[0]})
    .transition()
    .duration(1000)
    .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
    .style("text-anchor", "middle")
    .style("font-size", 17)

    u.exit().remove()
  }