import { Base, FlightData } from './types';
import { doubleSeaterAircraft } from './constants';
import Decoder from './decoder';
// import { vtsToJson } from './vtsToJson';

// Define types for various entities


// Define the FlightPlanner class
class FlightPlanner {
    private mapData: string | null = null;
    private missionData: string | null = null;
    private decoder: Decoder = new Decoder();

    loadData(missionData: ArrayBuffer, mapData: ArrayBuffer): void {
        this.mapData = this.readContentWithDecoder(mapData);
        this.missionData = this.readContentWithDecoder(missionData);
        // console.log(JSON.stringify(vtsToJson(this.missionData)));
    }

    private readContentWithDecoder(fileContent: ArrayBuffer): string {
        // Convert ArrayBuffer to Uint8Array for binary decoding
        const contentAsUint8Array = new Uint8Array(fileContent);

        // Decode the content with your binary decoder
        if (contentAsUint8Array[contentAsUint8Array.length - 1] === 0x62) { // Assuming 'b' at the end indicates binary
            return this.decoder.decodeVtlb(contentAsUint8Array); // Adjust as needed for decoding
        } else {
            return new TextDecoder().decode(contentAsUint8Array); // Fallback to text decoding
        }
    }

    parseMissionData(): { mission_name: string } {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }
        const match = this.missionData.match(/campaignID\s*=\s*(.+)/);
        return {
            mission_name: match ? match[1] : 'Unknown Mission'
        };
    }

    parseMapData(): { terrain_type: string } {
        if (!this.mapData) {
            throw new Error('Map data is not loaded.');
        }
        const match = this.mapData.match(/biome\s*=\s*(\w+)/);
        return {
            terrain_type: match ? match[1] : 'Unknown Terrain'
        };
    }

    extractUnits(team: string): Set<string> {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }

        // Step 1: Extract the UNITS block (assuming it ends before PATHS)
        const unitsBlockMatch = this.missionData.match(/UNITS\s*\{([\s\S]*?)\}\s*PATHS/);

        if (!unitsBlockMatch) {
            console.log('No UNITS block found.');
            return new Set<string>();
        }

        const unitsBlock = unitsBlockMatch[1];

        // Step 2: Extract UnitSpawner blocks from within the UNITS block
        const spawnerPattern = /UnitSpawner\s*\{([\s\S]*?)(?:UnitSpawner|}\s*PATHS)/gs;
        const spawners = [...unitsBlock.matchAll(spawnerPattern)];

        const units = new Set<string>();

        for (const spawner of spawners) {
            const unitNameMatch = spawner[1].match(/unitName\s*=\s*(.+?)[;\n]/);
            const unitFieldsMatch = spawner[1].match(/UnitFields\s*\{([\s\S]*?)\}/);

            // Ensure we have unitName and UnitFields block
            if (unitNameMatch && unitFieldsMatch) {
                const unitName = unitNameMatch[1].trim();
                const unitFields = unitFieldsMatch[1];

                // Now extract the unitGroup from within the UnitFields block
                const unitGroupMatch = unitFields.match(/unitGroup\s*=\s*(.+?)[;\n]/);

                // Check if unitGroup is found and is not null
                if (unitGroupMatch) {
                    const unitGroup = unitGroupMatch[1].toLowerCase();
                    // Add the unit to the respective team set based on unitGroup
                    if (team === 'ally' && unitGroup.includes('allied')) {
                        units.add(unitName);
                    } else if (team === 'enemy' && unitGroup.includes('enemy')) {
                        units.add(unitName);
                    }
                }
            }
        }
        return units;
    }

    suggestArmament(enemyUnits: Set<string>): string[] {
        const armament: string[] = [];

        if ([...enemyUnits].some(unit => unit.toLowerCase().includes('tank') || unit.toLowerCase().includes('ship'))) {
            armament.push('LGB');
        }

        if (enemyUnits.has('ASF-30') || enemyUnits.has('MQ-31')) {
            armament.push('RDR AAM', 'IR AAM');
        }

        if ([...enemyUnits].some(unit => unit.toLowerCase().includes('infantry'))) {
            armament.push('DUMB');
        }

        if ([...enemyUnits].some(unit => unit.toLowerCase().includes('radar') || unit.toLowerCase().includes('launcher'))) {
            armament.push('ARM', 'AGM', 'GPS');
        }

        return armament;
    }

    parseWaypoints(): [number, number][] {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }
        const waypointPattern = /waypoint\s*=\s*\(([\d.]+),\s*([\d.]+)\)/g;
        const waypoints: [number, number][] = [];
        let match;
        while ((match = waypointPattern.exec(this.missionData)) !== null) {
            waypoints.push([parseFloat(match[1]), parseFloat(match[2])]);
        }
        return waypoints;
    }

    extractObjectives(): string[] {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }
        const objectivePattern = /scenarioDescription\s*=\s*(.*)/g;
        const matches = [...this.missionData.matchAll(objectivePattern)];
        return matches.map(match => match[1].trim());
    }

    extractBases(): Base[] {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }

        const basesPattern = /BASES\s*\{([\s\S]*?)\}\s*GlobalValues/g;
        const basesSection = basesPattern.exec(this.missionData);

        if (!basesSection) {
            console.log('No bases section found.');
            return [];
        }

        const baseInfoPattern = /BaseInfo\s*\{([\s\S]*?)\}/g;
        const matches = [...basesSection[1].matchAll(baseInfoPattern)];
        const bases: Base[] = [];

        for (const baseMatch of matches) {
            // Modify the regex to stop capturing the name once 'baseTeam' is encountered
            const nameMatch = /overrideBaseName\s*=\s*(.*?)\s*baseTeam/.exec(baseMatch[1]);
            const teamMatch = /baseTeam\s*=\s*([A-Za-z]+)/.exec(baseMatch[1]);
            const idMatch = /id\s*=\s*(\d+)/.exec(baseMatch[1]);

            // If no name is found, default to 'Unknown Base'
            const name = nameMatch ? nameMatch[1].trim() : 'Unknown Base';
            const team = teamMatch ? teamMatch[1].trim() : 'Unknown Team';
            const id = idMatch ? idMatch[1].trim() : 'Unknown ID';

            // Push the properly formatted base info
            bases.push({ name: name || 'Unknown Base', team, id });
        }

        return bases;
    }

    extractBriefingNotes(): string[] {
        if (!this.missionData) {
            throw new Error('Mission data is not loaded.');
        }

        const briefingPattern = /Briefing\s*\{([\s\S]*?)\}\s*Briefing_B/g;
        const briefingSection = briefingPattern.exec(this.missionData);

        if (!briefingSection) {
            console.log('No briefing section found.');
            return [];
        }

        const briefingNotesPattern = /(?:text\s*=\s*(.+)|\{text\}\s*=\s*\{(.+?)\})/g;
        const matches = [...briefingSection[1].matchAll(briefingNotesPattern)];
        const briefingNotes: string[] = [];

        for (const match of matches) {
            let text = (match[1] || match[2] || '').replace('///n', '\n').trim();
            text = text.replace(/imagePath\s*=\s*.*\n?/, '').replace(/audioClipPath\s*=\s*.*\n?/, '');
            if (text) {
                briefingNotes.push(text);
            }
        }

        return briefingNotes;
    }

    generateFlightPlan(): FlightData {
        // const mapInfo = this.parseMapData();
        const missionInfo = this.parseMissionData();

        const aircraftMatch = this.missionData?.match(/vehicle\s*=\s*(.+)/);
        const aircraft = aircraftMatch ? aircraftMatch[1] : 'unknown';

        const alliedUnits = this.extractUnits('ally');
        const enemyUnits = this.extractUnits('enemy');

        const objectives = this.extractObjectives();
        const briefing = this.extractBriefingNotes();
        const bases = this.extractBases();

        const armament = this.suggestArmament(enemyUnits).join(', ');
        const fuel = '5000';  // Placeholder value

        const baseList: Base[] = bases.map(base => ({
            id: base.id,
            name: base.name,
            team: base.team,
        }));

        return {
            mission_name: missionInfo.mission_name,
            flight_date: new Date().toDateString().toUpperCase(),
            aircraft,
            release_time: new Date().toTimeString().substring(0, 5).replace(':', ''),
            double_seater: doubleSeaterAircraft.includes(aircraft),
            armament,
            fuel,
            objectives,
            briefing,
            allied_units: Array.from(alliedUnits).map(unit => ({ name: unit })),
            enemy_units: Array.from(enemyUnits).map(unit => ({ name: unit })),
            bases: baseList,
        };
    }
}

export { FlightPlanner };