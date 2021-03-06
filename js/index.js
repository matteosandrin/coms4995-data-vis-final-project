let currStreamer = {};

// Encoding selector for Gantt
const encoding_options = [
    'Average Viewers',
    'Stream Count',
    'Average Followers Gained',
    'Average Peak Viewers',
    'Average Stream Length (Minutes)',
    'Average Views per Hour',
];

// Selection options: rank, streamer, gender, nationality, age
const selection_options = [
    'rank', // see if slider
    'gender', // buttons
    'nationality', // dropdown
    'age', // buckets (or slider too, if easy)
        // <18, 18-25, 26-39, 40-59, 60+
];
        
var select_encoding = d3.select('#encoding-selector-container')
    .select('select')
        .on('change', changeEncoding);

select_encoding
    .selectAll('option')
    .data(encoding_options)
    .enter()
    .append('option')
        .text(function (d) { return d; });

var gantt_data = [];

// Maintain an object for each category to determine if streamer should be shown or not
var data_selection_info = {
    'rank': 'All',
    'gender': 'All',
    'nationality': 'All',
    'age': 'All',
};

const data_selection_options = {
    'gender': ['All', 'Male', 'Female', 'N/A'],
    'age': ['All', 'N/A', 'Less than 18', '18-22', '23-27', '28-32', '33-39', '40 and Up'],
};

const margin = {top: 110, left: 0, right: 30, bottom: 20};

var data = [];
var total_months = 0;
var first_month = 0;
var curr_encoding = encoding_options[0];

const gantt_height = 2800;
            
const width_padding = -.5;
const height_padding = 14;
const num_streamers = 100;
const rect_height = (gantt_height - margin.top - margin.bottom)/(num_streamers+1) - height_padding;

const small_chart_width = 1425;
const small_chart_height = 1000;

// Use so axes are not repeatedly drawn
var small_chart_created = false;

var streamer_seletor_data = [];

