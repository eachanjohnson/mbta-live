'use strict';

var subwayColors = {
    blue: 'steelblue',
    green: 'darkgreen',
    red: 'firebrick',
    orange: 'goldenrod'
}

function selectModeOfTransportationColor(modeOfTransportation, route) {
    
    var color = '';
    
    //console.log(route);
    switch (modeOfTransportation.mode_name) {
    case 'Subway':
        color = subwayColors[route.route_name.split(' Line')[0].toLowerCase()];
        break;
    case 'Commuter Rail':
        color = 'darkmagenta';
        break;
    case 'Bus':
        color = 'black';
        break;
    case 'Boat':
        color = 'seagreen';
        break;
    default:
        color = 'snow';
    }
        
    return color;
}

function pathTween(d1, precision) {
                          
    return function () {
        var startPath = this,
            finalPath = startPath.cloneNode(),
            startPathLength = startPath.getTotalLength(),
            finalPathLength = (finalPath.setAttribute("d", d1), finalPath).getTotalLength();

        // Uniform sampling of distance based on specified precision.
        var fractionsAlongPath = [0], 
            porportionAlongPath = 0, 
            dt = precision / Math.max(startPathLength, startPathLength);

        while (porportionAlongPath < 1) {
            fractionsAlongPath.push(porportionAlongPath);
            porportionAlongPath += dt;
        }

        fractionsAlongPath.push(1);

        // Compute point-interpolators at each distance.
        var interpolators = fractionsAlongPath.map(function (fraction) {
          var startPoint = startPath.getPointAtLength(fraction * startPathLength),
              finalPoint = finalPath.getPointAtLength(fraction * finalPathLength);
          return d3.interpolate([startPoint.x, startPoint.y], [finalPoint.x, finalPoint.y]);
        });

        return function (fraction) {
          return fraction < 1 ? 'M' + interpolators.map(function (interpolator) {return interpolator(fraction);}).join('L') : d1;
        };
    };
}

function drawDotsForVehicles(vehicles, canvas) {
    
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
                    numberOfTrips = thisDirectionTrips.length,
                    thisRouteDirectionClass = 'route' + thisRouteId + 'direction' + thisDirectionId,
                    tripCircles = canvas.selectAll('circle.' + thisRouteDirectionClass)
                                        .data(thisDirectionTrips, function (d) {return d.vehicle.vehicle_id;}),
                    tripTexts = canvas.selectAll('text.' + thisRouteDirectionClass)
                                        .data(thisDirectionTrips, function (d) {return d.vehicle.vehicle_id;});
                
                console.log('Dir-Trips: ' + thisRouteName + 
                            ' to ' + thisDirectionTrips.map(function(trip){return trip.trip_headsign}).join(', '));
                
                tripCircles  // update selection
                    .transition().duration(3000).delay(function(d, i) {return i * 1500;})
                        .attr('cx', function (d) {return xScale(d.vehicle.vehicle_lon);})
                        .attr('cy', function (d) {return yScale(d.vehicle.vehicle_lat);})
                
                tripCircles.enter()  // enter selection
                    .append('circle')
                    .attr('class', thisRouteDirectionClass + ' enter')
                    .attr('id', function (d) {return thisRouteDirectionClass + d.trip_id + '_dot';})
                    .style('fill', thisRouteColor)
                    .attr('r', 30)
                    .attr('cx', function (d) {return canvasWidth * Math.random();})
                    .attr('cy', -1.1 * canvasHeight)
                    //.attr('enter', true)
                    .on('mousedown', function () {

                        var thisId = d3.select(this).attr('id').split('_dot')[0];
                       
                        d3.select(this).transition()
                            .ease('elastic').attr('r', 30);
                        d3.select('#' + thisId + '_text')
                            .attr('class', 'visible');
                    })
                    .on('mouseup', function () {
                        
                        var thisId = d3.select(this).attr('id').split('_dot')[0];

                        d3.select(this)
                            .transition().ease('elastic')
                            .attr('r', function (d) {
                                if ( thisModeOfTransportationName === 'Bus' ) {
                                    return 1.5;
                                } else {
                                    return Object.keys(d.vehicle).indexOf('vehicle_speed') > -1 ? 1 + Math.sqrt(d.vehicle.vehicle_speed) : 3;
                                }
                            });
                            d3.select('#' + thisId + '_text')
                                .transition().duration(100)
                                .attr('class', 'invisible');
                    })
                    .transition().duration(3000).delay(function(d, i) {return i * 500;}).ease('bounce')
                        //.classed('enter', true)
                        .attr('r', function (d) {
                            if ( thisModeOfTransportationName === 'Bus' ) {
                                return 1.5;
                            } else {
                                return Object.keys(d.vehicle).indexOf('vehicle_speed') > -1 ? 1 + Math.sqrt(d.vehicle.vehicle_speed) : 3;
                            }
                        })
                        .attr('cy', function (d) {return yScale(d.vehicle.vehicle_lat);})
                        .attr('cx', function (d) {return xScale(d.vehicle.vehicle_lon);});
                
                tripCircles.exit() // exit selection
                    .transition().duration(3000)
                        .attr('class', 'exit')
                        .attr('cy', Math.random() * canvasHeight)
                        .attr('cx', -1.1 * canvasWidth)
                        .attr('r', 30)
                        .remove(); 
                
                tripTexts.enter()  // enter selection
                    .append('text')
                    .attr('id', function (d) {return thisRouteDirectionClass + d.trip_id + '_text'})
                    .attr('class', 'enter')
                    .attr('x', 0.01 * canvasWidth)
                    .attr('y', 0.05 * canvasHeight)
                    .text(function (d) {return thisRouteName + ' ' + thisDirectionName + ' to ' + d.trip_headsign;})
                    .attr('text-width', 0.2 * canvasWidth)
                    .style('font-size', 0.03 * canvasHeight)
                    .style('fill', thisRouteColor);
                
                tripTexts.exit().remove();  //exit selection
                
                for (var iTrips = 0; iTrips < thisDirectionTrips.length; iTrips++) {
            
                    var thisTrip = thisDirectionTrips[iTrips],
                        thisTripLat = thisTrip.vehicle.vehicle_lat,
                        thisTripLon = thisTrip.vehicle.vehicle_lon, 
                        thisTripId = thisTrip.trip_id,
                        tripPath = canvas.select('path.' + thisRouteDirectionClass + thisTripId);

                    if (tripPath.empty()) {  // if trip doesn't have a path associated yet

                        var newTripPath = canvas.append('path')
                                                .attr('class', thisRouteDirectionClass + thisTripId)
                                                .attr('id', thisRouteDirectionClass + thisTripId + '_path')
                                                .style('stroke', thisRouteColor)
                                                .style('fill', 'rgba(0,0,0,0)')  // transparent fill
                                                .style('stroke-width', thisModeOfTransportationName === 'Bus'? 1 : 3)
                                                .style('stroke-opacity', 0.3);

                        newTripPath.datum([{'vehicle_lat': thisTripLat,   // add first data point
                                            'vehicle_lon': thisTripLon}]);
                        
                        newTripPath.attr('d', 'M' + xScale(thisTripLon) + ',' + yScale(thisTripLat));

                    } else {  // if path already exists

                        tripPath.datum()
                                .push({'vehicle_lat': thisTripLat,   // add new data point
                                        'vehicle_lon': thisTripLon});

                        tripPath.transition().duration(3000).delay(1500)
                            .attrTween('d', pathTween(pathFunction(tripPath.datum()), 4));
                        
                    }
                }        
            }
        }
    }
}

