d3.csv("data/top_100_streamers_last_365_days.csv")
    .then(function (data) {
        d3.select('#streamer-icons')
            .selectAll('div')
            .data(data)
            .enter()
                .append('div')
                    .attr('class', 'icon')
                    .on('mouseover', function (d,i) {
                        d3.select(this).transition()
                            .duration(50)
                            .style("opacity", "0.5");
                    })
                    .on('mouseout', function (d,i) {
                        d3.select(this).transition()
                            .duration(50)
                            .style("opacity", "1.0");
                    })
                .append('img')
                    .attr('src', d => "img/" + d["Rank"] + "_"+ d["Channel URL"] + ".jpeg");
    }
);