// Gantt Chart
d3.csv("./data/gantt_month_data.csv")
.then(function (raw_data) {

    data = getStreamsData(raw_data);
    gantt_data = data;

    setGenderButtons("All");
    
    d3.csv("./data/top_100_streamers_with_categorical.csv")
    .then(function (tile_data) {
        streamer_seletor_data = tile_data;
        currStreamer = tile_data[0];
        setStreamerDetail(currStreamer);
        d3.select('#streamer-icons')
            .selectAll('div')
            .data(tile_data)
            .enter()
                .append('div')
                    .attr('class', 'icon')
                    .attr('id', d => 'streamer-tile-img-' + d.Rank)
                    .on('mouseover', function (_, selectedData) {
                        d3.select(this)
                            .each(function (d) {setStreamerDetail(d)})
                            .classed("streamer-tile-img-hover", true);
                        d3.select("#hover_rect_" + selectedData.Rank)
                            .attr("opacity", .8);
                    })
                    .on('mouseout', function (_, selectedData) {
                        d3.select(this)
                            .each(function (d) {setStreamerDetail(currStreamer)})
                            .classed("streamer-tile-img-hover", false);
                        if (selectedData != currStreamer) {
                            d3.select("#hover_rect_" + selectedData.Rank)
                                .attr("opacity", 0);
                        }
                    })
                    .on('click', function(_, selectedData) {
                        d3.select("#hover_rect_" + currStreamer.Rank)
                            .attr("opacity", 0);

                        d3.select(this)
                            .each(function (d) {
                                currStreamer = d;
                                markAsSelected(this);
                            })
                        
                        createSmallChart(data, currStreamer.Rank, curr_encoding, total_months, first_month);
                        
                        d3.select("#hover_rect_" + selectedData.Rank)
                            .attr("opacity", .8);
                    })
                .append('img')
                    .attr('src', d => getImageUrl(d));
        
        const date_extent = d3.extent(data.map(d => d.start));
        total_months = dateDiff(date_extent[0], date_extent[1]);
        const text_padding = 250;
        const date_scale = d3.scaleLinear()
            .domain([0, total_months])
            .range([text_padding, screen.width - margin.right]);
        
        const rect_width = (screen.width - text_padding - margin.right)/total_months - width_padding;

        data_selection_options['nationality'] = ['All', ...new Set(data.map(d => d.nationality))];

        d3.select('#gantt-chart-svg')
            .attr("viewBox", [0, 0, screen.width, gantt_height]);

        // Add text and rect for no streamers in filter
        const no_streamers_rect_width = 450;
        const no_streamers_rect_height = 50;
        d3.select("#gantt-chart-svg")
            .append("rect")
            .attr("id", "no-streamers-rect")
            .attr("y", margin.top + 68 - no_streamers_rect_height/2)
            .attr("x", screen.width/2 - no_streamers_rect_width/2)
            .attr("fill", "red")
            .attr("opacity", 0)
            .attr("rx", 10)
            .attr("height", no_streamers_rect_height)
            .attr("width", no_streamers_rect_width);

        d3.select("#gantt-chart-svg")
            .append("text")
            .attr("id", "no-streamers-text")
            .attr("y", margin.top + 80)
            .attr("x", screen.width/2)
            .text("No Streamers Match this Filter")
            .attr("text-anchor", "middle")
            .attr("stroke-weight", .5)
            .attr("fill", "white")
            .attr("opacity", 0)
            .attr("font-size", 30);

        // Selector rects for streamers on hover
        d3.select('#gantt-chart-svg')
            .append('g')
            .attr("id", "hover_rect_g")
            .selectAll('rect')
            .data([...new Set(data.map(d => d.rank))])
            .join('rect')
                .attr("id", d => "hover_rect_" + d)
                .attr("width", screen.width)
                .attr("height", rect_height + height_padding)
                .attr("y", d => margin.top + (rect_height + height_padding)*d - height_padding/2)
                .attr("x", margin.left)
                .attr("fill", "#525252")
                .attr("rx", 5)
                .attr("opacity", 0);

        d3.select("#hover_rect_" + currStreamer.Rank)
            .attr("opacity", .8);

        // Make the gantt chart rects
        d3.select('#gantt-chart-svg')
            .append('g')
            .attr("id", "gantt-chart-rects")
            .selectAll('rect')
            .data(data)
            .join('rect')
                .attr("id", d => "gantt_rect_" + d.rank + "_" + d.start.getFullYear() + "_" + d.start.getMonth())
                .attr("width", rect_width)
                .attr("height", rect_height)
                .attr("y", d => margin.top + (rect_height + height_padding)*d.rank)
                .attr("x", d => date_scale(dateDiff(d.start, date_extent[0])))
                .attr("fill", d => getColorScheme(d, encoding_options[0]))
                .attr("opacity", 1)
                .on("mouseover", function(event, selectedData) {
                    mouseOverGantt(this, selectedData);
                })
                .on("mouseout", function(event, selectedData) {
                    mouseOutGantt(this, selectedData);
                });

        // Text for years/months
        const date_labels = [
            {date: new Date(2015, 6), label: 'July 2015'},
            {date: new Date(2016, 0), label: 'January 2016'},
            {date: new Date(2017, 0), label: 'January 2017'},
            {date: new Date(2018, 0), label: 'January 2018'},
            {date: new Date(2019, 0), label: 'January 2019'},
            {date: new Date(2020, 0), label: 'January 2020'},
            {date: new Date(2020, 7), label: 'August 2020'},
        ];

        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("text")
            .data(date_labels)
            .join("text")
                .attr("y", margin.top)
                .attr("x", d => date_scale(dateDiff(d.date, date_extent[0])) + 6)
                .text(d => d.label)
                .attr("text-anchor", "start")
                .attr("stroke-weight", .5)
                .attr("fill", "white")
                .attr("font-size", 17);

        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("line")
            .data(date_labels)
            .join("line")
                .attr("x1", d => date_scale(dateDiff(d.date, date_extent[0])))
                .attr("x2", d => date_scale(dateDiff(d.date, date_extent[0])))
                .attr("y1", margin.top + rect_height + height_padding - 40)
                .attr("y2", gantt_height - margin.bottom)
                .attr("stroke", "white");

        // Make text for rankings of streamers
        d3.select("#gantt-chart-svg")
            .append("text")
            .attr("x", text_padding - 14)
            .attr("y", margin.top)
            .attr("text-anchor", "end")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .attr("font-size", 20)
            .text("Streamer (rank)");

        d3.select("#gantt-chart-svg")
            .append("g")
            .selectAll("text")
            .data(tile_data)
            .join("text")
                .attr("id", (d, i) => "streamer_text_" + (i+1))
                .attr("y", (d, i) => margin.top + (rect_height + height_padding)*(i+1) + rect_height/2 + 7)
                .attr("x", text_padding - 14)
                .text((d, i) => d.Channel + " (" + (i+1) + ")")
                .attr("text-anchor", "end")
                .attr("fill", "white")
                .attr("font-size", 20)
                .on("mouseover", function(event, selectedData) {
                    mouseOverText(this, selectedData);
                })
                .on("mouseout", function(event, selectedData) {
                    mouseOutText(this, selectedData);
                })
                .on("click", function(event, selectedData) {
                    d3.selectAll("#streamer-tile-img-" + selectedData.Rank).dispatch('click');
                    d3.selectAll("#streamer-tile-img-" + selectedData.Rank).dispatch('mouseover');
                });

        var select_nationality = d3.select('#nationality-selector-container')
            .select('select')
                .on('change', function() { changeNationality(data, data_selection_info) });

        select_nationality
            .selectAll('option')
            .data(['All', ...new Set(data.map(d => d.nationality))].sort())
            .enter()
            .append('option')
                .text(function (d) { return d; });

        var select_age = d3.select('#age-selector-container')
            .select('select')
                .on('change', function() { changeAge(data, data_selection_info) });

        select_age
            .selectAll('option')
            .data(data_selection_options['age'])
            .enter()
            .append('option')
                .text(function (d) { return d; });

        d3.select('#selector-clear-button')
            .on('click', () => clearStreamerSelection(data));

        makeLegend(encoding_options[0]);

        first_month = date_extent[0];
        createSmallChart(data, currStreamer.Rank, curr_encoding, total_months, first_month);
    });
});

