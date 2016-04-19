 var w = $(window).innerWidth(),
     h = $(window).innerHeight();

var drawLegendBox = function () {
    var legend = d3.select('.mbta-map').append('g')
        .attr('class', 'legend');

    legend.append('rect')
        .attr('class', 'legend-rect')
        .attr('x', (1 - 0.249) * w)
        .attr('y', 0.33 * h)
        .attr('width', 0.166 * w)
        .attr('height', 0.33 * h)
        .style('fill', '#000000')
        .style('stroke', '#ffffff')
        .style('stroke-width', '1px');
};

var colorSelector = function (route) {
        //console.log(route);
        if (route.mode_name === 'Subway') {
          return route.route_name.split(' Line')[0].toLowerCase();
        }
        else if (route.mode_name === 'Commuter Rail') {
           return 'purple';
        }
        else if (route.mode_name === 'Bus') {
            return 'yellow';
        }
        else if (route.mode_name === 'Boat') {
            return 'white';
        }
        else {
            return 'color error';
        }
    };

var colorSelectorRoute = function (route) {
        //console.log(route);
        if (route.mode_name === 'Subway') {
          return route.route.route_name.split(' Line')[0].toLowerCase();
        }
        else if (route.mode_name === 'Commuter Rail') {
           return 'purple';
        }
        else if (route.mode_name === 'Bus') {
            return 'yellow';
        }
        else if (route.mode_name === 'Boat') {
            return 'white';
        }
        else {
            return 'color error';
        }
    };

var mbtaLiveInitialize = function () {

    var vehiclesCallback = function (routeVehicles) {

        var modeName = routeVehicles.mode_name;

        for (var i = 0; i < routeVehicles.direction.length; i++) {
            for (var j = 0; j < routeVehicles.direction[i].trip.length; j++) {
                console.log(routeVehicles.direction[i].trip[j].trip_name + ', ' + routeVehicles.route_id);
            }

            var trips = routeVehicles.direction[i].trip,
                color = colorSelector(routeVehicles);

            var directionClass = '_' + routeVehicles.route_id + '_' +
                    routeVehicles.direction[i].direction_id,
                routeClass = '_' + routeVehicles.route_id,
                modeClass = '_' + routeVehicles.mode_name;

            var yScale = d3.scale.linear()
                .domain([
                    42.447176,
                    42.270097
                ])
                .range([0.2 * h, 0.8 * h]);
            var xScale = d3.scale.linear()
                .domain([
                    -71.312943,
                    -70.880013
                ])
                .range([0.2 * w, 0.8 * w]);

            var tripGroup = d3.select('.mbta-map').selectAll('g.' + directionClass)
                .data(trips)
                .enter()
                .append('g')
                .attr('class', function (d) {
                    return directionClass;
                })
                .attr('x', function (d) {
                    return xScale(d.vehicle.vehicle_lon);
                })
                .attr('y', function (d) {
                    return yScale(d.vehicle.vehicle_lat);
                });

            var tripCircle = tripGroup.append('circle')
                .attr('id', function (d) {
                    return directionClass + d.trip_id + '_dot';
                })
                .attr('class', function (d) {
                    return directionClass;
                })
                .attr('cx', function (d) {
                    return xScale(d.vehicle.vehicle_lon);
                })
                .attr('cy', function (d) {
                    return yScale(d.vehicle.vehicle_lat);
                })
                .attr('r', function () {
                    if (modeName === 'Bus') {
                        return 1.5 + 'px';
                    }
                    else {
                        return 2.5 + 'px';
                    }
                })
                .style('fill', color)
                .style('opacity', function () {
                    if (modeName === 'Bus') {
                        return 0.1;
                    }
                    else {
                        return 0.4;
                    }
                });

             var tripText = tripGroup.append('text')
                .attr('id', function (d) {
                    return directionClass + d.trip_id + '_text';
                })
                .attr('class', function (d) {
                    return directionClass;
                })
                .attr('x', function (d) {
                    return 0.083 * w;//xScale(d.vehicle.vehicle_lon);
                })
                .attr('y', function (d) {
                    return 0.166 * h;//yScale(d.vehicle.vehicle_lat);
                })
                .text(function (d) {
                    return d.trip_name;
                })
                .style('font-size', 0.042 * h)
                .style('fill', '#ffffff')
                .style('opacity', 0);

           tripGroup.on('mouseenter', function () {

                d3.select(this).select('text')
                    .style('opacity', 0.6);
            });

            tripGroup.on('mouseleave', function () {
                d3.select(this).select('text')
                    .style('opacity', 0);
            });
        }
    };

    var getVehiclePositions = function (route) {
        $.getJSON('http://realtime.mbta.com/developer/api/v2/vehiclesbyroute', {
            api_key: 'wX9NwuHnZU2ToO7GmGR9uw',
            route: route.route_id,
            format: 'json'
        })
        .done(function (data) {
            vehiclesCallback(data);
        })
        .fail(function () {
            console.log('No data for ' + route.route_name + ' ' + route.route_id);
        });
    };

    var routesCallback = function (data) {

        var routes = new Array();

        for (var i = 0; i < data.mode.length;
             i++) {
            for (var j = 0; j < data.mode[i].route.length; j++){
               routes.push(data.mode[i].route[j]);
            }
        }

        for (var i = 0; i < routes.length; i++) {
                getVehiclePositions(routes[i]);
        }
    };

    $.getJSON('http://realtime.mbta.com/developer/api/v2/routes', {
        api_key: 'wX9NwuHnZU2ToO7GmGR9uw',
        format: 'json'
    })
        .done( function (data) {
            routesCallback(data);
        });

};

var main = function () {
    var svgCanvas = d3.select('.mbta-live').append('svg')
        .attr('class', 'mbta-map')
        .attr('width', w)
        .attr('height', h)
        .style('background-color', '#000000');
    //drawLegendBox();
    mbtaLiveInitialize();
    setInterval(function () {
        mbtaLiveInitialize();
    }, 30000);
};

$(document).ready(
     main()
);
