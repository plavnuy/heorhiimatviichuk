const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

if (!isMobile) {
class ControlsManager {
    constructor() {
        this.config = {
            TEXTURE_DOWNSAMPLE: 1,
            DENSITY_DISSIPATION: 0.98,
            VELOCITY_DISSIPATION: 0.89,
            PRESSURE_DISSIPATION: 0.99,
            PRESSURE_ITERATIONS: 20,
            CURL: 0.01,
            SPLAT_RADIUS: 0.001,
            blendMode: 'difference',
            opacity: 0.05,
            enabled: false // Изначально выключено
        };

        this.isPanelVisible = false;
        this.init();
    }

    init() {
        // Создаем панель управления
        this.createControlsPanel();
        
        // Вешаем обработчик на клик по "myhead"
        const myhead = document.getElementById('myhead');
        if (myhead) {
            myhead.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleControlsPanel();
            });
        }

        // Закрываем панель при клике вне её
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('controlsPanel');
            if (panel && this.isPanelVisible && 
                !panel.contains(e.target) && 
                e.target !== myhead) {
                this.hideControlsPanel();
            }
        });

        // Загружаем сохранённые настройки
        this.loadSettings();
        
        // Применяем начальные настройки
        this.applyConfig();
        this.updateControlsState(); // Обновляем состояние контролов
    }

    createControlsPanel() {
        const panel = document.createElement('div');
        panel.id = 'controlsPanel';
        panel.className = 'controls-panel';
        panel.style.cssText = `
            position: absolute;
            left: 20px;
            bottom: 120px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px;
            hard-light: white;
            font-family: 'Science Gothic', sans-serif;
            font-size: 12px;
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: none;
            width: 280px;
            overflow-y: auto;
        `;

        panel.innerHTML = `

            
            <div class="control-group2" style="margin-bottom: 20px;">
                <div class="control-item">
                    <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span>Enable Fluid</span>
                        <label class="switch">
                            <input type="checkbox" id="enableFluid" ${this.config.enabled ? 'checked' : ''}>
                            <span class="slidersq"></span>
                        </label>
                    </label>
                </div>
            </div>

            <div class="control-group" style="margin-bottom: 20px;">
                
                <div class="blend-mode-tabs" style="display: flex; margin-bottom: 15px; gap: 4px;">
                    <button class="blend-tab ${this.config.blendMode === 'difference' ? 'active' : ''}" data-mode="difference">DIFF</button>
                    <button class="blend-tab ${this.config.blendMode === 'exclusion' ? 'active' : ''}" data-mode="exclusion">EXCL</button>
                    <button class="blend-tab ${this.config.blendMode === 'hard-light' ? 'active' : ''}" data-mode="hard-light">HARD</button>
                    <button class="blend-tab ${this.config.blendMode === 'luminosity' ? 'active' : ''}" data-mode="luminosity">LUMEN</button>
                </div>
            </div>

            <div class="control-group" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Opacity</span>
                    <span id="opacityValue" style="font-family: monospace;">${(this.config.opacity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" id="opacitySlider" min="0" max="100" step="1" value="${this.config.opacity * 100}" style="width: 100%; margin: 5px 0;">
            </div>

            <div class="control-group" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Density</span>
                    <span id="densityValue" style="font-family: monospace;">${this.config.DENSITY_DISSIPATION.toFixed(2)}</span>
                </div>
                <input type="range" id="densitySlider" min="0.90" max="0.99" step="0.01" value="${this.config.DENSITY_DISSIPATION}" style="width: 100%; margin: 5px 0;">
            </div>

            <div class="control-group" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Velocity</span>
                    <span id="velocityValue" style="font-family: monospace;">${this.config.VELOCITY_DISSIPATION.toFixed(2)}</span>
                </div>
                <input type="range" id="velocitySlider" min="0.8" max="0.99" step="0.01" value="${this.config.VELOCITY_DISSIPATION}" style="width: 100%; margin: 5px 0;">
            </div>

            <div class="control-group" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Pressure</span>
                    <span id="pressureValue" style="font-family: monospace;">${this.config.PRESSURE_DISSIPATION.toFixed(2)}</span>
                </div>
                <input type="range" id="pressureSlider" min="0.1" max="0.5" step="0.01" value="${this.config.PRESSURE_DISSIPATION}" style="width: 100%; margin: 5px 0;">
            </div>

            <div class="control-group" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Curl</span>
                    <span id="curlValue" style="font-family: monospace;">${this.config.CURL.toFixed(4)}</span>
                </div>
                <input type="range" id="curlSlider" min="0" max="50" step="0.01" value="${this.config.CURL}" style="width: 100%; margin: 5px 0;">
            </div>

            <div class="control-group" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="hard-light: rgba(255,255,255,0.8);">Splat Radius</span>
                    <span id="splatValue" style="font-family: monospace;">${this.config.SPLAT_RADIUS.toFixed(4)}</span>
                </div>
                <input type="range" id="splatSlider" min="0.001" max="0.100" step="0.001" value="${this.config.SPLAT_RADIUS}" style="width: 100%; margin: 5px 0;">
            </div>

  

   
        `;

        document.querySelector('footer').appendChild(panel);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Переключатель включения
        document.getElementById('enableFluid').addEventListener('change', (e) => {
            this.config.enabled = e.target.checked;
            this.applyConfig();
            this.updateControlsState();
            this.saveSettings();
        });

        // Кнопки режимов наложения
        document.querySelectorAll('.blend-tab').forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.config.blendMode = mode;
                
                // Обновляем активную кнопку
                document.querySelectorAll('.blend-tab').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                this.applyConfig();
                this.saveSettings();
            });
        });

        // Слайдеры
        const sliders = [
            { id: 'opacitySlider', key: 'opacity', valueId: 'opacityValue', format: v => `${(v * 100).toFixed(0)}%` },
            { id: 'densitySlider', key: 'DENSITY_DISSIPATION', valueId: 'densityValue', format: v => v.toFixed(2) },
            { id: 'velocitySlider', key: 'VELOCITY_DISSIPATION', valueId: 'velocityValue', format: v => v.toFixed(2) },
            { id: 'pressureSlider', key: 'PRESSURE_DISSIPATION', valueId: 'pressureValue', format: v => v.toFixed(2) },
            { id: 'curlSlider', key: 'CURL', valueId: 'curlValue', format: v => v.toFixed(4) },
            { id: 'splatSlider', key: 'SPLAT_RADIUS', valueId: 'splatValue', format: v => v.toFixed(4) }
        ];

        sliders.forEach(slidersq => {
            const element = document.getElementById(slidersq.id);
            const valueElement = document.getElementById(slidersq.valueId);
            
            element.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                
                // Для opacity преобразуем из процентов
                if (slidersq.key === 'opacity') {
                    value = value / 100;
                }
                
                this.config[slidersq.key] = value;
                valueElement.textContent = slidersq.format(value);
                this.applyConfig();
            });

            element.addEventListener('change', () => {
                this.saveSettings();
            });
        });

        // Кнопки


    }

    applyConfig() {
        // Применяем настройки к fluid simulation (глобальный config)
        if (typeof config !== 'undefined') {
            Object.keys(this.config).forEach(key => {
                if (config.hasOwnProperty(key) && key !== 'enabled' && key !== 'opacity' && key !== 'blendMode') {
                    config[key] = this.config[key];
                }
            });
        }

        // Применяем настройки к контейнеру
        const container = document.getElementById('container');
        if (container) {
            container.style.mixBlendMode = this.config.enabled ? this.config.blendMode : 'hard-light';
            container.style.opacity = this.config.enabled ? this.config.opacity : '0';
        }
    }

    updateControlsState() {
        const isEnabled = this.config.enabled;
        const controls = document.querySelectorAll('.control-group:not(:first-child)');
        
        controls.forEach(control => {
            if (isEnabled) {
                control.classList.remove('disabled');
            } else {
                control.classList.add('disabled');
            }
        });
    }

    resetToDefaults() {
        this.config = {
            TEXTURE_DOWNSAMPLE: 1,
            DENSITY_DISSIPATION: 0.95,
            VELOCITY_DISSIPATION: 0.95,
            PRESSURE_DISSIPATION: 0.2,
            PRESSURE_ITERATIONS: 20,
            CURL: 20,
            SPLAT_RADIUS: 0.003,
            blendMode: 'difference',
            opacity: 0.4,
            enabled: this.config.enabled // Сохраняем текущее состояние включения
        };

        this.updateUI();
        this.applyConfig();
        this.saveSettings();
    }

    setRandomValues() {
        this.config.DENSITY_DISSIPATION = 0.9 + Math.random() * 0.19;
        this.config.VELOCITY_DISSIPATION = 0.8 + Math.random() * 0.19;
        this.config.PRESSURE_DISSIPATION = 0.1 + Math.random() * 0.4;
        this.config.CURL = 0.2 + Math.random() * 0.9;
        this.config.SPLAT_RADIUS = 0.002 + Math.random() * 0.008;
        this.config.opacity = 0.2 + Math.random() * 0.6;
        
        const blendModes = ['difference', 'exclusion', 'hard-light', 'luminosity'];
        this.config.blendMode = blendModes[Math.floor(Math.random() * blendModes.length)];

        this.updateUI();
        this.applyConfig();
        this.saveSettings();
    }

    updateUI() {
        // Обновляем значения в UI
        document.getElementById('enableFluid').checked = this.config.enabled;
        
        // Обновляем активную кнопку режима наложения
        document.querySelectorAll('.blend-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.config.blendMode) {
                btn.classList.add('active');
            }
        });
        
        // Обновляем слайдеры и значения
        document.getElementById('opacitySlider').value = this.config.opacity * 100;
        document.getElementById('opacityValue').textContent = `${(this.config.opacity * 100).toFixed(0)}%`;
        
        document.getElementById('densitySlider').value = this.config.DENSITY_DISSIPATION;
        document.getElementById('densityValue').textContent = this.config.DENSITY_DISSIPATION.toFixed(2);
        
        document.getElementById('velocitySlider').value = this.config.VELOCITY_DISSIPATION;
        document.getElementById('velocityValue').textContent = this.config.VELOCITY_DISSIPATION.toFixed(2);
        
        document.getElementById('pressureSlider').value = this.config.PRESSURE_DISSIPATION;
        document.getElementById('pressureValue').textContent = this.config.PRESSURE_DISSIPATION.toFixed(2);
        
        document.getElementById('curlSlider').value = this.config.CURL;
        document.getElementById('curlValue').textContent = this.config.CURL.toFixed(4);
        
        document.getElementById('splatSlider').value = this.config.SPLAT_RADIUS;
        document.getElementById('splatValue').textContent = this.config.SPLAT_RADIUS.toFixed(4);
    }

    toggleControlsPanel() {
        const panel = document.getElementById('controlsPanel');
        if (!this.isPanelVisible) {
            this.showControlsPanel();
        } else {
            this.hideControlsPanel();
        }
    }

    showControlsPanel() {
        const panel = document.getElementById('controlsPanel');
        const myhead = document.getElementById('myhead');
        
        if (panel && myhead) {
            const rect = myhead.getBoundingClientRect();
            panel.style.left = '20px';
            panel.style.bottom = `${window.innerHeight - rect.top + 20}px`;
            panel.style.display = 'block';
            this.isPanelVisible = true;
        }
    }

    hideControlsPanel() {
        const panel = document.getElementById('controlsPanel');
        if (panel) {
            panel.style.display = 'none';
            this.isPanelVisible = false;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('fluidControls', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('fluidControls');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                Object.keys(savedConfig).forEach(key => {
                    if (this.config.hasOwnProperty(key)) {
                        this.config[key] = savedConfig[key];
                    }
                });
                this.updateUI();
                this.applyConfig();
                this.updateControlsState();
            }
        } catch (e) {
            console.warn('Could not load settings:', e);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.controlsManager = new ControlsManager();
});

}