const color_obj = {
    'Stream Count': {
        domain: [0, 60],
        field: function(d) { return d.stream_count == undefined ? d : d.stream_count; },
    },
    'Average Viewers': {
        domain: [0, 20000],
        field: function(d) { return d.avg_viewers == undefined ? d : d.avg_viewers; },
    },
    'Average Followers Gained': {
        domain: [0, 5000],
        field: function(d) { return d.avg_followers_gained == undefined ? d : d.avg_followers_gained; },
    },
    'Average Peak Viewers': {
        domain: [0, 50000],
        field: function(d) { return d.avg_peak_viewers == undefined ? d : d.avg_peak_viewers; },
    },
    'Average Stream Length (Minutes)': {
        domain: [0, 600],
        field: function(d) { return d.avg_stream_length == undefined ? d : d.avg_stream_length; },
    },
    'Average Views per Hour': {
        domain: [0, 50000],
        field: function(d) { return d.avg_views_per_hour == undefined ? d : d.avg_views_per_hour; },
    },
};

function getImageUrl(streamer) {
    return "img/" + streamer["Rank"] + "_"+ streamer["Channel URL"] + ".jpeg";
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberToOrdinal(num) {
    var j = num % 10,
        k = num % 100;
    if (j == 1 && k != 11) {
        return num + "st";
    }
    if (j == 2 && k != 12) {
        return num + "nd";
    }
    if (j == 3 && k != 13) {
        return num + "rd";
    }
    return num + "th";
}

function setStreamerDetail(streamer) {
    d3.select('.icon-large > img').attr('src', getImageUrl(streamer));

    d3.select('.streamer-title').text(streamer.Channel);

    if (streamer.Age != "N/A") {
        d3.select('#streamer-age > .label').text('age');
        d3.select('#streamer-age > .value').text(streamer.Age);
    } else {
        // hide if there is no nationality on record
        d3.select('#streamer-age > .label').text('');
        d3.select('#streamer-age > .value').text('');
    }

    if (streamer.Gender != "N/A") {
        d3.select('#streamer-gender > .label').text('gender');
        d3.select('#streamer-gender > .value').text(streamer.Gender);
    } else {
        // hide if there is no nationality on record
        d3.select('#streamer-gender > .label').text('');
        d3.select('#streamer-gender > .value').text('');
    }

    d3.select('#streamer-rank > .label').text('rank');
    d3.select('#streamer-rank > .value').text(numberToOrdinal(streamer.Rank));

    d3.select('#streamer-followers > .label').text('followers');
    d3.select('#streamer-followers > .value').text(numberWithCommas(streamer.Followers));

    d3.select('#streamer-watch-time > .label').text('watch time');
    const watch_hours = Math.round(streamer["Watch time"] / 60);
    d3.select('#streamer-watch-time > .value').text(numberWithCommas(watch_hours) + " hours");

    d3.select('#streamer-language > .label').text('language');
    d3.select('#streamer-language > .value').text(streamer.Language);

    if (streamer.Nationality != "N/A") {
        d3.select('#streamer-nationality > .label').text('nationality');
        d3.select('#streamer-nationality > .value').text(streamer.Nationality);
    } else {
        // hide if there is no nationality on record
        d3.select('#streamer-nationality > .label').text('');
        d3.select('#streamer-nationality > .value').text('');
    }
}

function markAsSelected(elem) {
    // clear previous selections
    d3.selectAll(".icon > img")
        .classed("streamer-tile-img-clicked", false);
    // mark element as selected
    d3.select(elem)
        .select("img")
            .classed("streamer-tile-img-clicked", true);
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
        const nat = curr_obj['nationality'] == 'Frence' ? 'French' : curr_obj['nationality'];
        const birth_year = curr_obj['birth_year'];
        const age = birth_year != '' ? 2021 - parseInt(birth_year) : -1;
        
        arr = arr.concat({
            rank: parseInt(curr_obj['rank']),
            name: curr_obj['streamer'],
            start: new Date('20' + raw_start_date[1], months[raw_start_date[0]]),
            gender: gender == 'Male' || gender == 'Female' ? gender : 'N/A',
            nationality: nat != '' && nat != 'N/A' ? nat : 'N/A',
            age: age,
            stream_count: parseInt(curr_obj['count']),
            avg_followers_gained: parseFloat(curr_obj['avg_followers_gained']),
            avg_peak_viewers: parseFloat(curr_obj['avg_peak_viewers']),
            avg_stream_length: parseFloat(curr_obj['avg_stream_length']),
            avg_viewers: parseFloat(curr_obj['avg_viewers']),
            avg_views_per_hour: parseFloat(curr_obj['avg_views_per_hour']),
        });
    }
    
    return arr;
}

