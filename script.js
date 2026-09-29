/* ==========================================================================
   MEMESTUDIO PRO - CORE ENGINE & INTERACTION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Data Models & State Management
  const state = {
    canvas: null,
    ctx: null,
    bgImage: null,
    layers: [],
    selectedLayerId: null,
    zoom: 1,
    aspectRatio: 'original',
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      flipH: false,
      flipV: false
    },
    watermark: '',
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  };

  // Sample Templates Data
  const sampleTemplates = [
    { id: '1', name: 'Drake Hotline Bling', category: 'trending', url: 'https://api.memegen.link/images/drake.png' },
    { id: '2', name: 'Distracted Boyfriend', category: 'trending', url: 'https://api.memegen.link/images/disastergirl.png' },
    { id: '3', name: 'Two Buttons', category: 'classic', url: 'https://api.memegen.link/images/button.png' },
    { id: '4', name: 'Change My Mind', category: 'classic', url: 'https://api.memegen.link/images/cmm.png' },
    { id: '5', name: 'Success Kid', category: 'reaction', url: 'https://api.memegen.link/images/success.png' },
    { id: '6', name: 'Futurama Fry', category: 'reaction', url: 'https://api.memegen.link/images/fry.png' }
  ];

  // Sample AI Captions
  const aiCaptions = [
    "When the code works on the first try without bugs",
    "Me explaining my college project to the external examiner",
    "Expectation vs Reality in software development",
    "Nobody: \nMe at 3 AM fixing CSS bugs:"
  ];

  // 2. DOM Elements Selection
  const canvas = document.getElementById('meme-canvas');
  const ctx = canvas.getContext('2d');
  state.canvas = canvas;
  state.ctx = ctx;

  const templateGrid = document.getElementById('template-grid');
  const layersList = document.getElementById('layers-list');
  const textInput = document.getElementById('text-input');
  const fontSelect = document.getElementById('text-font');
  const sizeInput = document.getElementById('text-size');
  const fillColorInput = document.getElementById('text-fill-color');
  const strokeColorInput = document.getElementById('text-stroke-color');
  const strokeWidthInput = document.getElementById('text-stroke-width');
  const bgColorInput = document.getElementById('text-bg-color');
  const bgEnableCheckbox = document.getElementById('text-bg-enable');
  const fileInput = document.getElementById('file-input');
  const uploadZone = document.getElementById('upload-zone');
  const watermarkInput = document.getElementById('watermark-input');

  // 3. Initialization Function
  function init() {
    setupCanvasDimensions(800, 600);
    renderTemplates(sampleTemplates);
    attachEventListeners();
    loadDefaultTemplate();
  }

  function setupCanvasDimensions(width, height) {
    canvas.width = width;
    canvas.height = height;
    renderCanvas();
  }

  function loadDefaultTemplate() {
    loadBackgroundImage(sampleTemplates[0].url);
  }

  // 4. Background & Rendering Engine
  function loadBackgroundImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.bgImage = img;
      setupCanvasDimensions(img.width || 800, img.height || 600);
      
      // Auto add initial text layers if none exist
      if (state.layers.length === 0) {
        addTextLayer('TOP TEXT', canvas.height * 0.15);
        addTextLayer('BOTTOM TEXT', canvas.height * 0.85);
      }
      renderCanvas();
    };
    img.src = src;
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Filter Matrix
    ctx.save();
    ctx.filter = `brightness(${state.filters.brightness}%) contrast(${state.filters.contrast}%) saturate(${state.filters.saturation}%) blur(${state.filters.blur}px)`;

    // Draw Background
    if (state.bgImage) {
      ctx.save();
      if (state.filters.flipH || state.filters.flipV) {
        ctx.translate(state.filters.flipH ? canvas.width : 0, state.filters.flipV ? canvas.height : 0);
        ctx.scale(state.filters.flipH ? -1 : 1, state.filters.flipV ? -1 : 1);
      }
      ctx.drawImage(state.bgImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // Draw Layers
    state.layers.forEach((layer) => {
      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);

      if (layer.type === 'text') {
        drawTextLayer(layer);
      }
      ctx.restore();

      // Render Selection Handle Box
      if (layer.id === state.selectedLayerId) {
        drawSelectionBox(layer);
      }
    });

    // Draw Watermark
    if (state.watermark) {
      ctx.save();
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(state.watermark, canvas.width - 20, canvas.height - 20);
      ctx.restore();
    }
  }

  function drawTextLayer(layer) {
    ctx.font = `900 ${layer.fontSize}px ${layer.fontFamily}`;
    ctx.textAlign = layer.textAlign;
    ctx.textBaseline = 'middle';

    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * 1.2;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const yPos = startY + index * lineHeight;

      // Draw Background Box
      if (layer.bgEnable) {
        const metrics = ctx.measureText(line);
        const pad = 10;
        ctx.fillStyle = layer.bgColor;
        ctx.fillRect(-metrics.width / 2 - pad, yPos - layer.fontSize / 2 - pad / 2, metrics.width + pad * 2, layer.fontSize + pad);
      }

      // Draw Stroke
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineJoin = 'miter';
        ctx.strokeText(line, 0, yPos);
      }

      // Draw Fill
      ctx.fillStyle = layer.fillColor;
      ctx.fillText(line, 0, yPos);
    });
  }

  function drawSelectionBox(layer) {
    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(-100, -30, 200, 60);
    ctx.restore();
  }

  // 5. Layer Management
  function addTextLayer(defaultText = 'NEW TEXT', yPosition = canvas.height / 2) {
    const newLayer = {
      id: Date.now().toString(),
      type: 'text',
      text: defaultText,
      x: canvas.width / 2,
      y: yPosition,
      fontSize: 48,
      fontFamily: 'Impact',
      fillColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 5,
      bgColor: '#000000',
      bgEnable: false,
      textAlign: 'center',
      rotation: 0
    };

    state.layers.push(newLayer);
    state.selectedLayerId = newLayer.id;
    updateLayersUI();
    syncInspectorControls();
    renderCanvas();
  }

  function updateLayersUI() {
    layersList.innerHTML = '';
    if (state.layers.length === 0) {
      layersList.innerHTML = '<p class="empty-msg">No active elements</p>';
      return;
    }

    state.layers.slice().reverse().forEach((layer) => {
      const item = document.createElement('div');
      item.className = `layer-item ${layer.id === state.selectedLayerId ? 'active' : ''}`;
      item.innerHTML = `
        <span><i class="fa-solid fa-font"></i> ${layer.text.substring(0, 15) || 'Text'}</span>
        <div class="layer-actions">
          <button class="btn-icon danger btn-delete-layer" data-id="${layer.id}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
      item.addEventListener('click', () => {
        state.selectedLayerId = layer.id;
        updateLayersUI();
        syncInspectorControls();
        renderCanvas();
      });
      layersList.appendChild(item);
    });

    // Delete Event Binding
    document.querySelectorAll('.btn-delete-layer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        state.layers = state.layers.filter(l => l.id !== id);
        if (state.selectedLayerId === id) state.selectedLayerId = null;
        updateLayersUI();
        renderCanvas();
      });
    });
  }

  function syncInspectorControls() {
    const selected = state.layers.find(l => l.id === state.selectedLayerId);
    if (!selected) return;

    if (selected.type === 'text') {
      textInput.value = selected.text;
      fontSelect.value = selected.fontFamily;
      sizeInput.value = selected.fontSize;
      fillColorInput.value = selected.fillColor;
      strokeColorInput.value = selected.strokeColor;
      strokeWidthInput.value = selected.strokeWidth;
      bgColorInput.value = selected.bgColor;
      bgEnableCheckbox.checked = selected.bgEnable;
    }
  }

  // 6. Event Handlers & Dynamic Controls
  function attachEventListeners() {
    // Tab Switches
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Text Inspector Controls Update
    textInput.addEventListener('input', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.text = e.target.value; renderCanvas(); updateLayersUI(); }
    });

    fontSelect.addEventListener('change', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.fontFamily = e.target.value; renderCanvas(); }
    });

    sizeInput.addEventListener('input', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.fontSize = parseInt(e.target.value); renderCanvas(); }
    });

    fillColorInput.addEventListener('input', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.fillColor = e.target.value; renderCanvas(); }
    });

    strokeColorInput.addEventListener('input', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.strokeColor = e.target.value; renderCanvas(); }
    });

    strokeWidthInput.addEventListener('input', (e) => {
      const selected = state.layers.find(l => l.id === state.selectedLayerId);
      if (selected) { selected.strokeWidth = parseInt(e.target.value); renderCanvas(); }
    });

    // Add Text Buttons
    document.getElementById('btn-add-text-top').addEventListener('click', () => addTextLayer('TOP TEXT', canvas.height * 0.15));
    document.getElementById('btn-add-text-bottom').addEventListener('click', () => addTextLayer('BOTTOM TEXT', canvas.height * 0.85));

    // AI Caption Generator
    document.getElementById('btn-ai-caption').addEventListener('click', () => {
      const randomCaption = aiCaptions[Math.floor(Math.random() * aiCaptions.length)];
      addTextLayer(randomCaption, canvas.height / 2);
    });

    // Image Adjustments Sliders
    ['brightness', 'contrast', 'saturation', 'blur'].forEach(filter => {
      const slider = document.getElementById(`filter-${filter}`);
      slider.addEventListener('input', (e) => {
        state.filters[filter] = e.target.value;
        document.getElementById(`val-${filter}`).innerText = `${e.target.value}${filter === 'blur' ? 'px' : '%'}`;
        renderCanvas();
      });
    });

    // Flip Controls
    document.getElementById('btn-flip-h').addEventListener('click', () => { state.filters.flipH = !state.filters.flipH; renderCanvas(); });
    document.getElementById('btn-flip-v').addEventListener('click', () => { state.filters.flipV = !state.filters.flipV; renderCanvas(); });

    // Watermark
    watermarkInput.addEventListener('input', (e) => {
      state.watermark = e.target.value;
      renderCanvas();
    });

    // Drag and Drop Image Upload
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => loadBackgroundImage(evt.target.result);
        reader.readAsDataURL(file);
      }
    });

    // Download / Export Engine
    document.getElementById('btn-download').addEventListener('click', downloadMeme);
    document.getElementById('btn-export-quick').addEventListener('click', downloadMeme);

    // Canvas Pointer Dragging
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
  }

  function renderTemplates(templates) {
    templateGrid.innerHTML = '';
    templates.forEach(tpl => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `<img src="${tpl.url}" alt="${tpl.name}" />`;
      item.addEventListener('click', () => loadBackgroundImage(tpl.url));
      templateGrid.appendChild(item);
    });
  }

  // Pointer & Drag Interactions
  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      if (Math.abs(mouseX - layer.x) < 100 && Math.abs(mouseY - layer.y) < 30) {
        state.selectedLayerId = layer.id;
        state.isDragging = true;
        state.dragOffset = { x: mouseX - layer.x, y: mouseY - layer.y };
        updateLayersUI();
        syncInspectorControls();
        renderCanvas();
        return;
      }
    }
  }

  function onPointerMove(e) {
    if (!state.isDragging || !state.selectedLayerId) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const selected = state.layers.find(l => l.id === state.selectedLayerId);
    if (selected) {
      selected.x = mouseX - state.dragOffset.x;
      selected.y = mouseY - state.dragOffset.y;
      renderCanvas();
    }
  }

  function onPointerUp() {
    state.isDragging = false;
  }

  function downloadMeme() {
    // Unselect layer to avoid rendering boundary boxes in export
    const activeId = state.selectedLayerId;
    state.selectedLayerId = null;
    renderCanvas();

    const format = document.getElementById('export-format').value;
    const quality = parseFloat(document.getElementById('export-quality').value);
    
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, quality);
    link.click();

    state.selectedLayerId = activeId;
    renderCanvas();
  }

  // Initialize
  init();
});
