'use strict';

function drawLegendBox () {
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

function colorSelector (route) {
    
    var color = new String();
    
    //console.log(route);
    switch (route.mode_name) {
        case 'Subway':
            color = route.route_name.split(' Line')[0].toLowerCase();
            break;
        case 'Commuter Rail':
            color = 'purple';
            break;
        case 'Bus':
            color = '#e2e200';
            break;
        case 'Boat':
            color = 'white';
            break;
        default:
            color = 'black';
    }
        
    return color;
};

function colorSelectorRoute (route) {
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

function drawDotsForRoute (routeVehicles, canvas) {

    var modeOfTransportation = routeVehicles.mode_name,
        routeId = routeVehicles.route_id,
        routeDirections = routeVehicles.direction,
        canvasWidth = parseFloat(canvas.style('width')),
        canvasHeight = parseFloat(canvas.style('height')),
        uniqueDotSetId = Math.ceil(100000 * Math.random()),
        routeClass = '_' + routeId,
        modeClass = '_' + modeOfTransportation,
        color = colorSelector(routeVehicles),
        yScale = d3.scale.linear()
                            .domain([42.447176, 42.270097])
                            .range([0, canvasHeight]),
        xScale = d3.scale.linear()
                            .domain([-71.312943, -70.880013])
                            .range([0, canvasWidth]);

    for (var i = 0; i < routeDirections.length; i++) {
        
        var thisDirection = routeDirections[i],
            trips = thisDirection.trip,
            directionClass = '_' + routeId + '_' + thisDirection.direction_id,
            tripCircle = canvas.selectAll('circle.' + directionClass)
                                .data(trips),
            tripText = canvas.selectAll('text.' + directionClass)
                                .data(trips);
        
        tripCircle.attr('cx', function (d) {
                            return xScale(d.vehicle.vehicle_lon);
                        })
                    .attr('cy', function (d) {
                        return yScale(d.vehicle.vehicle_lat);
                    });
        
        tripCircle.enter()
                    .append('circle')
                    .attr('class', directionClass)
                    .attr('id', function (d) {
                            return directionClass + d.trip_id + '_dot';
                        })
                    .attr('cx', function (d) {
                            return xScale(d.vehicle.vehicle_lon);
                        })
                    .attr('cy', function (d) {
                        return yScale(d.vehicle.vehicle_lat);
                    })
                    .attr('r', modeOfTransportation === 'Bus'? 1.75 : 5)
                    .style('fill', color)
                    .style('opacity', modeOfTransportation === 'Bus' ? 0.6 : 0.8)
                    .on('mouseenter', function () {

                        var thisClass = d3.select(this).attr('class');
                       
                        d3.select('text.' + thisClass)
                            .style('opacity', 0.6);
                    })
                    .on('mouseleave', function () {
                        
                        var thisClass = d3.select(this).attr('class');

                        d3.select('text.' + thisClass)
                            .transition().duration(100)
                            .style('opacity', 0);
                    });
        
        tripCircle.exit().remove();
        
        tripText.enter()
                .append('text')
                .attr('id', function (d) {
                    return directionClass + d.trip_id + '_text';
                })
                .attr('class', directionClass)
                .attr('x', function (d) {
                    return 0.025 * canvasWidth; //xScale(d.vehicle.vehicle_lon);
                })
                .attr('y', function (d) {
                    return 0.05 * canvasHeight; //yScale(d.vehicle.vehicle_lat);
                })
                .text(function (d) {
                    return d.trip_name;
                })
                .attr('text-width', 0.2 * canvasWidth)
                .style('font-size', 0.03 * canvasHeight)
                .style('font-family', 'sans-serif')
                .style('fill', '#000000')
                .style('opacity', 0);
        
        tripText.exit().remove();
        
        tripCircle.on('mouseenter', function () {

                        var thisClass = d3.select(this).attr('class');
                       
                        d3.select('text.' + thisClass)
                            .style('opacity', 0.6);
                    })
                    .on('mouseleave', function () {
                        
                        var thisClass = d3.select(this).attr('class');

                        d3.select('text.' + thisClass)
                            .transition().duration(100)
                            .style('opacity', 0);
                    });
        
        for (var j = 0; j < trips.length; j++) {
            
            var thisTrip = trips[j],
                thisTripId = thisTrip.trip_id,
                newTrip = true,
                pathFunction = d3.svg.line()
                                    .interpolate('basis')
                                    .x(function (d) {return xScale(d.vehicle_lon)})
                                    .y(function (d) {return yScale(d.vehicle_lat)}),
                tripPath = canvas.select('path.' + directionClass + thisTripId);
            
            if (tripPath.empty()) {
                
                var thisTripLat = thisTrip.vehicle.vehicle_lat,
                    thisTripLon = thisTrip.vehicle.vehicle_lon, 
                    newTripPath = canvas.append('path')
                                        .attr('class', directionClass + thisTripId)
                                        .attr('id', directionClass + thisTripId + '_path')
                                        .style('stroke', color)
                                        .style('fill', 'rgba(0,0,0,0)')
                                        .style('stroke-width', modeOfTransportation === 'Bus'? 1.75 : 3)
                                        .style('opacity', modeOfTransportation === 'Bus' ? 0.6 : 0.8);
                
                newTripPath.datum([{'vehicle_lat': thisTripLat, 'vehicle_lon': thisTripLon}]);
            
            } else {
                
                tripPath.datum()
                        .push({'vehicle_lat': thisTrip.vehicle.vehicle_lat, 
                                'vehicle_lon': thisTrip.vehicle.vehicle_lon});
                    
                tripPath.transition()
                    .duration(5000)
                    .ease("linear")
                    .attr('d', pathFunction);
            
            }
            
            console.log(thisTrip.trip_name + ', ' + routeVehicles.route_id);
        }

    }
}


function getVehiclePositions (routes, callbackFunction) {
    
    routes.forEach(function getVehiclePositionsByRoute (route, index) {
        
        var url = 'http://realtime.mbta.com/developer/api/v2/vehiclesbyroute',
            apiKey = 'wX9NwuHnZU2ToO7GmGR9uw', //'wX9NwuHnZU2ToO7GmGR9uw',4iS91ICFhEW6N3lGBVgU9g
            getParams = {api_key: apiKey, route: route.route_id, format: 'json'};

        $.getJSON(url, getParams, callbackFunction)
            .fail(function () {
                console.log('No data for ' + route.route_name + ' ' + route.route_id);
            });
    });
    
}

function getRoutes (data) {

    var routeList = [],
        modesOfTransportation = data.mode;

    for (var i = 0; i < modesOfTransportation.length; i++) {
        
        var thisModeOfTransportation = modesOfTransportation[i],
            routes = thisModeOfTransportation.route;
        
        for (var j = 0; j < routes.length; j++){
            
            var thisRoute = routes[j];
           
            routeList.push(thisRoute);
        }
    }
    
    return routeList;
};

function pollMbtaRoutes (callbackFunction) {
    
    var apiUrl = 'http://realtime.mbta.com/developer/api/v2/routes',
        apiKey = 'wX9NwuHnZU2ToO7GmGR9uw',//wX9NwuHnZU2ToO7GmGR9uw',4iS91ICFhEW6N3lGBVgU9g
        getParams = {api_key: apiKey, format: 'json'},
        promise = $.getJSON(apiUrl, getParams, callbackFunction)
                    .fail(function () {
                        console.log('Couldn\'t access API with key ' + apiKey);
                    });
    
    return promise;
}

function drawVehicleDots (data, canvas) {
    
    var routeList = getRoutes(data);
    
    function drawDotsInPositionsOnCanvas (data) {
        drawDotsForRoute(data, canvas);
    }
    
    getVehiclePositions(routeList, drawDotsInPositionsOnCanvas);    
    
}

function mbtaLive (svgCanvas) {
    
    // Wrapper abstraction to run the fun
    
    function drawVehicleDotsOnCanvas (data) {
        
        drawVehicleDots(data, svgCanvas);
        
    }
    
    function recursiveMbtaLive () {
        setTimeout(function() {
            mbtaLive(svgCanvas);
        }, 30000);
    }
    
    pollMbtaRoutes(drawVehicleDotsOnCanvas).done(recursiveMbtaLive);
    
}

function setupSvgCanvas (container, thisClass, bgColor) {
    
    var containerWidth = $(container).width(),
        containerHeight = $(container).height(),
        svgCanvas = d3.select(container).append('svg')
                        .attr('class', thisClass)
                        .style('width', containerWidth)
                        .style('height', containerHeight)
                        .style('background-color', bgColor);
    
    return svgCanvas;
    
}

function main () {
    
    var windowWidth = $(window).width(),
        windowHeight = $(window).height(),
        mbtaLiveContainer = '.mbta-live',
        backgroundColor = '#c6c6c6',
        svgCanvasClass = 'mbta-map',
        mbtaLiveCanvas = setupSvgCanvas(mbtaLiveContainer, svgCanvasClass, backgroundColor);
    
    mbtaLive(mbtaLiveCanvas);

}

// run after page loaded
$(document).ready(main);
