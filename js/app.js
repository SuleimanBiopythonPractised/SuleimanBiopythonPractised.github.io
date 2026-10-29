/**
 * SuleimanBiopythonPractised - Main Application Controller
 * Handles UI interactions, search/filtering, and connects calculation engines.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  initSequenceStudio();
  initAlignerStudio();
  initANOVAStudio();
  init3DViewer();
  loadNotebooks();
  initObsidianViewer();
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const html = document.documentElement;

  const savedTheme = localStorage.getItem("sbp-theme") || "dark";
  html.setAttribute("data-theme", savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = html.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("sbp-theme", next);
    });
  }
}

/* ==========================================================================
   Mobile Navigation
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector(".mobile-nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });
  }
}

/* ==========================================================================
   Sequence Analysis Studio
   ========================================================================== */
function initSequenceStudio() {
  const seqInput = document.getElementById("dnaInput");
  const sampleBtns = document.querySelectorAll(".btn-sample-seq");
  const clearBtn = document.getElementById("clearSeqBtn");

  function runAnalysis() {
    if (!seqInput) return;
    const raw = seqInput.value;
    const clean = window.BioStudio.cleanSequence(raw);
    const result = window.BioStudio.analyzeSequence(clean);

    const lengthEl = document.getElementById("statLength");
    const gcEl = document.getElementById("statGC");
    const atEl = document.getElementById("statAT");
    const tmEl = document.getElementById("statTm");
    const mwEl = document.getElementById("statMW");

    const mrnaEl = document.getElementById("resMRNA");
    const revCompEl = document.getElementById("resRevComp");
    const proteinEl = document.getElementById("resProtein");

    if (!result) {
      if (lengthEl) lengthEl.textContent = "0 bp";
      if (gcEl) gcEl.textContent = "0.0%";
      if (atEl) atEl.textContent = "0.0%";
      if (tmEl) tmEl.textContent = "0.0°C";
      if (mwEl) mwEl.textContent = "0 kDa";
      if (mrnaEl) mrnaEl.textContent = "Enter sequence above to generate mRNA transcript...";
      if (revCompEl) revCompEl.textContent = "Enter sequence above to generate reverse complement...";
      if (proteinEl) proteinEl.textContent = "Enter sequence above to translate into amino acid protein...";
      return;
    }

    if (lengthEl) lengthEl.textContent = `${result.length.toLocaleString()} bp`;
    if (gcEl) gcEl.textContent = `${result.gcPercent}%`;
    if (atEl) atEl.textContent = `${result.atPercent}%`;
    if (tmEl) tmEl.textContent = `${result.tm}°C`;
    if (mwEl) mwEl.textContent = `${result.molWeightKDa} kDa`;

    if (mrnaEl) mrnaEl.textContent = result.mrna;
    if (revCompEl) revCompEl.textContent = result.revComp;
    if (proteinEl) proteinEl.textContent = result.protein;
  }

  if (seqInput) {
    seqInput.addEventListener("input", runAnalysis);
  }

  sampleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.sample;
      if (window.BioStudio.SAMPLE_SEQUENCES[type] && seqInput) {
        seqInput.value = window.BioStudio.SAMPLE_SEQUENCES[type];
        runAnalysis();
      }
    });
  });

  if (clearBtn && seqInput) {
    clearBtn.addEventListener("click", () => {
      seqInput.value = "";
      runAnalysis();
    });
  }

  // Initial run with sample
  if (seqInput && !seqInput.value) {
    seqInput.value = window.BioStudio.SAMPLE_SEQUENCES.insulin;
    runAnalysis();
  }
}

/* ==========================================================================
   Pairwise Dynamic Aligner
   ========================================================================== */