function dateDiff(date_1, date_2) {
    first_date = date_1 < date_2 ? date_1 : date_2;
    second_date = date_1 < date_2 ? date_2 : date_1;

    first_date = new Date(first_date);
    second_date = new Date(second_date);

    var months = (second_date.getFullYear() - first_date.getFullYear())*12;
    months -= first_date.getMonth();
    months += second_date.getMonth();
    return months;
}
        
function changeEncoding() {
    curr_encoding = d3.select('#encoding-selector').property('value');
        
    d3.select("#legend").remove();
    makeLegend(curr_encoding);

    d3.select('#gantt-chart-svg')
        .select("#gantt-chart-rects")
        .selectAll('rect')
        .attr("fill", d => getColorScheme(d, curr_encoding));

    createSmallChart(data, currStreamer.Rank, curr_encoding, total_months, first_month);
}

function changeNationality(data, data_selection_info) {
    const select_value = d3.select('#nationality-selector').property('value');
        
    selectStreamers(data, data_selection_info, 'nationality', select_value);
}

function changeAge(data, data_selection_info) {
    const select_value = d3.select('#age-selector').property('value');
    const value_to_range = {
        'All': 'All',
        'N/A': [-2, -1],
        'Less than 18': [0, 17],
        '18-22': [18, 22],
        '23-27': [23, 27],
        '28-32': [28, 32],
        '33-39': [33, 39],
        '40 and Up': [40, 100],
    };

    selectStreamers(data, data_selection_info, 'age', value_to_range[select_value]);
}

function getColorScheme(d, value) {
    const encoding = color_obj[value];
    const color_scheme = d3.scaleSequential(d3.interpolatePlasma).domain(encoding.domain);
    return color_scheme(encoding.field(d));
}

