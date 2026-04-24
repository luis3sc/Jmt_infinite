const fs = require('fs');
const file = 'src/components/map/MapViewClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateStr = `
  const [filters, setFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    district: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
  });

  const [activeFilters, setActiveFilters] = useState({
    audience: null as number | null,
    mediaType: "",
    district: "",
    minPrice: null as number | null,
    maxPrice: null as number | null,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
`;

content = content.replace(
  'const [searchQuery, setSearchQuery] = useState("");',
  'const [searchQuery, setSearchQuery] = useState("");\n' + stateStr
);

// 2. Add Filter Functions and Component
const filterMethodsStr = `
  const applyFilters = () => {
    setActiveFilters(filters);
    // On mobile, close it. On desktop, we can leave it open
    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) fetchStructuresInBounds(bounds);
    }
  };

  const resetFilters = () => {
    const empty = { audience: null, mediaType: "", district: "", minPrice: null, maxPrice: null };
    setFilters(empty);
    setActiveFilters(empty);
    if (mapRef.current) {
      const bounds = mapRef.current.getMap().getBounds();
      if (bounds) setTimeout(() => fetchStructuresInBounds(bounds), 0);
    }
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Filter size={18} /> Filtros</h3>
        <button onClick={resetFilters} className="text-xs text-muted-foreground underline hover:text-foreground">Limpiar</button>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tipo de Medio</label>
        <select 
          value={filters.mediaType} 
          onChange={e => setFilters({...filters, mediaType: e.target.value})}
          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Todos los tipos</option>
          <option value="Estática">Estática</option>
          <option value="Digital">Digital</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Distrito</label>
        <input 
          type="text" 
          value={filters.district}
          onChange={e => setFilters({...filters, district: e.target.value})}
          placeholder="Ej: Miraflores"
          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Rango de Precio Diario (S/)</label>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={filters.minPrice || ''}
            onChange={e => setFilters({...filters, minPrice: e.target.value ? Number(e.target.value) : null})}
            placeholder="Min"
            className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">-</span>
          <input 
            type="number" 
            value={filters.maxPrice || ''}
            onChange={e => setFilters({...filters, maxPrice: e.target.value ? Number(e.target.value) : null})}
            placeholder="Max"
            className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Alcance Mínimo (Audiencia)</label>
        <input 
          type="number" 
          value={filters.audience || ''}
          onChange={e => setFilters({...filters, audience: e.target.value ? Number(e.target.value) : null})}
          placeholder="Ej: 50000"
          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <button 
        onClick={applyFilters}
        className="w-full bg-[#62ae40] text-white py-3 rounded-xl font-bold mt-4 hover:bg-[#62ae40]/90 transition-all active:scale-95 shadow-md"
      >
        Aplicar Filtros
      </button>
    </div>
  );
