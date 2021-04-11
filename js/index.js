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
const encoding_options = [
    'Average Viewers',
    'Stream Count',
    'Average Followers Gained',
    'Average Peak Viewers',
    'Average Stream Length',
    'Average Views per Hour',
];

// Selection options: rank, streamer, gender, nationality, age
        
var select = d3.select('#encoding-selector-container')
    .append('text').text('Select Encoding')
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
d3.csv("https://raw.githubusercontent.com/matteosandrin/coms4995-data-vis-final-project/gantt-chart/data/gantt_month_data.csv")
    .then(function (raw_data) {
        data = getStreamsData(raw_data);

        const date_extent = d3.extent(data.map(d => d.start));
        const total_months = dateDiff(date_extent[0], date_extent[1]);
        const text_padding = 20;
        const date_scale = d3.scaleLinear()
            .domain([0, total_months])
            .range([text_padding, screen.width]);

        const height = 1200;
        const margin = {top: 80, left: 0, right: 0, bottom: 20};
            
        const width_padding = 1;
        const height_padding = 2;
        const num_streamers = 100;
        const rect_height = (height - margin.top - margin.bottom)/(num_streamers+1) - height_padding;
        
        const rect_width = (screen.width - text_padding)/total_months - width_padding;

        d3.select('#gantt-chart-svg')
            .attr("viewBox", [0, 0, screen.width, height]);

        // Make the gantt chart rects
        d3.select('#gantt-chart-svg')
            .selectAll('rect')
            .data(data)
            .join('rect')
                .attr("width", rect_width)
                .attr("height", rect_height)
                .attr("y", d => margin.top + (rect_height + height_padding)*d.rank)
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

        // Make rects to cover for selectedt attrs (gender here)
        d3.select('#gantt-chart-svg')
            .append('g')
            .selectAll('rect')
            .data([...new Set(data.map(d => d.rank))])
            .join('rect')
                .attr("id", d => "select_rect_gender_" + d)
                .attr("width", date_scale(dateDiff(date_extent[1], date_extent[0])))
                .attr("height", rect_height)
                .attr("y", d => margin.top + (rect_height + height_padding)*d)
                .attr("x", date_scale(dateDiff(date_extent[0], date_extent[0])))
                .attr("fill", "white")
                .attr("opacity", 0);


        const select_width = 120;
        const select_height = 40;

        var property = "gender";

        // Make selector boxes to pick properties (gender here)
        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("rect")
            .data([...(new Set(data.map(d => d.gender).sort()))])
            .join("rect")
                .attr("id", d => "rect_select_" + property + "_" + d)
                .attr("x", (_, i) => i*select_width)
                .attr("y", 0)
                .attr("width", select_width)
                .attr("height", select_height)
                .attr("fill", "purple")
                .attr("stroke", "black")
                .attr("opacity", .5)
                .on("click", function(event, selectedData) {
                    selectStreamers(data, property, selectedData);
                });

        // Text for each selector
        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("text")
            .data([...(new Set(data.map(d => d.gender).sort()))])
            .join("text")
                .attr("id", d => "text_select_" + property + "_" + d)
                .attr("x", (_, i) => i*select_width + select_width*.5)
                .attr("y", select_height/2)
                .text(d => d)
                .on("click", function(event, selectedData) {
                    selectStreamers(data, property, selectedData);
                });

        // Make text for rankings of streamers
        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("text")
            .data([...Array(100).keys()].map(d=>d+1))
            .join("text")
                .attr("id", d => "streamer_text_" + d)
                .attr("y", d => margin.top + (rect_height + height_padding)*d + rect_height/2)
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
        const gender = curr_obj['gender'];
        const nat = curr_obj['nationality'];
        const birth_year = curr_obj['birth_year'];
        const age = birth_year != '' ? 2021 - parseInt(birth_year) : -1;
        
        arr = arr.concat({
            rank: parseInt(curr_obj['rank']),
            name: curr_obj['streamer'],
            start: new Date('20' + raw_start_date[1], months[raw_start_date[0]]),
            gender: gender == 'Male' || gender == 'Female' ? gender : 'NA',
            nationality: nat != '' && nat != 'N/A' ? nat : 'NA',
            age: age,
            stream_count: parseInt(curr_obj['count']),
            avg_followers_gained: parseFloat(curr_obj['avg_followers_gained']),
            avg_peak_viewers: parseFloat(curr_obj['avg_peak_viewers']),
            avg_stream_length: parseFloat(curr_obj['avg_stream_length']),
            avg_viewers: parseFloat(curr_obj['avg_viewers']),
            avg_views_per_hour: parseFloat(curr_obj['avg_views_per_hour']),
            selected: true,
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
    // Check if selector rect or not
    if (!('rank' in d)) {
        return "white";
    }

    const color_obj = {
        'Stream Count': {
            domain: [0, 60],
            field: function(d) { return d.stream_count; },
        },
        'Average Viewers': {
            domain: [-2000, 20000],
            field: function(d) { return d.avg_viewers; },
        },
        'Average Followers Gained': {
            domain: [-100, 5000],
            field: function(d) { return d.avg_followers_gained; },
        },
        'Average Peak Viewers': {
            domain: [0, 50000],
            field: function(d) { return d.avg_peak_viewers; },
        },
        'Average Stream Length': {
            domain: [0, 600],
            field: function(d) { return d.avg_stream_length; },
        },
        'Average Views per Hour': {
            domain: [0, 50000],
            field: function(d) { return d.avg_views_per_hour; },
        },
    };

    const encoding = color_obj[value];
    const color_scheme = d3.scaleSequential(d3.interpolateBlues).domain(encoding.domain);
    return color_scheme(encoding.field(d));
}

function selectStreamers(data, property, value) {
    const selected_data = data.map(d => d[property] == value);
    const select_id = "#select_rect_" + property + "_";

    for (i = 0; i < selected_data.length; i++) {
        const curr_select_id = select_id + data[i].rank;
        d3.select(curr_select_id)
            .attr("opacity", function() {
                this.parentElement.appendChild(this);
                return selected_data[i] ? 0 : .8;
            });
    }
}