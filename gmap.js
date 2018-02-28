var Road = /** @class */ (function () {
    function Road(id, paths, distance, color, metaData) {
        this.id = id;
        this.paths = paths;
        this.distance = distance;
        this.color = color;
        this.metaData = metaData;
        this.paths = paths;
        this.distance = distance;
    }
    return Road;
}());

var MetaData = /** @class */ (function () {
    function MetaData(name, direction, icons) {
        this.name = name;
        this.direction = direction;
        this.icons = icons;
    }
    return MetaData;
}());

var Coordinate = /** @class */ (function () {
    function Coordinate(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
    return Coordinate;
}());

var GMap = /** @class */ (function () {
    function GMap(id, type, roads, controller, editMode) {
        this.id = id;
        this.type = type;
        this.roads = roads;
        this.controller = controller;
        this.editMode = editMode;
        this.controller = controller;
    }
    return GMap;
}());

var GLOBAL = {
    snapPoints: [],
    GmapService: null,
    isSnapEnable: false,
    oldMarker: null,
    isRoadsTableEnable: false,
    gmapTimer: null,
    addIconPoint: false,
};
var GmapService = /** @class */ (function () {
    function GmapService() {
        this.polyroadroutes = [];
        this.routeMarkersLatLng = [];
        this.routeMarkers = [];
        this.drawMode = {
            Default: false,
            SnapMode: true
        };
        this.inforWindows = [];
        this.description = [];
        this.cameraIcon = 'https://cdn3.iconfinder.com/data/icons/wpzoom-developer-icon-set/500/41-20.png';
    }
    GmapService.prototype.initGoogleMap = function (obj) {
        var _this = this;
        this.gmap = JSON.parse(obj);
        this.gmap.controller = new google.maps.Map(document.getElementById('gmap'), {
            center: {
                lat: 21.027884,
                lng: 105.833974
            },
            zoom: 5,
            gestureHandling: 'greedy',
            // disableDefaultUI: true
        });
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        if (this.gmap.roads.length > 0) {
            var bounds = new google.maps.LatLngBounds();
            this.gmap.roads.forEach(function (road) {
                bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
            });
            // this.gmap.controller.fitBounds(bounds);
            var temp = bounds.getCenter();
            this.gmap.controller.setCenter(temp);
            this.gmap.controller.setZoom(17);
        }

        GLOBAL.GmapService = this;
        var mother = this;
        this.gmap.controller.addListener('click', function (event) {
            if (!GLOBAL.isSnapEnable) {
                for (var i = 0; i < mother.routeMarkers.length; i++) {
                    mother.routeMarkers[i].setMap(null);
                }
            }
            for (var i = 0; i < mother.inforWindows.length; i++) {
                mother.inforWindows[i].setMap(null);
            }
        });
        this.geocoder = new google.maps.Geocoder();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsDisplay.setMap(this.gmap.controller);
        this.directionResponses = [];
        this.gmap.roads.forEach(function (road) {
            _this.drawRoute(road, _this.drawMode.Default);
        });
        this.gmap.controller.setOptions({
            draggableCursor: 'default'
        });
        this.initPanelControl();
    };
    GmapService.prototype.setCenter = function (lat, lng) {
        this.gmap.controller.setOptions({
            center: {
                lat,
                lng
            }
        });
    }
    GmapService.prototype.initPanelControl = function () {
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-btnShowDetail'));
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-ctrl1'));
        this.gmap.controller.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('gmap-ctrl2'));
        this.gmap.controller.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('gmap-ctrl3'));
        this.gmap.controller.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('gmap-description'));

        if (this.description.length < 1) {
            document.getElementById('gmap-description').style.display = 'none';
        }
        document.getElementById('gmap-resetView').addEventListener('click', function () {
            var bounds = new google.maps.LatLngBounds();
            GLOBAL.GmapService.gmap.roads.forEach(function (road) {
                bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
            });
            GLOBAL.GmapService.routeMarkers.forEach(function (marker) {
                marker.setMap(null);
            });
            // GLOBAL.GmapService.gmap.controller.fitBounds(bounds);
            var temp = bounds.getCenter();
            GLOBAL.GmapService.gmap.controller.setCenter(temp);
            GLOBAL.GmapService.gmap.controller.setZoom(17);
            var table = document.getElementById("gmapRoadsTable");
            for (var i = 0, row; row = table.rows[i]; i++) {
                row.style.backgroundColor = '#fff';
            }
            GLOBAL.GmapService.inforWindows.forEach(function (infoWin) {
                infoWin.setMap(null);
            })
        });
        var mother = this;
        
        document.getElementById('gmap-ctrl3').style.display = 'none';
        var addIconPointControl = document.getElementById('gmap-addIconPoint');
        if(!this.gmap.editMode){
            addIconPointControl.style.display = 'none';
        }
        addIconPointControl.addEventListener('click', function () {
            if (!GLOBAL.addIconPoint) {
                GLOBAL.addIconPoint = true;
                document.getElementById('gmap-ctrl3').style.display = 'block';
                document.getElementById('gmap-ctrl3').innerHTML = `<p><strong>Please click on route where you want to add icon ...</strong></p>`;
            } else {
                document.getElementById('gmap-ctrl3').style.display = 'none';
                document.getElementById('gmap-ctrl3').innerHTML = ``;
                GLOBAL.addIconPoint = false;
            }
        })

        var setPointControl = document.getElementById('gmap-setPoint');
        if (this.gmap.editMode) {
            document.getElementById('gmap-setPoint').style.display = 'block';
        } else {
            document.getElementById('gmap-setPoint').style.display = 'none';
        }
        setPointControl.addEventListener('click', function (event) {
            if (GLOBAL.isSnapEnable) {
                GLOBAL.GmapService.gmap.controller.setOptions({
                    draggableCursor: 'default'
                });
                GLOBAL.isSnapEnable = false;
                return;
            }
            GLOBAL.isSnapEnable = true;
            GLOBAL.GmapService.gmap.controller.setOptions({
                draggableCursor: 'crosshair'
            });
        });
        this.gmap.controller.addListener('click', function (event) {
            var table = document.getElementById("gmapRoadsTable");
            for (var i = 0, row; row = table.rows[i]; i++) {
                row.style.backgroundColor = '#fff';
            }
            if (!GLOBAL.isSnapEnable) {
                return;
            }
            if (GLOBAL.snapPoints.length < 2) {
                var marker = new google.maps.Marker({
                    position: event.latLng,
                    map: GLOBAL.GmapService.gmap.controller,
                    title: '(lat: ' + event.latLng.lat() + '; lng: ' + event.latLng.lng() + ')'
                });
                GLOBAL.GmapService.routeMarkers.push(marker);
                if (marker) {
                    GLOBAL.snapPoints.push(event.latLng);
                    if (GLOBAL.snapPoints.length == 2) {
                        GLOBAL.isSnapEnable = false;
                        GLOBAL.GmapService.gmap.controller.setOptions({
                            draggableCursor: 'default'
                        });
                        var newRoad = new Road(GLOBAL.GmapService.polyroadroutes.length + 1, [
                            new Coordinate(GLOBAL.snapPoints[0].lat(), GLOBAL.snapPoints[0].lng()),
                            new Coordinate(GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lat(), GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lng())
                        ], 0, "", new MetaData());
                        GLOBAL.GmapService.gmap.roads.push(newRoad);
                        var loading = document.getElementById('gmap-wait');
                        loading.innerHTML = "<p><b><font size='2'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                        GLOBAL.GmapService.drawRoute(newRoad, GLOBAL.GmapService.drawMode.SnapMode);
                        GLOBAL.snapPoints = [];
                    }
                }
            }
            // GLOBAL.GmapService.createMaker('(lat: '+event.latLng.lat()+'; lng: '+event.latLng.lng()+')', event.latLng);
        });
        document.getElementById('gmap-ctrl1').style.display = 'none';
        var buttonControl = document.getElementById('gmap-btnShowDetail');
        var searchPanel = document.getElementById('gmap-searchPanel');
        var mother = this;
        buttonControl.addEventListener('click', function () {
            if (!GLOBAL.isRoadsTableEnable) {
                var gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'block';
                GLOBAL.isRoadsTableEnable = true;
            } else {
                var gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'none';
                GLOBAL.isRoadsTableEnable = false;
            }
        });
        var resultContext = document.createElement('p');
        resultContext.id = 'gmap-resultsCount';
        resultContext.style.fontWeight = 'bold';
        resultContext.style.fontSize = '11pt';
        resultContext.style.marginTop = '10px';
        resultContext.style.marginBottom = '10px';
        resultContext.align = 'center';
        searchPanel.appendChild(resultContext);
        mother.bindingTable(GLOBAL.GmapService.gmap.roads);

        if (!window.matchMedia('screen and (max-width: 768px)').matches) {
            var gmapControl = document.getElementById('gmap-ctrl1');
            document.getElementById("gmap-searchPanel").style.width = '300px';
            document.getElementById("gmapRoadTableDiv").style.width = '300px';
            gmapControl.style.display = 'block';
            GLOBAL.isRoadsTableEnable = true;
        }
        document.getElementById('gmap-btnSearchEraser').addEventListener("click", function (event) {
            var table = document.getElementById('gmapRoadsTable');
            table.style.cursor = 'pointer';
            var theadEl = table.getElementsByTagName('thead')[0];
            var tbody = table.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            theadEl.innerHTML = '';
            document.getElementById('gmap-txtSearch').value = '';
            mother.bindingTable(mother.gmap.roads);
        });
        document.getElementById('gmap-btnSearch').addEventListener("click", function (event) {
            document.getElementById('gmap-resultsCount').innerHTML = "Searching ...... <img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='25' width='25'>";
            var results = [];
            var table = document.getElementById('gmapRoadsTable');
            table.style.cursor = 'pointer';
            var theadEl = table.getElementsByTagName('thead')[0];
            var tbody = table.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            theadEl.innerHTML = '';
            var val = document.getElementById('gmap-txtSearch').value;
            var proads = mother.gmap.roads;
            if (!val) {
                results = proads;
            } else {
                for (var i = 0; i < proads.length; i++) {
                    if (proads[i].metaData.direction.value.indexOf(val) != -1 || proads[i].metaData.direction.display.indexOf(val) != -1) {
                        results.push(proads[i]);
                    }
                }
                if (results.length < 1) {
                    document.getElementById('gmap-resultsCount').innerHTML = "No result found.";

                    return;
                }
            }
            mother.bindingTable(results);
        });
        document.getElementById('gmap-txtSearch').addEventListener("keyup", function (event) {
            var table = document.getElementById('gmapRoadsTable');
            table.style.cursor = 'pointer';
            var theadEl = table.getElementsByTagName('thead')[0];
            var tbody = table.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            theadEl.innerHTML = '';
            document.getElementById('gmap-resultsCount').innerHTML = "Searching ...... <img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='25' width='25'>";
            clearTimeout(GLOBAL.gmapTimer);
            var ms = 1000; // milliseconds
            var val = document.getElementById('gmap-txtSearch').value;
            GLOBAL.gmapTimer = setTimeout(function () {
                var results = [];
                var table = document.getElementById('gmapRoadsTable');
                table.style.cursor = 'pointer';
                var theadEl = table.getElementsByTagName('thead')[0];
                var tbody = table.getElementsByTagName('tbody')[0];
                tbody.innerHTML = '';
                theadEl.innerHTML = '';

                var roads = GLOBAL.GmapService.gmap.roads;
                if (!val) {
                    results = roads;
                } else {
                    for (var i = 0; i < roads.length; i++) {
                        if (roads[i].metaData.direction.value.indexOf(val) != -1 || roads[i].metaData.direction.display.indexOf(val) != -1) {
                            results.push(roads[i]);
                        }
                    }
                    if (results.length < 1) {
                        document.getElementById('gmap-resultsCount').innerHTML = "No result found.";

                        return;
                    }
                }
                mother.bindingTable(results);
            }, ms);
        });
    };

    GmapService.prototype.addDescription = function (src, text) {
        this.description.push({
            icon: src,
            desc: text
        });
        var desControl = document.getElementById('gmap-description');
        desControl.style.display = 'block';
        desControl.style.fontSize = '14px';
        desControl.innerHTML = `${this.description.map(d => `&nbsp<a style="font-size:14px">
        <img src=${d.icon} width="15" height="15"> 
        </a>${d.desc}`)}
        `;
    }
    GmapService.prototype.bindingTable = function (data) {
        var resultContext = document.getElementById('gmap-resultsCount');
        resultContext.innerHTML = '';
        var table = document.getElementById('gmapRoadsTable');
        table.style.cursor = 'pointer';
        var theadEl = table.getElementsByTagName('thead')[0];
        var tbody = table.getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        var th1 = document.createElement('th');
        th1.innerHTML = '';
        th1.width = '40px';
        theadEl.appendChild(th1);
        var th2 = document.createElement('th');
        // th2.innerHTML = "Direction";
        theadEl.appendChild(th2);
        var mother = this;
        data.forEach(function (road) {
            var newRow = tbody.insertRow(tbody.rows.length);

            newRow.insertCell(0).innerHTML = '<img id="detail-icon-img" src="https://cdn1.iconfinder.com/data/icons/free-98-icons/32/map-marker-20.png" alt="map, marker icon" width="20" height="20">';
            newRow.insertCell(1).innerHTML = String(road.metaData.direction.display);
            newRow.cells[0].align = 'center';
            newRow.cells[0].vAlign = 'middle';
            newRow.addEventListener('click', function (event) {
                //console.log(road.id);
                var table = document.getElementById("gmapRoadsTable");
                for (var i = 0, row; row = table.rows[i]; i++) {
                    row.style.backgroundColor = '#fff';
                }
                this.style.backgroundColor = '#ddd';
                var bounds = new google.maps.LatLngBounds();
                for (var j = 0, path = road.paths; j < path.length; j++) {
                    var latLng = path[j];
                    bounds.extend(latLng);
                }
                var polyroutes = GLOBAL.GmapService.polyroadroutes;
                polyroutes.forEach(function (route) {
                    var id = route.get('id');
                    if (id == road.id) {
                        GLOBAL.GmapService.routeMarkers.forEach(function (marker) {
                            marker.setMap(null);
                        });
                        if (mother.editMode) {
                            var _loop_1 = function () {
                                if (i == 0 || i == road.paths.length - 1) {
                                    var mark = GLOBAL.GmapService.createMaker('', new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng), road, mother.gmap.editMode);
                                    mark.addListener('click', function () {
                                        mother.showInfoWindow('', road, mark, {
                                            latLng: new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng)
                                        });
                                    });
                                    mother.routeMarkers.push(mark);
                                }
                            };
                            for (var i = 0; i < road.paths.length; i++) {
                                _loop_1();
                            }
                        }

                        var rndNumber = Math.floor((Math.random() * (road.paths.length - 2)) + 1);
                        var latLngs = {
                            latLng: new google.maps.LatLng(road.paths[rndNumber].lat, road.paths[rndNumber].lng)
                        };
                        GLOBAL.GmapService.showInfoWindow("", road, false, latLngs);
                    }
                });
                // GLOBAL.GmapService.gmap.controller.fitBounds(bounds);
                var temp = bounds.getCenter();
                GLOBAL.GmapService.gmap.controller.setCenter(temp);
                GLOBAL.GmapService.gmap.controller.setZoom(17);
            });
        });
    }
    GmapService.prototype.drawRoute = function (road, isSnapMode) {
        var _this = this;
        if (!isSnapMode) {
            this.shortenAndShow(false, road);
        } else {
            var destCoodrs = [
                new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng),
                new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng)
            ];
            var waypts = [];
            destCoodrs.forEach(function (coodr) {
                waypts.push({
                    location: coodr,
                    stopover: true
                });
            });
            this.directionsDisplay.setMap(this.gmap.controller);
            var request = {
                origin: destCoodrs[0],
                destination: destCoodrs[destCoodrs.length - 1],
                waypoints: waypts,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            var mother = this;
            setTimeout(function () {
                _this.directionsService.route(request, function (response, status) {
                    mother.directionsearch(response, status, destCoodrs, road);
                });
            }, 1000);
        }
    };
    GmapService.prototype.directionsearch = function (response, status, destCoodrs, road) {
        var mother = this;
        if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            console.log("OVER_QUERY_LIMIT");
            setTimeout(function () {
                mother.drawRoute(road, mother.drawMode.SnapMode);
            }, 1000);
        } else {
            if (status == google.maps.DirectionsStatus.OK) {
                var currentResponses = [];
                for (var i = 0; i < mother.directionResponses.length; i++) {
                    if (mother.directionResponses[i].id == road.id) {
                        currentResponses.push(mother.directionResponses[i]);
                    }
                }
                if (currentResponses.length < 2) {
                    mother.directionResponses.push({
                        id: road.id,
                        response: response
                    });
                    currentResponses.push({
                        id: road.id,
                        response: response
                    });
                    if (currentResponses.length < 2) {
                        var newPaths = [];
                        for (var i = road.paths.length - 1; i >= 0; i--) {
                            newPaths.push(road.paths[i]);
                        }
                        setTimeout(function () {
                            mother.drawRoute(new Road(road.id, newPaths, 0, road.color, road.metaData), mother.drawMode.SnapMode);
                        }, 10);
                    } else {
                        var distance1 = currentResponses[0].response.routes[0].legs[1].distance.value;
                        var distance2 = currentResponses[1].response.routes[0].legs[1].distance.value;
                        var correctRoadResponse = void 0;
                        if (distance1 < distance2) {
                            road.distance = distance1;
                            correctRoadResponse = currentResponses[0].response;
                        } else {
                            road.distance = distance2;
                            correctRoadResponse = currentResponses[1].response;
                        }
                        mother.directionResponses = [];
                        //let duration = parseFloat(response.routes[0].legs[0].duration.value / 3600).toFixed(2);
                        var route_latlngs = void 0;
                        if (correctRoadResponse.routes) {
                            route_latlngs = correctRoadResponse.routes[0].overview_path;
                        } else {
                            route_latlngs = JSON.parse(correctRoadResponse);
                        }
                        mother.shortenAndShow(route_latlngs, road);
                    }
                }
            } else {
                if (status == "NOT_FOUND" || status == "ZERO_RESULTS") {
                    console.log("Route NOT_FOUND, so shortenAndTryAgain");
                }
            }
        }
    };
    GmapService.prototype.shortenAndShow = function (overview_pathlatlngs, road) {
        var perimeterPoints = Array();
        //loop through each leg of the route
        if (overview_pathlatlngs) {
            var loading = document.getElementById('gmap-wait');
            loading.innerHTML = "";
            for (var i = 0, _a = this.routeMarkers; i < _a.length; i++) {
                var marker = _a[i];
                marker.setMap(null);
            }
            this.routeMarkers = [];
            this.routeMarkersLatLng = [];
            road.paths = [];
            for (var j = 0; j < overview_pathlatlngs.length; j++) {
                var lat = overview_pathlatlngs[j].lat;
                if (typeof lat !== "number") {
                    lat = overview_pathlatlngs[j].lat();
                }
                var lng = overview_pathlatlngs[j].lng;
                if (typeof lng !== "number") {
                    lng = overview_pathlatlngs[j].lng();
                }
                road.paths.push(new Coordinate(lat, lng));
                if (j == 0 || j == overview_pathlatlngs.length - 1) {
                    this.routeMarkersLatLng.push({
                        roadId: road.id,
                        latLng: new google.maps.LatLng(lat, lng)
                    });
                    var marker = this.createMaker('', new google.maps.LatLng(lat, lng), road, this.gmap.editMode);
                    this.routeMarkers.push(marker);
                }
                perimeterPoints.push(new google.maps.LatLng(lat, lng));
            }
        } else {
            road.paths.forEach(function (path) {
                perimeterPoints.push(new google.maps.LatLng(path.lat, path.lng));
            });
        }

        if (!road.metaData.direction) {
            this.geocoder.geocode({
                'latLng': perimeterPoints[0]
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        var newDirect = {
                            display: results[0].formatted_address,
                            value: results[0].formatted_address
                        };
                        road.metaData.direction = newDirect;
                    }
                }
            });
        }


        var color;
        if (road.color == "") {
            color = this.getRandomColor();
        } else {
            color = road.color;
        }
        var polyroadroute = new google.maps.Polyline({
            path: perimeterPoints,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.7,
            strokeWeight: 6
        });
        polyroadroute.set("id", road.id);
        var mother = this;
        polyroadroute.addListener('click', function (event) {
            if (GLOBAL.addIconPoint) {
                // var symbolOne = {
                //     path: 'M 0 6 L 0 26 L 24 26 L 24 19 L 32 23 L 32 9 L 24 13 L 24 6 Z',
                //     fillColor: '#000',
                //     strokeColor: '#000',
                //     scale: 0.5,
                //     fillOpacity: 1,
                //     anchor: new google.maps.Point(17, 17)
                // };
                if (!road.metaData.icons) {
                    road.metaData.icons = [];
                }
                var image = {
                    anchor: new google.maps.Point(10, 10), //16: center of 32x32 image
                    origin: new google.maps.Point(0, 0),
                    scaledSize: new google.maps.Size(20, 20),
                    size: new google.maps.Size(20, 20),
                    url: mother.cameraIcon
                };
                GLOBAL.addIconPoint = false;
                mother.routeMarkers.forEach(marker => {
                    marker.setMap(null);
                });
                var iconMark = new google.maps.Marker({
                    position: event.latLng,
                    draggable: true,
                    map: mother.gmap.controller,
                    icon: image,
                    // anchor: new google.maps.Point(5, 30)
                });
                iconMark.addListener('click', function (event) {
                    var lat = event.latLng.lat();
                    var lng = event.latLng.lng();
                    mother.showInfoWindow('', road, this, event);
                })
                document.getElementById('gmap-ctrl3').innerHTML = '';
                document.getElementById('gmap-ctrl3').style.display = 'none';
            } else {
                var bounds = new google.maps.LatLngBounds();
                mother.routeMarkers.forEach(function (marker) {
                    marker.setMap(null);
                });
                this.routeMarkers = [];
                if (overview_pathlatlngs) {
                    mother.routeMarkersLatLng.forEach(function (marker) {
                        if (marker.roadId == road.id) {
                            var mark = mother.createMaker('', marker.latLng, road, mother.gmap.editMode);
                            mark.addListener('click', function () {
                                mother.showInfoWindow('', road, mark, marker);
                            });
                            bounds.extend(marker.latLng);
                            mother.routeMarkers.push(mark);
                        }
                    });
                    overview_pathlatlngs = null;
                } else {
                    if (mother.gmap.editMode) {
                        var mark1 = mother.createMaker('', new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng), road, mother.gmap.editMode);
                        mark1.addListener('click', function () {
                            mother.showInfoWindow('', road, mark1, {
                                latLng: new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng)
                            });
                        });
                        var mark2 = mother.createMaker('', new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng), road, mother.gmap.editMode);
                        mark2.addListener('click', function () {
                            mother.showInfoWindow('', road, mark2, {
                                latLng: new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng)
                            });
                        });
                        mother.routeMarkers.push(mark1);
                        mother.routeMarkers.push(mark2);
                    }
                }
                mother.showInfoWindow("", road, false, event);
                // bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                // bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
                // // mother.gmap.controller.fitBounds(bounds);
                // var temp = bounds.getCenter();
                // mother.gmap.controller.setCenter(temp);
                // mother.gmap.controller.setZoom(17);
            }

        });
        var roadIds = [];
        for (var i = 0; i < this.gmap.roads.length; i++) {
            roadIds.push(this.gmap.roads[i].id);
            if (this.gmap.roads[i].id == road.id) {
                this.gmap.roads[i] = road;
            }
        }
        var isExist = false;
        for (var i = 0; i < roadIds.length; i++) {
            if (roadIds[i] == road.id) {
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            this.gmap.roads.push(road);

        }
        polyroadroute.setMap(this.gmap.controller);
        //add to the array of road routes
        this.polyroadroutes.push(polyroadroute);
        setTimeout(function () {
            var table = document.getElementById('gmapRoadsTable');
            table.style.cursor = 'pointer';
            var theadEl = table.getElementsByTagName('thead')[0];
            var tbody = table.getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            theadEl.innerHTML = '';
            document.getElementById('gmap-resultsCount').innerHTML = "Searching ...... <img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='25' width='25'>";
            mother.bindingTable(mother.gmap.roads);
        }, 500);
    };

    GmapService.prototype.showDetailPanel = function (road, position) {};
    GmapService.prototype.showInfoWindow = function (text, road, marker, markerLatLng) {
        var str;
        var mother = this;
        this.geocoder.geocode({
            'latLng': markerLatLng.latLng
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    var newDirect = {
                        display: results[0].formatted_address,
                        value: results[0].formatted_address
                    };
                    road.metaData.direction = newDirect;
                    if (marker)
                        str = "<p>" + text + "<br><b>Lat: </b>" + markerLatLng.latLng.lat() + "<br><b>Lng: </b>" + markerLatLng.latLng.lng() + "<br><b>Location: </b>" + results[0].formatted_address + "</p>";
                    else
                        str = " <b>Location</b>: " + results[0].formatted_address + "<br><b>Direction: </b>" + road.metaData.direction.display + "<br></p>";
                    var infowindow = new google.maps.InfoWindow({
                        content: str
                    });
                    if (marker)
                        infowindow.open(mother.gmap.controller, marker);
                    else {
                        for (var _i = 0, _a = mother.inforWindows; _i < _a.length; _i++) {
                            var infoWin = _a[_i];
                            infoWin.setMap(null);
                        }
                        infowindow.setPosition(markerLatLng.latLng);
                        infowindow.open(mother.gmap.controller);
                    }
                    mother.inforWindows.push(infowindow);
                }
            }
        });
    };
    GmapService.prototype.createMaker = function (text, latlng, road, isDraggable) {
        var marker = new google.maps.Marker({
            position: latlng,
            draggable: isDraggable,
            map: this.gmap.controller,
            title: text
        });
        marker.set("road", road);
        if (this.gmap.editMode) {
            marker.addListener('dragstart', function (event) {
                var lat = event.latLng.lat();
                var lng = event.latLng.lng();
                GLOBAL.oldMarker = new google.maps.LatLng(lat, lng);
                for (var _i = 0, _a = GLOBAL.GmapService.inforWindows; _i < _a.length; _i++) {
                    var infoWin = _a[_i];
                    infoWin.setMap(null);
                }
            });
            marker.addListener('dragend', function (event) {
                for (var _i = 0, _a = GLOBAL.GmapService.inforWindows; _i < _a.length; _i++) {
                    var infoWin = _a[_i];
                    infoWin.setMap(null);
                }
                var road = marker.get('road');
                var oldLatLng = GLOBAL.oldMarker;
                var oldLat = Math.round(oldLatLng.lat() * 100000) / 100000;
                var oldLng = Math.round(oldLatLng.lng() * 100000) / 100000;
                var newLat = event.latLng.lat();
                var newLng = event.latLng.lng();
                for (var i = 0; i < road.paths.length; i++) {
                    var lat = Math.round(road.paths[i].lat * 100000) / 100000;
                    var lng = Math.round(road.paths[i].lng * 100000) / 100000;
                    if (lat == oldLat && lng == oldLng) {
                        road.paths[i].lat = newLat;
                        road.paths[i].lng = newLng;
                        GLOBAL.oldMarker = null;
                        break;
                    }
                }
                var loading = document.getElementById('gmap-wait');
                loading.innerHTML = "<p><b><font size='4'>map processing, please wait ...</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                for (var _b = 0, _c = GLOBAL.GmapService.polyroadroutes; _b < _c.length; _b++) {
                    var polyroute = _c[_b];
                    var id = polyroute.get('id');
                    if (id == road.id) {
                        polyroute.setMap(null);
                    }
                }
                GLOBAL.GmapService.drawRoute(road, true);
            });
        }
        return marker;
    };
    GmapService.prototype.getRandomInt = function (start, end) {
        return Math.floor(Math.random() * end) + start;
    }
    GmapService.prototype.getRandomColor = function () {
        return '#' + (this.pad(this.getRandomInt(0, 255).toString(16), 2) + this.pad(this.getRandomInt(0, 255).toString(16), 2) + this.pad(this.getRandomInt(0, 255).toString(16), 2));
    }
    GmapService.prototype.pad = function (str, length) {
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }
    GmapService.prototype.getRandomNum = function (min, max) {
        return Math.random() * (max - min) + min;
    }
    GmapService.prototype.rad = function (x) {
        return x * Math.PI / 180;
    };

    GmapService.prototype.getDistance = function (p1, p2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = this.rad(p2.lat() - p1.lat());
        var dLong = this.rad(p2.lng() - p1.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(p1.lat())) * Math.cos(this.rad(p2.lat())) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };
    return GmapService;
}());