function setGenderButtons(value)
{
    //set button colors
    console.log(value);
    if (value == "Male")
    {
        $("#femalebutton").removeClass('button-selected');
        $("#allbutton").removeClass('button-selected');
        $("#nabutton").removeClass('button-selected');
        $("#malebutton").addClass('button-selected');
    } else if (value == "Female") {
        $("#femalebutton").addClass('button-selected');
        $("#allbutton").removeClass('button-selected');
        $("#nabutton").removeClass('button-selected');
        $("#malebutton").removeClass('button-selected');
    } else if (value == "N/A")
    {
        $("#femalebutton").removeClass('button-selected');
        $("#allbutton").removeClass('button-selected');
        $("#nabutton").addClass('button-selected');
        $("#malebutton").removeClass('button-selected');
    } else {
        $("#femalebutton").removeClass('button-selected');
        $("#allbutton").addClass('button-selected');
        $("#nabutton").removeClass('button-selected');
        $("#malebutton").removeClass('button-selected');
    }
    
}

function selectStreamers(data, data_selection_info, property, value) {
    data_selection_info[property] = value;
    var selected_streamers = {};
    var non_selected_streamers = {};
    var selected_ranks = {};
    var non_selected_ranks = {};

    setGenderButtons(value);

    for (const d of data) {
        var selected = true;
        for (const key of Object.keys(data_selection_info)) {
            if (data_selection_info[key] != 'All' && d[key] != data_selection_info[key]) {
                if (key == 'age') {
                    if (d[key] < data_selection_info[key][0] || d[key] > data_selection_info[key][1]) {
                        selected = false;
                        break;
                    }
                } else {
                    selected = false;
                    break;
                }
            }
        }

        const curr_id = "#gantt_rect_" + d.rank + "_" + d.start.getFullYear() + "_" + d.start.getMonth();
        d3.select(curr_id)
            .attr("opacity", selected ? 1 : .1);

        if (selected) {
            selected_streamers[d.name] = selected_streamers[d.name] + ", " + curr_id;
            selected_ranks[d.name] = d.rank;
        } else {
            non_selected_streamers[d.name] = non_selected_streamers[d.name] + ", " + curr_id;
            non_selected_ranks[d.name] = d.rank;
        }
    }

    d3.selectAll(".icon")
        .classed("streamer-tile-img-deselected", false);

    var count_selected = 1;
    for (streamer in selected_streamers) {
        d3.selectAll(selected_streamers[streamer].substr(2))
            .transition()
            .delay((d, i) => 10*i + count_selected*10)
            .duration(1000)
            .attr("y", margin.top + (rect_height + height_padding)*count_selected);

        d3.select("#hover_rect_" + selected_ranks[streamer])
            .transition()
            .duration(1000)
            .attr("y", margin.top + (rect_height + height_padding)*count_selected - height_padding/2);

        d3.selectAll("#streamer_text_" + selected_ranks[streamer])
            .transition()
            .duration(1000)
            .attr("y", margin.top + (rect_height + height_padding)*count_selected + rect_height/2 + 5);
        count_selected++;
    }

    if (count_selected == 1) {
        d3.select("#gantt-chart-svg")
            .select("#no-streamers-rect")
            .transition()
            .attr("opacity", function() {
                this.parentElement.appendChild(this);
                return .8;
            });

        d3.select("#gantt-chart-svg")
            .select("#no-streamers-text")
            .transition()
            .attr("opacity", function() {
                this.parentElement.appendChild(this);
                return 1;
            });
    } else {
        d3.select("#gantt-chart-svg")
            .selectAll("#no-streamers-text, #no-streamers-rect")
            .attr("opacity", function() {
                this.parentNode.insertBefore(this, this.parentNode.firstChild);
                return 0;
            });
    }

    for (streamer in non_selected_streamers) {
        d3.selectAll(non_selected_streamers[streamer].substr(2))
            .attr("y", gantt_height + margin.bottom);

        d3.select("#hover_rect_" + non_selected_ranks[streamer])
            .attr("y", gantt_height + margin.bottom);

        d3.selectAll("#streamer_text_" + non_selected_ranks[streamer])
            .attr("y", gantt_height + margin.bottom);
        d3.selectAll("#streamer-tile-img-" + non_selected_ranks[streamer])
            .classed("streamer-tile-img-deselected", true);
    }
}

