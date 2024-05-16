export interface OSRMResponse {
    waypoints: Waypoint[]
    routes: Route[]
    code: string
  }
  
  export interface Waypoint {
    name: string
    location: number[]
    distance: number
    hint: string
  }
  
  export interface Route {
    distance: number
    duration: number
    geometry: string
    weight_name: string
    weight: number
    legs: Leg[]
  }
  
  export interface Leg {
    distance: number
    duration: number
    weight: number
    summary: string
    steps: any[]
  }
  