`;

content = content.replace(
  'const handleLocationSearch = async (query: string) => {',
  filterMethodsStr + '\n  const handleLocationSearch = async (query: string) => {'
);

// 3. Update fetchStructuresInBounds
const oldFetchContent = `
    // ── Cache check ────────────────────────────────────────────────────────
    const cached = getCached(sw.lat, sw.lng, ne.lat, ne.lng, page);
    if (cached) {
      const total = cached.count;
      setTotalCount(total);
      setCurrentPage(page);
      setHasMore(from + cached.data.length < total);
      if (page === 0) {
        setStructures(cached.data as Structure[]);
        if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
      } else {
        setStructures(prev => [...prev, ...(cached.data as Structure[])]);
      }
      // Still mark loading as done in case it was triggered mid-flight
      setIsLoading(false);
      setIsLoadingMore(false);
      return; // ✅ cache hit — no network request
    }

    // ── Cache miss: fetch from Supabase ────────────────────────────────────
    if (page === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const { data, error, count } = await supabase
        .from("structures")
        .select(
          \`id, code, address, district, reference, latitude, longitude,
          panels (id, panel_code, face, media_type, format, daily_price, photo_url, audience, width, height, traffic_view)\`,
          { count: "exact" }
        )
        .gte("latitude", sw.lat)
        .lte("latitude", ne.lat)
        .gte("longitude", sw.lng)
        .lte("longitude", ne.lng)
        .range(from, to);

      if (error) throw error;
      if (data) {
        const total = count ?? 0;

        // Write to cache before updating state
        setCached(sw.lat, sw.lng, ne.lat, ne.lng, page, data, total);
`;

const newFetchContent = `
    // ── Cache check ────────────────────────────────────────────────────────
    const cached = getCached(sw.lat, sw.lng, ne.lat, ne.lng, page, activeFilters);
    if (cached) {
      const total = cached.count;
      setTotalCount(total);
      setCurrentPage(page);
      setHasMore(from + cached.data.length < total);
      if (page === 0) {
        setStructures(cached.data as Structure[]);
        if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
      } else {
        setStructures(prev => [...prev, ...(cached.data as Structure[])]);
      }
      // Still mark loading as done in case it was triggered mid-flight
      setIsLoading(false);
      setIsLoadingMore(false);
      return; // ✅ cache hit — no network request
    }

    // ── Cache miss: fetch from Supabase ────────────────────────────────────
    if (page === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const isPanelFiltering = activeFilters.audience || activeFilters.mediaType || activeFilters.minPrice || activeFilters.maxPrice;
      const relation = isPanelFiltering ? "panels!inner" : "panels";

      let query = supabase
        .from("structures")
        .select(
          \`id, code, address, district, reference, latitude, longitude,
          \${relation} (id, panel_code, face, media_type, format, daily_price, photo_url, audience, width, height, traffic_view)\`,
          { count: "exact" }
        )
        .gte("latitude", sw.lat)
        .lte("latitude", ne.lat)
        .gte("longitude", sw.lng)
        .lte("longitude", ne.lng);

      if (activeFilters.district) {
        query = query.ilike("district", \`%\${activeFilters.district}%\`);
      }
      if (activeFilters.audience) {
        query = query.gte(\`\${relation}.audience\`, activeFilters.audience);
      }
      if (activeFilters.mediaType) {
        query = query.eq(\`\${relation}.media_type\`, activeFilters.mediaType);
      }
      if (activeFilters.minPrice) {
        query = query.gte(\`\${relation}.daily_price\`, activeFilters.minPrice);
      }
      if (activeFilters.maxPrice) {
        query = query.lte(\`\${relation}.daily_price\`, activeFilters.maxPrice);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      if (data) {
        const total = count ?? 0;

        // Write to cache before updating state
        setCached(sw.lat, sw.lng, ne.lat, ne.lng, page, data, total, activeFilters);
`;

content = content.replace(oldFetchContent, newFetchContent);
content = content.replace('const fetchStructuresInBounds = useCallback(async (bounds: any, page = 0) => {', 'const fetchStructuresInBounds = useCallback(async (bounds: any, page = 0) => {\n');
// Fix dependency array
content = content.replace('}, []);', '}, [activeFilters]);');

// 4. Update top bar filter icon on desktop
const oldTopBarActions = `        {/* Right Actions (Desktop only) */}
        <div className="hidden md:flex items-center gap-3">
          <button className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-full text-foreground transition-colors">
            <User size={18} />
          </button>
        </div>`;
        
const newTopBarActions = `        {/* Right Actions (Desktop only) */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={\`p-2.5 rounded-full transition-colors \${isFilterOpen ? 'bg-[#62ae40] text-white border border-[#62ae40]' : 'bg-muted/50 hover:bg-muted border border-border text-foreground'}\`}
          >
            <Filter size={18} />
          </button>
          <button className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-full text-foreground transition-colors">
            <User size={18} />
          </button>
        </div>`;
content = content.replace(oldTopBarActions, newTopBarActions);

// 5. Update bottom navbar for mobile to open modal
content = content.replace(
`<button 
              className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter size={20} />`,
`<button 
              onClick={() => setIsFilterOpen(true)}
              className={\`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors \${isFilterOpen ? 'text-[#62ae40]' : 'text-muted-foreground hover:text-foreground'}\`}
            >
              <Filter size={20} />`
);

// 6. Update map layout and insert Right Panel
const oldRightMap = `      {/* RIGHT PANEL: Map */}
      <div className={\`flex-1 relative h-full \${activeTab === "map" ? "block" : "hidden md:block"}\`}>`;
      
const newRightMap = `      {/* MIDDLE PANEL: Map */}
      <div className={\`flex-1 relative h-full \${activeTab === "map" ? "block" : "hidden md:block"}\`}>`;

content = content.replace(oldRightMap, newRightMap);

// The map closes with </div>. Find it after the loading indicator
// We will replace the entire bottom part before \`{/* SIDE PANEL / MODAL\` to inject the desktop filter panel and mobile modal
const insertPointStr = `{/* SIDE PANEL / MODAL (Mobile full-screen, Desktop right-side) */}`;

const panelsToInsert = `
      {/* DESKTOP FILTER PANEL */}
      <div 
        className={\`hidden md:flex flex-col bg-background border-l border-border transition-all duration-300 ease-in-out z-20 
        \${isFilterOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden border-none"}\`}
      >
        <div className="w-[300px] lg:w-[350px] h-full overflow-y-auto">
          <FilterContent />
        </div>
      </div>

      {/* MOBILE FILTER MODAL */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[200] bg-background flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-lg font-bold text-foreground">Filtros</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <FilterContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      ${insertPointStr}`;

content = content.replace(insertPointStr, panelsToInsert);

fs.writeFileSync(file, content);
console.log('Done!');
