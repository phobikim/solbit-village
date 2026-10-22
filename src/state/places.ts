// 보따리 스토어 (쉼터)

import { create } from 'zustand';

import { deletePlace, linkPlaceEvent, listPlaces, savePlace } from '../data/places';
import type { Place } from '../domain/rest';

type PlacesState = {
  places: Place[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (p: Place) => Promise<void>;
  remove: (id: string) => Promise<void>;
  linkEvent: (placeId: string, eventId: string) => Promise<void>;
};

export const usePlaces = create<PlacesState>((set, get) => ({
  places: [],
  loaded: false,
  async load() {
    set({ places: await listPlaces(), loaded: true });
  },
  async save(p) {
    await savePlace(p);
    await get().load();
  },
  async remove(id) {
    await deletePlace(id);
    await get().load();
  },
  async linkEvent(placeId, eventId) {
    await linkPlaceEvent(placeId, eventId);
    await get().load();
  },
}));
