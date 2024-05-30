import type { QueueBasedActualEventsRaw, QueueBasedMergedEvents, QueueBasedPlannedEventsRaw } from '../../../../types/planning-board'

export function mergeEvents(plannedEvents: QueueBasedPlannedEventsRaw[], actualEvents: QueueBasedActualEventsRaw[]): QueueBasedMergedEvents[] {
  return [...plannedEvents, ...actualEvents]
}
