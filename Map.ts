import { Road } from "./Road";
export interface IMap{
    id: number;
    type: number;
    roads: Road[];
    editMode: boolean;
}

export class GMap implements IMap{
    constructor(public id: number, public type: number, public roads: Road[], public controller: any, public editMode: boolean){
        this.controller = controller;
    }
}