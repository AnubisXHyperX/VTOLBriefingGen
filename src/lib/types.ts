export interface Unit {
  name: string;
}

export interface Base {
  id: string;
  name: string;
  team: string;
}

export interface FlightData {
  mission_name: string;
  flight_date: string;
  aircraft: string;
  release_time: string;
  double_seater: boolean;
  armament: string;
  fuel: string;
  objectives: string[];
  briefing: string[];
  allied_units: Unit[];
  enemy_units: Unit[];
  bases: Base[];
}