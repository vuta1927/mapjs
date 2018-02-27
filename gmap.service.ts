import { Injectable } from '@angular/core';
import { Constants } from 'app/constants';
import { forEach } from '@angular/router/src/utils/collection';
import { GMap } from '../models/Map';
import { Road, Coordinate, MetaData } from '../models/Road';
import { UtilityService } from '../../core/services/utility.service';
import { FormsModule } from '@angular/forms';
import { Handler } from 'tapable';
declare let google: any;
let GLOBAL = {
    snapPoints: [],
    GmapService: null,
    isSnapEnable: false,
    oldMarker: null,
    isRoadsTableEnable: false,
    gmapTimer: null
};
@Injectable()
export class GmapService {
    directionsDisplay: any;
    directionsService: any;
    polyroadroutes = [];
    routeMarkersLatLng = [];
    routeMarkers = [];
    geocoder: any;
    gmap: GMap;
    drawMode = {
        Default: false,
        SnapMode: true
    };
    currentRoad: Road;
    Popup: any;
    inforWindows = [];
    directionResponses: any; // bien luu tru 2 tuyen duong kha thi giua 2 toa do
    constructor(private utilityService: UtilityService) { }

    public initGoogleMap(obj) {
        this.gmap = obj;

        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();

        this.gmap.controller = new google.maps.Map(document.getElementById('gmap'), {
            center: { lat: 21.027884, lng: 105.833974 },
            zoom: 5,
            disableDefaultUI: true

        });
        let bounds = new google.maps.LatLngBounds();
        this.gmap.roads.forEach(road => {
            bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
            bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
        });
        this.gmap.controller.fitBounds(bounds);
        GLOBAL.GmapService = this;

        let mother = this;
        this.gmap.controller.addListener('click', function (event) {
            if (!GLOBAL.isSnapEnable) {
                for (let i = 0; i < mother.routeMarkers.length; i++) {
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
        this.gmap.roads.forEach(road => {
            this.drawRoute(road, this.drawMode.Default);
        });
        this.gmap.controller.setOptions({ draggableCursor: 'default' });
        this.initPanelControl();
    }

    private initPanelControl() {
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('btnShowDetail'));
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-ctrl1'));
        this.gmap.controller.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('gmap-ctrl2'));


        document.getElementById('gmap-resetView').addEventListener('click', function () {
            let bounds = new google.maps.LatLngBounds();
            GLOBAL.GmapService.gmap.roads.forEach(road => {
                bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
            });
            GLOBAL.GmapService.routeMarkers.forEach(marker => {
                marker.setMap(null);
            });
            GLOBAL.GmapService.gmap.controller.fitBounds(bounds);
            var table = document.getElementById("gmapRoadsTable");
            for (var i = 0, row; row = table.rows[i]; i++) {
                row.style.backgroundColor = '#fff';
            }
        });


        var setPointControl = document.getElementById('gmap-setPoint');

        if (this.gmap.editMode) {
            document.getElementById('gmap-setPoint').style.display = 'block';
        } else {
            document.getElementById('gmap-setPoint').style.display = 'none';
        }
        setPointControl.addEventListener('click', function (event) {
            if (GLOBAL.isSnapEnable) {
                GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'default' });
                GLOBAL.isSnapEnable = false;
                return;
            }
            GLOBAL.isSnapEnable = true;
            GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'crosshair' });
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
                let marker = new google.maps.Marker({
                    position: event.latLng,
                    map: GLOBAL.GmapService.gmap.controller,
                    title: '(lat: ' + event.latLng.lat() + '; lng: ' + event.latLng.lng() + ')'
                });
                GLOBAL.GmapService.routeMarkers.push(marker);
                if (marker) {
                    GLOBAL.snapPoints.push(event.latLng);
                    if (GLOBAL.snapPoints.length == 2) {
                        GLOBAL.isSnapEnable = false;

                        GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'default' });
                        let newRoad = new Road(
                            GLOBAL.GmapService.polyroadroutes.length + 1,
                            [
                                new Coordinate(GLOBAL.snapPoints[0].lat(), GLOBAL.snapPoints[0].lng()),
                                new Coordinate(GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lat(), GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lng())
                            ],
                            0,
                            "",
                            new MetaData()
                        );
                        GLOBAL.GmapService.gmap.roads.push(newRoad);
                        var loading = document.getElementById('map-wait');
                        loading.innerHTML = "<p><b><font size='4'>map processing, please wait for a moment ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                        GLOBAL.GmapService.drawRoute(newRoad, GLOBAL.GmapService.drawMode.SnapMode);
                        GLOBAL.snapPoints = [];
                    }
                }
            }
            // GLOBAL.GmapService.createMaker('(lat: '+event.latLng.lat()+'; lng: '+event.latLng.lng()+')', event.latLng);
        });


        document.getElementById('gmap-ctrl1').style.display = 'none';
        var buttonControl = document.getElementById('btnShowDetail');
        var searchPanel = document.getElementById('gmap-searchPanel');

        var mother = this;
        buttonControl.addEventListener('click', function () {
            if (!GLOBAL.isRoadsTableEnable) {
                let gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'block';
                GLOBAL.isRoadsTableEnable = true;
            } else {
                let gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'none';
                GLOBAL.isRoadsTableEnable = false;
            }
        });

        var resultContext = document.createElement('p');
        resultContext.id = 'gmap-resultsCount';
        resultContext.innerText = 'Search results: 0';
        resultContext.style.fontWeight = 'bold';
        resultContext.style.fontSize = '11pt';
        resultContext.style.marginTop = '10px';
        resultContext.style.marginBottom = '10px';
        searchPanel.appendChild(resultContext);

        document.getElementById('gmap-txtSearch').addEventListener("keyup", function (event) {
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
                if (!val) {
                    document.getElementById('gmap-resultsCount').innerText = 'Search results: 0';
                    return;
                } else if (val == '*') val = '';
                var roads = GLOBAL.GmapService.gmap.roads;
                for (var i = 0; i < roads.length; i++) {
                    if (roads[i].id == val || (roads[i].metaData.direction && roads[i].metaData.direction.indexOf(val) != -1) || roads[i].distance == val) {
                        results.push(roads[i]);
                    }
                }
                document.getElementById('gmap-resultsCount').innerText = 'Search results: ' + results.length;
                if (results.length < 1) {
                    document.getElementById('gmap-resultsCount').innerText = 'Search results: 0';
                    return;
                }
                var th1 = document.createElement('th');
                th1.innerHTML = "Id";
                theadEl.appendChild(th1);
                var th2 = document.createElement('th');
                th2.innerHTML = "Id";
                theadEl.appendChild(th2);
                th2.innerHTML = "Direction";
                theadEl.appendChild(th2);
                results.forEach(road => {
                    let newRow = tbody.insertRow(tbody.rows.length - 1);
                    newRow.insertCell(0).innerHTML = String(road.id);
                    newRow.insertCell(1).innerHTML = String(road.metaData.direction);

                    newRow.addEventListener('click', function (event) {
                        //console.log(road.id);
                        var table = document.getElementById("gmapRoadsTable");
                        for (var i = 0, row; row = table.rows[i]; i++) {
                            row.style.backgroundColor = '#fff';
                        }
                        this.style.backgroundColor = '#ddd';
                        let bounds = new google.maps.LatLngBounds();
                        for (let latLng of road.paths) {
                            bounds.extend(latLng);
                        }
                        var polyroutes = GLOBAL.GmapService.polyroadroutes;
                        polyroutes.forEach(route => {
                            var id = route.get('id');
                            if (id == road.id) {
                                GLOBAL.GmapService.routeMarkers.forEach(marker => {
                                    marker.setMap(null);
                                });
                                for (var i = 0; i < road.paths.length; i++) {
                                    if (i == 0 || i == road.paths.length - 1) {
                                        let mark = GLOBAL.GmapService.createMaker('', new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng), road, mother.gmap.editMode);
                                        mark.addListener('click', function () {
                                            mother.showInfoWindow('', road, mark, { latLng: new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng) });
                                        });
                                        mother.routeMarkers.push(mark);
                                    }
                                }
                                var rndNumber = Math.floor((Math.random() * (road.paths.length - 2)) + 1);
                                var latLngs = { latLng: new google.maps.LatLng(road.paths[rndNumber].lat, road.paths[rndNumber].lng) };
                                GLOBAL.GmapService.showInfoWindow(``, road, false, latLngs);
                            }
                        });


                        GLOBAL.GmapService.gmap.controller.fitBounds(bounds);
                    }
                    )
                });
                // resultsControl.innerHTML = results;
            }, ms);
        });

    }
    private drawRoute(road: Road, isSnapMode) {
        if (!isSnapMode) {
            this.shortenAndShow(false, road);
        } else {
            let destCoodrs = [
                new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng),
                new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng)
            ];
            let waypts = [];
            destCoodrs.forEach(coodr => {
                waypts.push({ location: coodr, stopover: true });
            });

            this.directionsDisplay.setMap(this.gmap.controller);
            let request = {
                origin: destCoodrs[0],
                destination: destCoodrs[destCoodrs.length - 1],
                waypoints: waypts,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            let mother = this;
            setTimeout(() => {
                this.directionsService.route(request, function (response, status) {
                    mother.directionsearch(response, status, destCoodrs, road);
                });
            }, 1000);
        }
    }

    private directionsearch(response: any, status: string, destCoodrs: Array<any>, road: Road) {
        let mother = this;
        if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            console.log("OVER_QUERY_LIMIT");
            setTimeout(() => {
                mother.drawRoute(road, mother.drawMode.SnapMode);
            }, 1000);
        } else {
            if (status == google.maps.DirectionsStatus.OK) {
                let currentResponses = [];
                for (var i = 0; i < mother.directionResponses.length; i++) {
                    if (mother.directionResponses[i].id == road.id) {
                        currentResponses.push(mother.directionResponses[i]);
                    }
                }
                if (currentResponses.length < 2) {
                    mother.directionResponses.push({ id: road.id, response: response });
                    currentResponses.push({ id: road.id, response: response });
                    if (currentResponses.length < 2) {
                        let newPaths = [];
                        for (var i = road.paths.length - 1; i >= 0; i--) {
                            newPaths.push(road.paths[i]);
                        }
                        setTimeout(() => {
                            mother.drawRoute(new Road(road.id, newPaths, 0, road.color, road.metaData), mother.drawMode.SnapMode);
                        }, 10);
                    } else {
                        let distance1: number = currentResponses[0].response.routes[0].legs[1].distance.value;
                        let distance2: number = currentResponses[1].response.routes[0].legs[1].distance.value;
                        let correctRoadResponse: any;
                        if (distance1 < distance2) {
                            road.distance = distance1;
                            correctRoadResponse = currentResponses[0].response;
                        } else {
                            road.distance = distance2;
                            correctRoadResponse = currentResponses[1].response;
                        }
                        mother.directionResponses = [];
                        //let duration = parseFloat(response.routes[0].legs[0].duration.value / 3600).toFixed(2);

                        let route_latlngs: string;
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
    }

    private shortenAndShow(overview_pathlatlngs: any, road: Road) {
        let perimeterPoints = Array();
        //loop through each leg of the route
        if (overview_pathlatlngs) {
            var loading = document.getElementById('map-wait');
            loading.innerHTML = "";
            for (let marker of this.routeMarkers) {
                marker.setMap(null);
            }
            this.routeMarkers = [];
            this.routeMarkersLatLng = [];
            road.paths = [];
            for (let i = 0; i < overview_pathlatlngs.length; i++) {
                let lat = overview_pathlatlngs[i].lat;
                if (typeof lat !== "number") {
                    lat = overview_pathlatlngs[i].lat();
                }
                let lng = overview_pathlatlngs[i].lng;
                if (typeof lng !== "number") {
                    lng = overview_pathlatlngs[i].lng();
                }

                road.paths.push(new Coordinate(lat, lng));
                if (i == 0 || i == overview_pathlatlngs.length - 1) {
                    this.routeMarkersLatLng.push({ roadId: road.id, latLng: new google.maps.LatLng(lat, lng) });
                    let marker = this.createMaker('', new google.maps.LatLng(lat, lng), road, this.gmap.editMode);
                    this.routeMarkers.push(marker);
                }
                perimeterPoints.push(new google.maps.LatLng(lat, lng));
            }
        } else {
            road.paths.forEach(path => {
                perimeterPoints.push(new google.maps.LatLng(path.lat, path.lng));
            });
        }
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
        if(!isExist){
            this.gmap.roads.push(road);
        }
        let color: string;
        if (road.color == "") {
            color = this.utilityService.getRandomColor();
        } else {
            color = road.color;
        }
        let polyroadroute = new google.maps.Polyline({
            path: perimeterPoints,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.7,
            strokeWeight: 6
        });
        polyroadroute.set("id", road.id);
        let mother = this;
        polyroadroute.addListener('click', function (event) {
            let bounds = new google.maps.LatLngBounds();

            mother.routeMarkers.forEach(marker => {
                marker.setMap(null);
            });
            this.routeMarkers = [];
            if (overview_pathlatlngs) {
                mother.routeMarkersLatLng.forEach(marker => {
                    if (marker.roadId == road.id) {
                        let mark = mother.createMaker('', marker.latLng, road, mother.gmap.editMode);
                        mark.addListener('click', function () {
                            mother.showInfoWindow('', road, mark, marker);
                        });
                        bounds.extend(marker.latLng);
                        mother.routeMarkers.push(mark);
                    }
                });
            } else {
                for (var i = 0; i < road.paths.length; i++) {
                    if (i == 0 || i == (road.paths.length - 1)) {
                        let mark = mother.createMaker('', new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng), road, mother.gmap.editMode);
                        mark.addListener('click', function () {
                            mother.showInfoWindow('', road, mark, { latLng: new google.maps.LatLng(road.paths[i - 1].lat, road.paths[i - 1].lng) });
                        });
                        mother.routeMarkers.push(mark);
                    }
                }
                bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));

            }
            mother.showInfoWindow(``, road, false, event);
            mother.gmap.controller.fitBounds(bounds);
        });
        polyroadroute.setMap(this.gmap.controller);
        //add to the array of road routes
        this.polyroadroutes.push(polyroadroute);
    }
    private showDetailPanel(road: Road, position: any) {

    }
    private showInfoWindow(text, road, marker, markerLatLng) {
        let str: string;
        let mother = this;
        this.geocoder.geocode({
            'latLng': markerLatLng.latLng
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    if (marker)
                        str = `<p>${text}<br><b>Lat: </b>${markerLatLng.latLng.lat()}<br><b>Lng: </b>${markerLatLng.latLng.lng()}<br><b>Location: </b>${results[0].formatted_address}</p>`;
                    else
                        str = `<b>Id:</b> ${road.id}<br><p><b>long</b>: ${road.distance} m<br><b>Location</b>: ${results[0].formatted_address}<br><b>Direction: </b>${road.metaData.direction}<br></p>`;

                    let infowindow = new google.maps.InfoWindow({
                        content: str
                    });
                    if (marker) infowindow.open(mother.gmap.controller, marker);
                    else {
                        for (var infoWin of mother.inforWindows) {
                            infoWin.setMap(null);
                        }
                        infowindow.setPosition(markerLatLng.latLng);
                        infowindow.open(mother.gmap.controller);
                        mother.inforWindows.push(infowindow);
                    }
                }
            }
        });
    }

    private createMaker(text: string, latlng: any, road: Road, isDraggable: boolean) {
        let marker = new google.maps.Marker({
            position: latlng,
            draggable: isDraggable,
            map: this.gmap.controller,
            title: text
        });
        marker.set("road", road);
        if (this.gmap.editMode) {
            marker.addListener('dragstart', function (event) {
                let lat = event.latLng.lat();
                let lng = event.latLng.lng();
                GLOBAL.oldMarker = new google.maps.LatLng(lat, lng);
                for (var infoWin of GLOBAL.GmapService.inforWindows) {
                    infoWin.setMap(null);
                }
            })
            marker.addListener('dragend', function (event) {
                for (var infoWin of GLOBAL.GmapService.inforWindows) {
                    infoWin.setMap(null);
                }
                let road = marker.get('road');
                let oldLatLng = GLOBAL.oldMarker;
                let oldLat = Math.round(oldLatLng.lat() * 100000) / 100000;
                let oldLng = Math.round(oldLatLng.lng() * 100000) / 100000;
                let newLat = event.latLng.lat();
                let newLng = event.latLng.lng();

                for (var i = 0; i < road.paths.length; i++) {
                    let lat = Math.round(road.paths[i].lat * 100000) / 100000;
                    let lng = Math.round(road.paths[i].lng * 100000) / 100000;
                    if (lat == oldLat && lng == oldLng) {
                        road.paths[i].lat = newLat;
                        road.paths[i].lng = newLng;
                        GLOBAL.oldMarker = null;
                        break;
                    }
                }
                var loading = document.getElementById('wait');
                loading.innerHTML = "<p><b><font size='4'>map processing, please wait ...</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                for (let polyroute of GLOBAL.GmapService.polyroadroutes) {
                    let id = polyroute.get('id');
                    if (id == road.id) {
                        polyroute.setMap(null);
                    }
                }
                GLOBAL.GmapService.drawRoute(road, true);
            })

        }
        return marker;
    }
}