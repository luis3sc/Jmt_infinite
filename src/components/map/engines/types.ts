export interface MapEngineProps {
  // Map ViewState
  longitude: number;
  latitude: number;
  zoom: number;

  // Event handlers
  onMove: (e: any) => void;
  onMoveEnd: (e: any) => void;
  onLoad: (e: any) => void;
  onIdle: (e: any) => void;

  // State & interaction
  filteredStructures: any[];
  activeDistrict: string | null;
  selectedStructure: any | null;
  hoveredStructureId: string | null;
  setHoveredStructureId: (id: string | null) => void;
  onSelectStructure: (structure: any) => void;
  calculateDisplayPrice: (structure: any) => number;
  selectedDistrictFeature: any;
}