function initAlignerStudio() {
  const seq1Input = document.getElementById("alignSeq1");
  const seq2Input = document.getElementById("alignSeq2");
  const alignType = document.getElementById("alignTypeSelect");
  const runBtn = document.getElementById("runAlignBtn");
  const outputEl = document.getElementById("alignOutput");
  const scoreBadge = document.getElementById("alignScoreBadge");
  const pidBadge = document.getElementById("alignPidBadge");

  function runAlign() {
    if (!seq1Input || !seq2Input || !outputEl) return;
    const s1 = window.BioStudio.cleanSequence(seq1Input.value);
    const s2 = window.BioStudio.cleanSequence(seq2Input.value);

    if (!s1 || !s2) {
      outputEl.textContent = "Please provide both sequences to align.";
      return;
    }

    const isLocal = alignType ? alignType.value === "local" : false;
    const res = window.BioStudio.alignPairwise(s1, s2, isLocal);

    if (res) {
      if (scoreBadge) scoreBadge.textContent = `Score: ${res.score}`;
      if (pidBadge) pidBadge.textContent = `Identity: ${res.percentIdentity}% (${res.identical}/${res.length})`;

      // Format multiline wrapped blocks (60 chars per line)
      const lineLen = 60;
      let formatted = "";
      for (let i = 0; i < res.length; i += lineLen) {
        const chunk1 = res.strSeq1.substr(i, lineLen);
        const chunkM = res.strMatch.substr(i, lineLen);
        const chunk2 = res.strSeq2.substr(i, lineLen);

        formatted += `Seq1: ${chunk1}\n      ${chunkM}\nSeq2: ${chunk2}\n\n`;
      }
      outputEl.textContent = formatted;
    }
  }

  if (runBtn) {
    runBtn.addEventListener("click", runAlign);
  }

  // Default sequences
  if (seq1Input && seq2Input && !seq1Input.value) {
    seq1Input.value = "ATGCGATCGATCGATCGATCGATAGGCTAGCT";
    seq2Input.value = "ATGCGATCCATCGAGCGATCGATACGCTAGCT";
    runAlign();
  }
}

/* ==========================================================================
   Biostatistics ANOVA Studio
   ========================================================================== */
