let currStreamer = {};
d3.csv("https://raw.githubusercontent.com/matteosandrin/coms4995-data-vis-final-project/gantt-chart/data/top_100_streamers_last_365_days.csv")
    .then(function (data) {
        currStreamer = data[0];
        setStreamerDetail(currStreamer);
        d3.select('#streamer-icons')
            .selectAll('div')
            .data(data)
            .enter()
                .append('div')
                    .attr('class', 'icon')
                    .on('mouseover', function () {
                        d3.select(this)
                            .each(function (d) {setStreamerDetail(d)})
                            .transition()
                                .duration(50)
                                .style("opacity", "0.5");
                    })
                    .on('mouseout', function () {
                        d3.select(this)
                            .each(function (d) {setStreamerDetail(currStreamer)})
                            .transition()
                                .duration(50)
                                .style("opacity", "1.0");
                    })
                    .on('click', function() {
                        d3.select(this)
                            .each(function (d) {
                                currStreamer = d;
                                markAsSelected(this);
                            })
                    })
                .append('img')
                    .attr('src', d => getImageUrl(d));
    }
);

function getImageUrl(streamer) {
    return "img/" + streamer["Rank"] + "_"+ streamer["Channel URL"] + ".jpeg";
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function setStreamerDetail(streamer) {
    d3.select('.icon-large > img').attr('src', getImageUrl(streamer));

    d3.select('.streamer-title').text(streamer.Channel);

    d3.select('#streamer-rank > .label').text('rank');
    d3.select('#streamer-rank > .value').text(streamer.Rank);

    d3.select('#streamer-followers > .label').text('followers');
    d3.select('#streamer-followers > .value').text(numberWithCommas(streamer.Followers));

    d3.select('#streamer-watch-time > .label').text('watch time');
    const watch_hours = Math.round(streamer["Watch time"] / 60);
    d3.select('#streamer-watch-time > .value').text(numberWithCommas(watch_hours) + " hours");

    d3.select('#streamer-language > .label').text('language');
    d3.select('#streamer-language > .value').text(streamer.Language);
}

function markAsSelected(elem) {
    // clear previous selections
    d3.selectAll(".icon > img")
        .style("opacity", "1.0")
        .style("background-color", "white");
    // mark element as selected
    d3.select(elem)
        .select("img")
            .style("opacity", "0.5")
            .style("background-color", "blueviolet");
}