function clearStreamerSelection(data) {
    if (
        data_selection_info['rank'] != 'All' ||
        data_selection_info['gender'] != 'All' ||
        data_selection_info['nationality'] != 'All' ||
        data_selection_info['age'] != 'All'
    ) {
        data_selection_info = {
            'rank': 'All',
            'gender': 'All',
            'nationality': 'All',
            'age': 'All',
        };
        d3.selectAll('.select')
            .property('value', 'All');
        d3.select('#encoding-selector')
            .property('value', 'Average Viewers');
        selectStreamers(data, data_selection_info, 'rank', 'All');
        changeEncoding();
    }
}

function mouseOverGantt(t, selectedData) {
    d3.select(t)
        .attr("stroke", "black")
        .attr("stroke-width", 3);
    t.parentElement.appendChild(t);

    var tgrp = d3.select("#gantt-chart-svg")
        .append("g")
        .attr("id", "tooltip");

    const encoding_val = color_obj[curr_encoding]['field'](selectedData);

    // Streamer names are different in two data sets
    var channel_name = "";
    for (streamer of streamer_seletor_data) {
        if (streamer.Rank == selectedData.rank) {
            channel_name = streamer.Channel;
            break;
        }
    }

    tgrp.append("text")
        .attr("x", 5)
        .attr("y", 26)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("font-size", "20")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text(`${numberWithCommas(Math.round(encoding_val))}`);

    tgrp.append("text")
        .attr("x", 5)
        .attr("y", 50)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("font-size", "16")
        .attr("fill", "black")
        .attr("font-style", "italic")
        .text(`${channel_name} (${selectedData.rank})`);

    tgrp.append("text")
        .attr("x", 5)
        .attr("y", 70)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("font-size", "16")
        .attr("fill", "black")
        .attr("font-style", "italic")
        .text(`${selectedData.start.getMonth()+1 + "/" + selectedData.start.getFullYear()}`);


    var text_width = null;

    tgrp.append("rect")
        .attr("width", function(d) {
            text_width = this.parentNode.getBBox().width;
            return this.parentNode.getBBox().width + 15;
        })
        .attr("height", "80")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .lower();

    const curr_x = parseFloat(d3.select(t).attr("x"));
    const x_offset = curr_x < screen.width/2 ? 0 : -text_width;
    var xpos = curr_x + x_offset;
    var ypos = parseFloat(d3.select(t).attr("y")) - 90;
    tgrp.attr("transform", `translate(${xpos}, ${ypos})`);
}

function mouseOutGantt(t, selectedDate) {
    d3.select(t)
        .attr("stroke-width", 0);

    d3.select("#tooltip").remove();
}

function mouseOverText(t, selectedData) {
    d3.select(t)
        .attr("font-size", 21)
        .attr("font-weight", "bold");

    d3.select("#hover_rect_" + selectedData.Rank)
        .attr("opacity", .8);

    d3.select(t).style("cursor", "pointer");
}

function mouseOutText(t, selectedData) {
    d3.select(t)
        .attr("font-size", 20)
        .attr("font-weight", "regular");

    if (currStreamer != selectedData) {
        d3.select("#hover_rect_" + selectedData.Rank)
            .attr("opacity", 0);
    }

    d3.select(t).style("cursor", "default"); 
}

function makeLegend(encoding) {
    const x_left_val = screen.width - margin.right - 400;
    const curr_domain = color_obj[encoding]['domain'];
    
    const x = d3.scaleLinear()
      .domain(curr_domain)
      .rangeRound([x_left_val, screen.width - 2*margin.right]);
  
    const legend = d3.select("#gantt-chart-svg")
        .append("g")
        .attr("id", "legend")
        .style("font-size", "0.8rem")
        .style("font-family", "sans-serif")
        .attr("transform", `translate(0, ${margin.top - 80})`);
  
    legend.selectAll("rect")
      .data(d3.range(curr_domain[0], curr_domain[1], (curr_domain[1]-curr_domain[0])/1000))
      .enter().append("rect")
        .attr("height", 14)
        .attr("x", d => x(d))
        .attr("width", 1.25)
        .attr("fill", d => getColorScheme(d, encoding));

    const label = legend.append("g")
        .attr("fill", "#000")
        .attr("text-anchor", "start")
  
    label.append("text")
        .attr("y", -6)
        .attr("x", screen.width - margin.right - 400)
        .attr("font-size", 20)
        .attr("fill", "white")
        .text(encoding);

    const ticks = [curr_domain[0], curr_domain[1]/2, curr_domain[1]];

    const scale = legend.append("g")
        .style("font-size", "14px")
        .call(d3.axisBottom(x).tickSize(15).ticks(4).tickFormat((d, i) => `${d}${d == curr_domain[1] ? '+' : ''}`))
        .select(".domain").remove();
}

