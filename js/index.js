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

// Encoding selector for Gantt
const encoding_options = ['Average Viewers', 'Stream Count'];
        
var select = d3.select('#encoding-selector-container')
    .append('select')
        .attr('class', 'select')
        .attr("id", "encoding-selector")
        .on('change', changeEncoding);

select
    .selectAll('option')
    .data(encoding_options)
    .enter()
    .append('option')
        .text(function (d) { return d; });

// Gantt Chart
d3.csv("https://raw.githubusercontent.com/AlexCCohen/data_viz_A5/main/avg_viewers_month_v3.csv")
    .then(function (raw_data) {
        data = getStreamsData(raw_data);

        const date_extent = d3.extent(data.map(d => d.start));
        const total_months = dateDiff(date_extent[0], date_extent[1]);
        const text_padding = 20;
        const date_scale = d3.scaleLinear()
            .domain([0, total_months])
            .range([text_padding, screen.width]);

        const height = 1200;
            
            
        const width_padding = 1;
        const height_padding = 2;
        const num_streamers = 100;
        const rect_height = height/(num_streamers+1) - height_padding;
        
        const rect_width = (screen.width - text_padding)/total_months - width_padding;

        d3.select('#gantt-chart-svg')
            .attr("viewBox", [0, 0, screen.width, height])
            .selectAll('rect')
            .data(data)
            .join('rect')
                .attr("width", rect_width)
                .attr("height", rect_height)
                .attr("y", d => (rect_height + height_padding)*d.rank)
                .attr("x", d => date_scale(dateDiff(d.start, date_extent[0])))
                .attr("fill", d => getColorScheme(d, encoding_options[0]))
                .attr("opacity", 1)
                .on("mouseover", function() {
                    d3.select(this)
                        .attr("stroke", "black")
                        .attr("stroke-width", 3);
                    this.parentElement.appendChild(this);
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr("stroke-width", 0);
                });

        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("text")
            .data([...Array(100).keys()].map(d=>d+1))
            .join("text")
                .attr("id", d => "streamer_text_" + d)
                .attr("y", d => (rect_height + height_padding)*d + rect_height/2)
                .attr("x", 5)
                .text(d => d)
                .attr("text-anchor", "start")
                .attr("font-size", 9)
                .on("mouseover", function(event, selectedData) {
                    d3.select(this)
                        .transition()
                        .attr("font-size", 14);

                    d3.select("#streamer_text_" + (selectedData - 1).toString())
                        .transition()
                        .attr("font-size", 12);

                    d3.select("#streamer_text_" + (selectedData + 1).toString())
                        .transition()
                        .attr("font-size", 12);

                    this.parentElement.appendChild(this);
                })
                .on("mouseout", function(event, selectedData) {
                    d3.select(this)
                        .transition()
                        .attr("font-size", 9);

                    d3.select("#streamer_text_" + (selectedData - 1).toString())
                        .transition()
                        .attr("font-size", 9);

                    d3.select("#streamer_text_" + (selectedData + 1).toString())
                        .transition()
                        .attr("font-size", 9);
                });
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

function getStreamsData(raw_data) {
    const months = {
        'Jan': 0,
        'Feb': 1,
        'Mar': 2,
        'Apr': 3,
        'May': 4,
        'Jun': 5,
        'Jul': 6,
        'Aug': 7,
        'Oct': 8,
        'Sep': 9,
        'Nov': 10,
        'Dec': 11
    };
    
    var arr = [];
    
    for (var idx in raw_data) {
        const curr_obj = raw_data[idx];
        if (curr_obj == null || curr_obj['rank'] == null) { continue; }
        
        const raw_start_date = curr_obj['start_month'].split('-');
        
        arr = arr.concat({
        rank: parseInt(curr_obj['rank']),
        name: curr_obj['streamer'],
        start: new Date('20' + raw_start_date[1], months[raw_start_date[0]]),
        avg_viewers: parseFloat(curr_obj['avg_avg_viewers']),
        count: parseInt(curr_obj['count']),
        });
    }
    
    return arr;
}

function dateDiff(date_1, date_2) {
    first_date = date_1 < date_2 ? date_1 : date_2;
    second_date = date_1 < date_2 ? date_2 : date_1;

    var months = (second_date.getFullYear() - first_date.getFullYear())*12;
    months -= first_date.getMonth();
    months += second_date.getMonth();
    return months;
}
        
function changeEncoding() {
    const select_value = d3.select('#encoding-selector').property('value');
        
    d3.select('#gantt-chart-svg')
        .selectAll('rect')
        .attr("fill", d => getColorScheme(d, select_value));
}

function getColorScheme(d, value) {
    var color_scheme;
    var color;

    if (value == 'Stream Count') {
        color_scheme = d3.scaleSequential(d3.interpolateBlues).domain([0, 60]);
        color = color_scheme(d.count);
    } else {
        color_scheme = d3.scaleSequential(d3.interpolateBlues).domain([-2000, 20000]);
        color = color_scheme(d.avg_viewers);
    }

    return color;
}