function getVehicles(routes, callbackFunction) {
    
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

function getRoutes(data) {

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
}

function pollMbtaRoutes(callbackFunction) {
    
    var apiUrl = 'http://realtime.mbta.com/developer/api/v2/routes',
        apiKey = 'wX9NwuHnZU2ToO7GmGR9uw',//wX9NwuHnZU2ToO7GmGR9uw',4iS91ICFhEW6N3lGBVgU9g
        getParams = {api_key: apiKey, format: 'json'},
        promise = $.getJSON(apiUrl, getParams, callbackFunction)
                    .fail(function () {
                        console.log('Couldn\'t access API with key ' + apiKey);
                    });
    
    return promise;
}

function drawVehicleDots(data, canvas) {
    
    var routeList = getRoutes(data);
    
    function drawDotsInPositionsOnCanvas (data) {
        drawDotsForVehicles(data, canvas);
    }
    
    getVehicles(routeList, drawDotsInPositionsOnCanvas);    
    
}

function mbtaLive(svgCanvas) {
    
    // Wrapper abstraction to run the fun
    
    function drawVehicleDotsOnCanvas (data) {
        
        drawVehicleDots(data, svgCanvas);
        
    }
    
    function recursiveMbtaLive () {
        setTimeout(function() {
            mbtaLive(svgCanvas);
            $('.timer').removeClass('started');
        }, 30000);
    }
    
    function countDown (startTime, $obj) {
        var newTime = startTime - 1;
        
        $obj.text(newTime);
        
        if (newTime > 0) {
            setTimeout(function () {
                countDown($obj.text(), $obj);
            }, 1000);
        }
    }
    
    pollMbtaRoutes(drawVehicleDotsOnCanvas)
        .done(function () {
            countDown(30, $('.counter'));
            $('.timer').addClass('started');
        })
        .done(recursiveMbtaLive);
}

function setupSvgCanvas(container, thisClass, bgColor) {
    
    var containerWidth = $(container).width(),
        containerHeight = $(container).height(),
        svgCanvas = d3.select(container).append('svg')
                        .attr('class', thisClass)
                        .style('width', containerWidth)
                        .style('height', containerHeight)
                        .style('background-color', bgColor);
    
    return svgCanvas;
    
}

function main() {
    
    var windowWidth = $(window).width(),
        windowHeight = $(window).height(),
        mbtaLiveContainer = '.mbta-live',
        backgroundColor = 'rgb(222, 222, 222)',
        svgCanvasClass = 'mbta-map',
        mbtaLiveCanvas = setupSvgCanvas(mbtaLiveContainer, svgCanvasClass, backgroundColor),
        homeUrl = 'http://eachanjohnson.com';
    
    mbtaLive(mbtaLiveCanvas);
    
    $('.byline a').attr('href', homeUrl);
    $('.byline').click(function(){        
        window.open(homeUrl);
    })
}

// run after page loaded
$(document).ready(main);
