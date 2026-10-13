import type { Room } from "../types/residence";
export const rooms: Room[] = [
{ number: 1, capacity: 2, occupants: 2, group: "B" }, { number: 2, capacity: 2, occupants: 1, group: "B" },
{ number: 3, capacity: 4, occupants: 3, group: "A" }, { number: 4, capacity: 4, occupants: 4, group: "C" },
{ number: 5, capacity: 6, occupants: 4, group: "D" },
];
export const student = { name: "Lucía Pérez", room: 1, group: "B", task: "Cocina" };
