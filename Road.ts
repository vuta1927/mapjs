interface IRoad {
    id: number;
    color: string;
    metaData: MetaData;
}

export class Road implements IRoad {
    constructor(public id: number, public paths: Coordinate[], public distance: number, public color: string, public metaData: MetaData) {
        this.paths = paths;
        this.distance = distance;
    }
}

interface ICoordinate{
    lat: number;
    lng: number;
}

interface IMetaData{
    name: string;
    direction: string;
}
export class MetaData{
    constructor(public name?, public direction?){}
}
export class Coordinate implements ICoordinate{
    constructor(public lat: number, public lng: number){}
}