function createSmallChart(data, curr_rank, encoding, total_months, first_month) {
    d3.select("#small-chart-svg").selectAll('text').remove();

    const chart_margin = {left: 150, right: 40, top: 100, bottom: 160};
    d3.select("#small-chart-svg")
        .attr("viewBox", [0, 0, small_chart_width, small_chart_height]);

    const streamer_data = data.filter(d => d.rank == curr_rank);
    const extract_field = color_obj[encoding]['field'];
    const y_domain = [0, d3.extent(streamer_data.map(d => extract_field(d)))[1]];
    
    const bar_padding = 5;
    const bar_width = (small_chart_width - margin.left - margin.right)/total_months - bar_padding;

    const y_scale  = d3.scaleLinear()
        .domain(y_domain)
        .range([0, small_chart_height - chart_margin.top - chart_margin.bottom]);

    const x_scale = d3.scaleLinear()
        .domain([0, total_months])
        .range([chart_margin.left, small_chart_width - chart_margin.right - bar_width]);

    const x_axis_ticks = [
        {date: new Date(2015, 6), label: '7/2015'},
        {date: new Date(2017, 0), label: '1/2017'},
        {date: new Date(2018, 0), label: '1/2018'},
        {date: new Date(2019, 0), label: '1/2019'},
        {date: new Date(2020, 0), label: '1/2020'},
        {date: new Date(2020, 7), label: '8/2020'},
    ];

    const y_axis_ticks = [
        y_domain[0],
        Math.round((y_domain[1] - y_domain[0])/5, 0),
        Math.round(2*(y_domain[1] - y_domain[0])/5, 0),
        Math.round(3*(y_domain[1] - y_domain[0])/5),
        Math.round(4*(y_domain[1] - y_domain[0])/5),
        Math.round(y_domain[1]),
    ];
    const axis_pad = 20;
    if (!small_chart_created) {
        // x axis
        d3.select("#small-chart-svg")
            .append("line")
            .attr("x1", chart_margin.left)
            .attr("x2", small_chart_width - chart_margin.right)
            .attr("y1", small_chart_height - chart_margin.bottom + axis_pad)
            .attr("y2", small_chart_height - chart_margin.bottom + axis_pad)
            .attr("stroke-weight", 5)
            .attr("stroke", "white");

        // y axis
        d3.select("#small-chart-svg")
            .append("line")
            .attr("x1", chart_margin.left - axis_pad)
            .attr("x2", chart_margin.left - axis_pad)
            .attr("y1", 100)
            .attr("y2", small_chart_height - chart_margin.bottom)
            .attr("stroke-weight", 5)
            .attr("stroke", "white");

        // x axis ticks
        d3.select("#small-chart-svg")
            .append("g")
            .selectAll("line")
            .data(x_axis_ticks)
            .join("line")
                .attr("x1", d => x_scale(dateDiff(d.date, first_month)))
                .attr("x2", d => x_scale(dateDiff(d.date, first_month)))
                .attr("y1", small_chart_height - chart_margin.bottom + 30 + axis_pad)
                .attr("y2", small_chart_height - chart_margin.bottom + axis_pad)
                .attr("stroke", "white");

        // y axis ticks
        d3.select("#small-chart-svg")
            .append("g")
            .selectAll("line")
            .data(y_axis_ticks)
            .join("line")
                .attr("x1", chart_margin.left - 10 - axis_pad)
                .attr("x2", chart_margin.left - axis_pad)
                .attr("y1", d => small_chart_height - chart_margin.bottom - y_scale(d))
                .attr("y2", d => small_chart_height - chart_margin.bottom - y_scale(d))
                .attr("stroke", "white");
    }

    // x axis labels
    d3.select("#small-chart-svg")
        .append("g")
        .selectAll("text")
        .data(x_axis_ticks)
        .join("text")
            .attr("fill", "white")
            .attr("font-size", 34)
            .attr("transform", d=>`translate(${x_scale(dateDiff(d.date, first_month)) - 70}, ${small_chart_height - 20 + axis_pad}), rotate(-45)`)
            .text(d => d.label);

    // y axis labels (needs to change)
    d3.select("#small-chart-svg")
        .append("g")
        .selectAll("text")
        .data(y_axis_ticks)
        .join("text")
            .attr("x", chart_margin.left - 30 - axis_pad)
            .attr("y", d => small_chart_height - chart_margin.bottom - y_scale(d))
            .attr("fill", "white")
            .attr("font-size", 28)
            .attr("text-anchor", "end")
            .text(d => numberWithCommas(d));

    // chart rects (needs to change)
   d3.select('#small-chart-svg')
        .selectAll('rect')
        .data(streamer_data)
        .join('rect')
            .attr("id", d => "small_bar_" + d.start.getFullYear() + "_" + d.start.getMonth())
            .attr("width", bar_width)
            .attr("x", d => x_scale(dateDiff(d.start, first_month)))
            .attr("fill", "white")
            .attr("opacity", 1)
            .transition()
                .duration(500)
                .attr("y", d => small_chart_height - chart_margin.bottom - y_scale(extract_field(d)))
                .attr("height", d => y_scale(extract_field(d)));

    // Rects for hovering on bar chart
    d3.select('#small-chart-svg')
        .append("g")
        .selectAll('rect')
        .data(streamer_data)
        .join('rect')
            .attr("opacity", 0)
            .attr("width", bar_width)
            .attr("x", d => x_scale(dateDiff(d.start, first_month)))
            .on("mouseover", function(_, selectedData) {
                mouseOverSmallChart(this, selectedData, extract_field, y_scale);
            })
            .on("mouseout", function(_, selectedData) {
                mouseOutSmallChart(this, selectedData);
            })
            .attr("y", chart_margin.top)
            .attr("height", small_chart_height - chart_margin.top - chart_margin.bottom);
                
    // chart title (needs to change)
    const title = streamer_data[0].name + "'s " + encoding;
    d3.select("#small-chart-svg")
        .append("text")
        .attr("x", small_chart_width/2)
        .attr("y", chart_margin.top/2.5)
        .text(title)
        .attr("fill", "white")
        .attr("font-size", 40)
        .attr("text-anchor", "middle");

    small_chart_created = true;
}

