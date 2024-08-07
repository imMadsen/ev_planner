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

export async function get_route_data(latStart: number, lngStart: number, latEnd: number, lngEnd: number) {
    const coordinates = `${lngStart},${latStart};${lngEnd},${latEnd}`;
    const url = `http://127.0.0.1:5000/route/v1/driving/${coordinates}?exclude=ferry`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Check if the route is valid
        if (data.code !== 'Ok') {
            throw new Error(`Error in route response: ${data.message}`);
        }
        return data as OSRMResponse
    } catch (error) {
        throw new Error(`Error fetching the route:${error}`);
    }
}