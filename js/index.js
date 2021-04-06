d3.csv("data/top_100_streamers_last_365_days.csv")
    .then(function (data) {
        d3.select('#streamer-icons')
            .selectAll('div')
            .data(data)
            .enter()
                .append('div')
                    .attr('class', 'icon')
                .append('img')
                    .attr('src', d => "img/" + d["Rank"] + "_"+ d["Channel URL"] + ".jpeg");
    }
);