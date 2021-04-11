d3.csv("data/top_10_subs.csv").then(function(data) {
    var columns = ['Rank', 'Streamer', 'Subscribers'];
    var dataArray = data.map(d => [d.Rank, d.Name, d.Subscriber_Count])
    tabulate(dataArray, columns);
    
});

var tabulate = function (data,columns) {
    console.log(data);
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