export type LabisAssetActor = "et" | "ms" | "mom" | "prop";

export type LabisAssetRegistry = Record<LabisAssetActor, Record<string, string>>;

const labisActors: LabisAssetRegistry = {
  et: {
    idle: "assets/labis/et-idle.png",
    ride_nervous: "assets/labis/et-motor-nervous.png",
    ride: "assets/labis/et-motor-riding.png",
    ride_happy: "assets/labis/et-motor-happy.png",
    look_back_happy: "assets/labis/et-motor-lookback.png",
    phone: "assets/labis/et-phone.png",
    photo_smug: "assets/labis/et-photo-smugs.png",
    haircut_happy: "assets/labis/et-haircut.png",
    sitting_reading: "assets/labis/et-filter-manual.png"
  },
  ms: {
    idle: "assets/labis/ms-idle.png",
    hold_motor: "assets/labis/ms-hold-motor.png",
    follow: "assets/labis/ms-follow.png",
    release: "assets/labis/ms-release.png",
    watch: "assets/labis/ms-watch.png",
    confused: "assets/labis/ms-confuse.png",
    holding_book: "assets/labis/book-with-ms-photos.png"
  },
  mom: {
    sitting: "assets/labis/mom-filter-manual.png"
  },
  prop: {
    chicken_porridge: "assets/labis/chicken-porridge.png",
    fried_noodles: "assets/labis/fried-noodles.png",
    badminton: "assets/labis/badminton.png",
    filter_manual_table: "assets/labis/table-filter-manual.png"
  }
};

export const labisAssetManifest = {
  actors: labisActors,
  chickenCake: "assets/labis/chicken-cake-easter-egg.png"
};

export const labisProductionAssetPaths = [
  ...Object.values(labisAssetManifest.actors).flatMap((group) => Object.values(group)),
  labisAssetManifest.chickenCake
];

export function labisAssetPath(actor: LabisAssetActor, pose: string): string | undefined {
  return labisAssetManifest.actors[actor][pose];
}