function initANOVAStudio() {
  const g1Input = document.getElementById("anovaG1");
  const g2Input = document.getElementById("anovaG2");
  const g3Input = document.getElementById("anovaG3");
  const g4Input = document.getElementById("anovaG4");
  const runBtn = document.getElementById("runAnovaBtn");

  function parseVals(text) {
    if (!text) return [];
    return text.split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
  }

  function executeANOVA() {
    const groups = [
      { name: "Control (Placebo)", values: parseVals(g1Input ? g1Input.value : "") },
      { name: "Drug A (10 mg)", values: parseVals(g2Input ? g2Input.value : "") },
      { name: "Drug B (50 mg)", values: parseVals(g3Input ? g3Input.value : "") },
      { name: "Drug C (100 mg)", values: parseVals(g4Input ? g4Input.value : "") }
    ].filter(g => g.values.length > 0);

    const res = window.StatsStudio.calculateOneWayANOVA(groups);
    if (!res) return;

    // Update ANOVA Summary Badges
    const fValEl = document.getElementById("anovaFVal");
    const pValEl = document.getElementById("anovaPVal");
    const etaEl = document.getElementById("anovaEtaVal");
    const sigBadge = document.getElementById("anovaSigBadge");

    if (fValEl) fValEl.textContent = res.fValue.toFixed(3);
    if (pValEl) pValEl.textContent = res.pValue < 0.001 ? "< 0.001" : res.pValue.toFixed(4);
    if (etaEl) etaEl.textContent = res.etaSquared.toFixed(3);
    
    if (sigBadge) {
      if (res.pValue < 0.05) {
        sigBadge.textContent = "Statistically Significant (Reject H₀)";
        sigBadge.className = "badge-pill badge-success";
      } else {
        sigBadge.textContent = "Fail to Reject H₀ (Not Significant)";
        sigBadge.className = "badge-pill badge-neutral";
      }
    }

    // Update ANOVA Table
    const tableBody = document.getElementById("anovaTableBody");
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td><strong>Between Groups (Treatment)</strong></td>
          <td>${res.ssBetween.toFixed(2)}</td>
          <td>${res.dfBetween}</td>
          <td>${res.msBetween.toFixed(2)}</td>
          <td><strong>${res.fValue.toFixed(3)}</strong></td>
          <td><span class="text-accent font-bold">${res.pValue < 0.001 ? "< 0.001" : res.pValue.toFixed(4)}</span></td>
        </tr>
        <tr>
          <td><strong>Within Groups (Residual / Error)</strong></td>
          <td>${res.ssWithin.toFixed(2)}</td>
          <td>${res.dfWithin}</td>
          <td>${res.msWithin.toFixed(2)}</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr class="row-total">
          <td><strong>Total Variance</strong></td>
          <td>${res.ssTotal.toFixed(2)}</td>
          <td>${res.dfTotal}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      `;
    }

    // Update Post-Hoc Tukey HSD Table
    const postHocBody = document.getElementById("tukeyTableBody");
    if (postHocBody) {
      postHocBody.innerHTML = res.pairwise.map(p => `
        <tr>
          <td>${p.comparison}</td>
          <td>${p.diff}</td>
          <td>${p.qValue}</td>
          <td><span class="badge-pill ${p.significant ? 'badge-success' : 'badge-neutral'}">${p.pBadge}</span></td>
        </tr>
      `).join("");
    }

    // Draw SVG Boxplot
    drawBoxPlot(res.groupStats);
  }

  function drawBoxPlot(groupStats) {
    const svg = document.getElementById("boxplotSvg");
    if (!svg || !groupStats || groupStats.length === 0) return;

    // Find global min and max
    let allVals = groupStats.flatMap(g => g.values);
    let minVal = Math.min(...allVals);
    let maxVal = Math.max(...allVals);
    let pad = (maxVal - minVal) * 0.1 || 5;
    let yMin = minVal - pad;
    let yMax = maxVal + pad;

    const width = 600;
    const height = 240;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    function scaleY(v) {
      return margin.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
    }

    const groupWidth = plotWidth / groupStats.length;

    let elements = `
      <!-- Grid lines -->
      <line x1="${margin.left}" y1="${margin.top}" x2="${width - margin.right}" y2="${margin.top}" stroke="#334155" stroke-dasharray="3 3" />
      <line x1="${margin.left}" y1="${margin.top + plotHeight / 2}" x2="${width - margin.right}" y2="${margin.top + plotHeight / 2}" stroke="#334155" stroke-dasharray="3 3" />
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}" stroke="#475569" stroke-width="1.5" />
      <!-- Y Axis Labels -->
      <text x="${margin.left - 8}" y="${margin.top + 5}" fill="#94a3b8" font-size="11" text-anchor="end">${yMax.toFixed(0)}</text>
      <text x="${margin.left - 8}" y="${margin.top + plotHeight / 2 + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${((yMin + yMax) / 2).toFixed(0)}</text>
      <text x="${margin.left - 8}" y="${margin.top + plotHeight}" fill="#94a3b8" font-size="11" text-anchor="end">${yMin.toFixed(0)}</text>
    `;

    groupStats.forEach((g, idx) => {
      const centerX = margin.left + idx * groupWidth + groupWidth / 2;
      const boxW = Math.min(groupWidth * 0.55, 60);

      const yQ1 = scaleY(g.q1);
      const yQ3 = scaleY(g.q3);
      const yMed = scaleY(g.median);
      const yMinG = scaleY(g.min);
      const yMaxG = scaleY(g.max);

      // Whisker
      elements += `
        <line x1="${centerX}" y1="${yMinG}" x2="${centerX}" y2="${yMaxG}" stroke="#06b6d4" stroke-width="2" />
        <line x1="${centerX - boxW / 4}" y1="${yMinG}" x2="${centerX + boxW / 4}" y2="${yMinG}" stroke="#06b6d4" stroke-width="2" />
        <line x1="${centerX - boxW / 4}" y1="${yMaxG}" x2="${centerX + boxW / 4}" y2="${yMaxG}" stroke="#06b6d4" stroke-width="2" />
      `;

      // Box
      const boxY = Math.min(yQ1, yQ3);
      const boxH = Math.abs(yQ1 - yQ3);
      elements += `
        <rect x="${centerX - boxW / 2}" y="${boxY}" width="${boxW}" height="${boxH}" rx="4" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" stroke-width="2" />
        <!-- Median Line -->
        <line x1="${centerX - boxW / 2}" y1="${yMed}" x2="${centerX + boxW / 2}" y2="${yMed}" stroke="#10b981" stroke-width="3" />
      `;

      // Data Points Jitter
      g.values.forEach(val => {
        const dotY = scaleY(val);
        const jitter = (Math.random() - 0.5) * (boxW * 0.4);
        elements += `<circle cx="${centerX + jitter}" cy="${dotY}" r="3.5" fill="#38bdf8" opacity="0.85" />`;
      });

      // Group Label
      elements += `
        <text x="${centerX}" y="${height - margin.bottom + 18}" fill="#e2e8f0" font-size="11" font-weight="600" text-anchor="middle">
          ${g.name.split(" ")[0]}
        </text>
        <text x="${centerX}" y="${height - margin.bottom + 32}" fill="#94a3b8" font-size="10" text-anchor="middle">
          μ=${g.mean.toFixed(1)}
        </text>
      `;
    });

    svg.innerHTML = elements;
  }

  if (runBtn) {
    runBtn.addEventListener("click", executeANOVA);
  }

  // Prepopulate standard biochemical ALT assay values
  if (g1Input && !g1Input.value) {
    g1Input.value = "24.5, 26.1, 23.8, 25.4, 27.0, 24.9";
    if (g2Input) g2Input.value = "29.2, 31.0, 28.5, 30.4, 32.1, 29.8";
    if (g3Input) g3Input.value = "36.4, 38.2, 35.1, 37.5, 39.0, 36.8";
    if (g4Input) g4Input.value = "45.1, 47.3, 44.2, 46.8, 48.5, 45.9";
    executeANOVA();
  }
}

/* ==========================================================================
   3D Biomolecular Structure Viewer (3Dmol.js)
   ========================================================================== */
function init3DViewer() {
  const viewerContainer = document.getElementById("molViewer3d");
  if (!viewerContainer) return;

  let glviewer = null;
  let currentPdb = "1fat";
  let currentStyle = "cartoon";

  function loadStructure(pdbId) {
    currentPdb = pdbId;
    viewerContainer.innerHTML = '<div class="viewer-loader">Fetching 3D coordinates for ' + pdbId.toUpperCase() + '...</div>';

    // Fetch from RCSB PDB
    const url = `https://files.rcsb.org/download/${pdbId}.pdb`;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error("PDB file download failed");
        return r.text();
      })
      .then(pdbData => {
        viewerContainer.innerHTML = "";
        glviewer = $3Dmol.createViewer(viewerContainer, {
          backgroundColor: "#030712"
        });

        glviewer.addModel(pdbData, "pdb");
        applyStyle(currentStyle);
        glviewer.zoomTo();
        glviewer.render();

        const badge = document.getElementById("molStructureBadge");
        if (badge) badge.textContent = `PDB: ${pdbId.toUpperCase()}`;
      })
      .catch(err => {
        viewerContainer.innerHTML = `
          <div class="viewer-error">
            <p>Could not download PDB ${pdbId.toUpperCase()} from RCSB.</p>
            <p class="text-xs text-muted">Offline or CORS restricted. Local models available in <code>structural_biology/</code></p>
          </div>
        `;
      });
  }

  function applyStyle(style) {
    if (!glviewer) return;
    currentStyle = style;
    glviewer.setStyle({}, {});

    if (style === "cartoon") {
      glviewer.setStyle({}, { cartoon: { color: "spectrum" } });
    } else if (style === "surface") {
      glviewer.setStyle({}, { cartoon: { color: "chain" } });
      glviewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.7, color: "spectrum" });
    } else if (style === "sphere") {
      glviewer.setStyle({}, { sphere: { colorscheme: "amino", scale: 0.8 } });
    } else if (style === "stick") {
      glviewer.setStyle({}, { stick: { colorscheme: "elementCodes" } });
    }

    glviewer.render();
  }

  // PDB Selector buttons
  document.querySelectorAll(".btn-pdb-select").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-pdb-select").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadStructure(btn.dataset.pdb);
    });
  });

  // Style buttons
  document.querySelectorAll(".btn-mol-style").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-mol-style").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyStyle(btn.dataset.style);
    });
  });

  // Reset view
  const resetBtn = document.getElementById("molResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (glviewer) {
        glviewer.zoomTo();
        glviewer.render();
      }
    });
  }

  // Initialize with 1FAT (matches local structural_biology/1fat.cif)
  if (typeof $3Dmol !== "undefined") {
    loadStructure("1fat");
  } else {
    // If 3Dmol script is still loading, wait a moment
    setTimeout(() => {
      if (typeof $3Dmol !== "undefined") loadStructure("1fat");
    }, 1000);
  }
}