function mouseOverSmallChart(t, selectedData, extract_field, y_scale) {
    const bar_id = "#small_bar_" + selectedData.start.getFullYear() + "_" + selectedData.start.getMonth();
    d3.select("#small-chart-svg")
        .select(bar_id)
        .attr("fill", "blueviolet");

    var tgrp = d3.select("#small-chart-svg")
        .append("g")
        .attr("id", "tooltip");

    tgrp.append("text")
        .attr("x", 5)
        .attr("y", 36)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("font-size", "36")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(`${numberWithCommas(Math.round(extract_field(selectedData)))}`);

    tgrp.append("text")
        .attr("x", 5)
        .attr("y", 70)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .attr("font-size", "32")
        .attr("font-style", "italic")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(`${(selectedData.start.getMonth()+1) + "/" + selectedData.start.getFullYear()}`);

    var text_width = null;

    tgrp.append("rect")
        .attr("width", function(d) {
            text_width = this.parentNode.getBBox().width;
            return this.parentNode.getBBox().width + 10;
        })
        .attr("height", "90")
        .attr("fill", "blueviolet")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .lower();

    const curr_x = parseFloat(d3.select(t).attr("x"));
    const x_offset = curr_x < small_chart_width/2 ? 30 : -text_width-20;
    var xpos = curr_x + x_offset;

    const curr_y = small_chart_height - y_scale(extract_field(selectedData));
    var ypos = Math.min(Math.max(curr_y, 150), 680);
    tgrp.attr("transform", `translate(${xpos}, ${ypos})`);
}

function mouseOutSmallChart(t, selectedData) {
    const bar_id = "#small_bar_" + selectedData.start.getFullYear() + "_" + selectedData.start.getMonth();
    d3.select("#small-chart-svg")
        .select(bar_id)
        .attr("fill", "white");
    d3.select("#tooltip").remove();
}