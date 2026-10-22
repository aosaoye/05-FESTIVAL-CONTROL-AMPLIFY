export type EventStatus = 'CONFIRMED' | 'DELAYED' | 'CANCELLED';
export type FestivalEvent = { id: string; artist: string; space: string; time: string; status: EventStatus };

export const initialEvents: FestivalEvent[] = [
  { id: 'EVT-101', artist: 'NEON WAVES', space: 'MAIN STAGE', time: '22:30', status: 'CONFIRMED' },
  { id: 'EVT-102', artist: 'MIDNIGHT SESSION', space: 'GARDEN', time: '23:15', status: 'DELAYED' },
  { id: 'EVT-103', artist: 'ELECTRIC SUNSET', space: 'MAIN STAGE', time: '20:15', status: 'CONFIRMED' },
  { id: 'EVT-104', artist: 'BASS THEORY', space: 'WAREHOUSE', time: '00:30', status: 'CONFIRMED' },
  { id: 'EVT-105', artist: 'LUNAR ECHO', space: 'RIVER STAGE', time: '21:00', status: 'CONFIRMED' },
  { id: 'EVT-106', artist: 'CYBER VELVET', space: 'GARDEN', time: '01:45', status: 'CANCELLED' },
];