/* ==========================================================================
   Notebook Catalog Loader & Filters
   ========================================================================== */
function loadNotebooks() {
  const grid = document.getElementById("notebookGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("notebookSearch");

  let allNotebooks = [];

  fetch("data/notebooks.json")
    .then(r => r.json())
    .then(data => {
      allNotebooks = data;
      renderGrid(allNotebooks);
    })
    .catch(err => {
      console.error("Failed to load notebooks.json:", err);
    });

  function renderGrid(list) {
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">No matching notebooks or exercises found.</div>';
      return;
    }

    grid.innerHTML = list.map(nb => {
      const badgeClass = nb.level === "Beginner" ? "badge-success" : (nb.level === "Intermediate" ? "badge-accent" : "badge-warning");
      const githubUrl = `https://github.com/SuleimanBiopythonPractised/SuleimanBiopythonPractised/blob/main/${nb.path}`;

      return `
        <article class="notebook-card">
          <div class="card-header">
            <span class="badge-pill ${badgeClass}">${nb.level}</span>
            <span class="category-tag">${nb.category.toUpperCase()}</span>
          </div>
          <h3 class="card-title">${nb.title}</h3>
          <p class="card-desc">${nb.description}</p>
          <div class="card-tools">
            ${nb.tools.map(t => `<span class="tool-tag">${t}</span>`).join("")}
          </div>
          <div class="card-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              View on GitHub (Private 🔒)
            </a>
            <a href="mailto:suleyman.hacizade1@gmail.com?subject=Access%20Request%3A%20${encodeURIComponent(nb.title)}" class="private-access-email" style="font-size: 0.78rem;">
              ✉️ Request Access
            </a>
          </div>
        </article>
      `;
    }).join("");
  }

  function filterData() {
    const activeCategory = document.querySelector(".filter-btn.active")?.dataset.filter || "all";
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    let filtered = allNotebooks.filter(nb => {
      const matchCat = activeCategory === "all" || nb.category === activeCategory;
      const matchQuery = !query || 
        nb.title.toLowerCase().includes(query) || 
        nb.description.toLowerCase().includes(query) ||
        nb.tools.some(t => t.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    renderGrid(filtered);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterData();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", filterData);
  }
}

/* ==========================================================================
   Obsidian Knowledge Graph Explorer
   ========================================================================== */
function initObsidianViewer() {
  const tabs = document.querySelectorAll(".wiki-tab-btn");
  const contentPanels = document.querySelectorAll(".wiki-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contentPanels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add("active");
    });
  });
}
