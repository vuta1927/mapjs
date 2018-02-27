"use strict";
exports.__esModule = true;
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
exports.Road = Road;
var MetaData = /** @class */ (function () {
    function MetaData(name, direction) {
        this.name = name;
        this.direction = direction;
    }
    return MetaData;
}());
exports.MetaData = MetaData;
var Coordinate = /** @class */ (function () {
    function Coordinate(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
    return Coordinate;
}());
exports.Coordinate = Coordinate;
