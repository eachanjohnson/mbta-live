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

function selectModeOfTransportationColor (modeOfTransportation, route) {
    
    var color = '';
    
    //console.log(route);
    switch (modeOfTransportation.mode_name) {
        case 'Subway':
            color = route.route_name.split(' Line')[0].toLowerCase();
            break;
        case 'Commuter Rail':
            color = 'purple';
            break;
        case 'Bus':
            color = 'black';
            break;
        case 'Boat':
            color = 'white';
            break;
        default:
            color = 'black';
    }
        
    return color;
};

function selectRouteColor (route) {
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

function drawDotsForVehicles (vehicles, canvas) {
    
    var modesOfTransportation = Object.keys(vehicles).length > 0 ? vehicles.mode : [],
        canvasWidth = parseFloat(canvas.style('width')),
        canvasHeight = parseFloat(canvas.style('height')),
        uniqueDotSetId = Math.ceil(100000 * Math.random()),
        yScale = d3.scale.linear()
                            .domain([42.447176, 42.270097])
                            .range([0, canvasHeight]),
        xScale = d3.scale.linear()
                            .domain([-71.312943, -70.880013])
                            .range([0, canvasWidth]),
        pathFunction = d3.svg.line()
                                .interpolate('basis')
                                .x(function (d) {return xScale(d.vehicle_lon)})
                                .y(function (d) {return yScale(d.vehicle_lat)});
    
    console.log('Modes: ' + modesOfTransportation.map(function(mode){return mode.mode_name;}).join(', '));
    
    for ( var iMode = 0; iMode < modesOfTransportation.length; iMode++ ) {
        
        var thisModeOfTransportation = modesOfTransportation[iMode],
            thisModeOfTransportationName = thisModeOfTransportation.mode_name,
            thisModeOfTransportationRoutes = thisModeOfTransportation.route;
        
        console.log('Mode-Routes: ' + thisModeOfTransportationRoutes.map(function(route){return route.route_name;}).join(', '));
        
        for ( var iRoute = 0; iRoute < thisModeOfTransportationRoutes.length; iRoute++ ) {
            
            var thisRoute = thisModeOfTransportationRoutes[iRoute],
                thisRouteId = thisRoute.route_id,
                thisRouteName = thisRoute.route_name,
                thisRouteDirections = thisRoute.direction,
                thisRouteColor = selectModeOfTransportationColor(thisModeOfTransportation, thisRoute);
            
            console.log('Routes-Dirs: ' + thisRouteDirections.map(function(dir){return dir.direction_name;}).join(', '));
            
            for ( var iDirection = 0; iDirection < thisRouteDirections.length; iDirection++ ) {
                
                var thisDirection = thisRouteDirections[iDirection],
                    thisDirectionId = thisDirection.direction_id,
                    thisDirectionName = thisDirection.direction_name,
                    thisDirectionTrips = thisDirection.trip,
                    thisRouteDirectionClass = 'route' + thisRouteId + 'direction' + thisDirectionId,
                    tripCircles = canvas.selectAll('circle.' + thisRouteDirectionClass)
                                        .data(thisDirectionTrips),
                    tripTexts = canvas.selectAll('text.' + thisRouteDirectionClass)
                                        .data(thisDirectionTrips);
                
                console.log('Dir-Trips: ' + thisRouteName + ' to ' + thisDirectionTrips.map(function(trip){return trip.trip_headsign}).join(', '));
                
                tripCircles
                    .transition().duration(3000)
                    .attr('cx', function (d) {return xScale(d.vehicle.vehicle_lon);})
                    .attr('cy', function (d) {return yScale(d.vehicle.vehicle_lat);})
                
                tripCircles.enter()  // enter selection
                    .append('circle')
                    .attr('class', thisRouteDirectionClass)
                    .attr('id', function (d) {return thisRouteDirectionClass + d.trip_id + '_dot';})
                    .style('fill', thisRouteColor)
                    .attr('r', thisModeOfTransportationName === 'Bus'? 1.5 : 3)
                    .attr('cx', function (d) {return xScale(d.vehicle.vehicle_lon);})
                    .attr('cy', 0)
                    .style('opacity', thisModeOfTransportationName === 'Bus' ? 0.6 : 0.8)
                    .on('mouseenter', function () {

                        var thisClass = d3.select(this).attr('class');
                       
                        d3.select('text.' + thisClass)
                            .style('opacity', 0.4);
                    })
                    .on('mouseleave', function () {
                        
                        var thisClass = d3.select(this).attr('class');

                        d3.select('text.' + thisClass)
                            .transition().duration(100)
                            .style('opacity', 0);
                    })
                    .transition()
                        .duration(3000)
                        .attr('cy', function (d) {return yScale(d.vehicle.vehicle_lat);});
        
                tripCircles.exit().remove(); // exit selection
                
                tripTexts.enter()  // enter selection
                    .append('text')
                    .attr('id', function (d) {return thisRouteDirectionClass + d.trip_id + '_text'})
                    .attr('class', thisRouteDirectionClass)
                    .attr('x', 0.01 * canvasWidth)
                    .attr('y', 0.05 * canvasHeight)
                    .text(function (d) {return thisRouteName + ' ' + thisDirectionName + ' to ' + d.trip_headsign;})
                    .attr('text-width', 0.2 * canvasWidth)
                    .style('font-size', 0.03 * canvasHeight)
                    .style('font-family', 'sans-serif')
                    .style('fill', thisRouteColor)
                    .style('opacity', 0);

                tripTexts.exit().remove();  //exit selection
                
                for (var iTrips = 0; iTrips < thisDirectionTrips.length; iTrips++) {
            
                    var thisTrip = thisDirectionTrips[iTrips],
                        thisTripId = thisTrip.trip_id,
                        tripPath = canvas.select('path.' + thisRouteDirectionClass + thisTripId);

                    if (tripPath.empty()) {  // if trip doesn't have a path associated yet

                        var thisTripLat = thisTrip.vehicle.vehicle_lat,
                            thisTripLon = thisTrip.vehicle.vehicle_lon, 
                            newTripPath = canvas.append('path')
                                                .attr('class', thisRouteDirectionClass + thisTripId)
                                                .attr('id', thisRouteDirectionClass + thisTripId + '_path')
                                                .style('stroke', thisRouteColor)
                                                .style('fill', 'rgba(0,0,0,0)')  // transparent fill
                                                .style('stroke-width', thisModeOfTransportationName === 'Bus'? 1 : 3)
                                                .style('stroke-opacity', thisModeOfTransportationName === 'Bus' ? 0.1 : 0.3);

                        newTripPath.datum([{'vehicle_lat': thisTripLat,   // add first data point
                                            'vehicle_lon': thisTripLon}]);

                    } else {  // if path already exists

                        tripPath.datum()
                                .push({'vehicle_lat': thisTrip.vehicle.vehicle_lat,   // add new data point
                                        'vehicle_lon': thisTrip.vehicle.vehicle_lon});

                        tripPath.transition()
                            .duration(5000)
                            .ease("linear")
                            .attr('d', pathFunction);  // redraw path of vehicle
                    }
                }        
            }
        }
    }
}

function getVehicles (routes, callbackFunction) {
    
    // get vehicles on supplied list of route objects
    
    var routeChunks = [[]]; // need chunks of up to 20 for the API
    
    for ( var i = 0; i < routes.length; i++ ) {
        
        var numberOfChunksSoFar = routeChunks.length,
            workingChunk = routeChunks[numberOfChunksSoFar - 1],
            thisRoute = routes[i];
        
        if ( workingChunk.length < 20 ) {
            workingChunk.push(thisRoute);
        } else {
            routeChunks.push([thisRoute]);
        }
    }
    
    console.log('Chunked routes:\n' + routeChunks.map(function (item) {return item.map(function (item2) {return ' ' + item2.route_name;});}).join('\n'));
    
    routeChunks.forEach(function getVehiclesByRoutes (routes, index) {
        
        var url = 'http://realtime.mbta.com/developer/api/v2/vehiclesbyroutes',
            apiKey = 'wX9NwuHnZU2ToO7GmGR9uw', //'wX9NwuHnZU2ToO7GmGR9uw',4iS91ICFhEW6N3lGBVgU9g
            routeIds = routes.map(function (item) {return item.route_id;}),
            getParams = {api_key: apiKey, routes: routeIds.join(','), format: 'json'};
 
        $.getJSON(url, getParams, callbackFunction)
            .fail(function () {
                console.log('Error requesting data for ' + getParams.routes);
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
        drawDotsForVehicles(data, canvas);
    }
    
    getVehicles(routeList, drawDotsInPositionsOnCanvas);    
    
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
