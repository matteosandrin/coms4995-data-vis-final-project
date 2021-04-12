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
        .text(function (d) { return d })
  
    return table;
  }

  d3.csv("data/gender.csv").then(function(data) {
    data1 = {female: data[0].Female, male: data[0].Male }
    data2 = {female: data[1].Female, male: data[1].Male }
    
    update(data2);
  });


  var width = 450
  var height = 450
  margin = 40

  var radius = Math.min(width, height) / 2 - margin

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
    .text(function(d) { console.log(d); return d.data[0]})
    .transition()
    .duration(1000)
    .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
    .style("text-anchor", "middle")
    .style("font-size", 17)

    u.exit().remove()
  }