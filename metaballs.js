// metaballs.js - чистые блобы с контролами

import * as THREE from "https://esm.sh/three@0.178.0";

class MetaballsRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;
        this.clock = new THREE.Clock();
        
        this.mouse = { x: 0, y: 0 };
        this.cursorSphere3D = new THREE.Vector3(0, 0, 0);
        this.activeMerges = 0;
        this.targetMousePosition = new THREE.Vector2(0.5, 0.5);
        this.mousePosition = new THREE.Vector2(0.5, 0.5);
        
        // Настройки по умолчанию
        this.settings = {
            // Основные
            enabled: true,
            blendMode: 'normal',
            opacity: 1,
            
            // Визуальные
            sphereCount: 6,
            smoothness: 0.3,
            contrast: 2.0,
            fogDensity: 0.12,
            backgroundColor: new THREE.Color(0x050505),
            sphereColor: new THREE.Color(0x000000),
            
            // Свет
            ambientIntensity: 0.02,
            diffuseIntensity: 0.6,
            specularIntensity: 1.8,
            specularPower: 8,
            fresnelPower: 1.2,
            lightColor: new THREE.Color(0xffffff),
            lightPosition: new THREE.Vector3(1, 1, 1),
            
            // Статические сферы
            fixedTopLeftRadius: 0.8,
            fixedBottomRightRadius: 0.9,
            smallTopLeftRadius: 0.3,
            smallBottomRightRadius: 0.35,
            
            // Курсор
            cursorRadiusMin: 0.08,
            cursorRadiusMax: 0.15,
            cursorGlowIntensity: 0.4,
            cursorGlowRadius: 1.2,
            cursorGlowColor: new THREE.Color(0xffffff),
            
            // Анимация
            animationSpeed: 0.6,
            movementScale: 1.2,
            mouseSmoothness: 0.1,
            mergeDistance: 1.5,
            mouseProximityEffect: true,
            minMovementScale: 0.3,
            maxMovementScale: 1.0
        };

        this.init();
        this.setupControls();
    }

    init() {
        this.createRenderer();
        this.createScene();
        this.setupEventListeners();
        
        // Изначальная позиция курсора
        this.onPointerMove({
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
        });
        
        // Начать анимацию
        this.animate();
    }

    createRenderer() {
        // Создаем контейнер для Three.js сцены
        const container = document.createElement('div');
        container.id = 'metaballs-container';
        container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            display: block !important;
            pointer-events: none !important;
            mix-blend-mode: ${this.settings.blendMode};
            opacity: ${this.settings.opacity};
        `;
        document.body.appendChild(container);

        // Создаем рендерер
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            premultipliedAlpha: false
        });

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Стилизация canvas
        const canvas = this.renderer.domElement;
        canvas.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
        `;
        container.appendChild(canvas);
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        // Создаем шейдерный материал
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uActualResolution: {
                    value: new THREE.Vector2(
                        window.innerWidth * (window.devicePixelRatio || 1),
                        window.innerHeight * (window.devicePixelRatio || 1)
                    )
                },
                uPixelRatio: { value: window.devicePixelRatio || 1 },
                uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
                uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
                uCursorRadius: { value: this.settings.cursorRadiusMin },
                uSphereCount: { value: this.settings.sphereCount },
                uFixedTopLeftRadius: { value: this.settings.fixedTopLeftRadius },
                uFixedBottomRightRadius: { value: this.settings.fixedBottomRightRadius },
                uSmallTopLeftRadius: { value: this.settings.smallTopLeftRadius },
                uSmallBottomRightRadius: { value: this.settings.smallBottomRightRadius },
                uMergeDistance: { value: this.settings.mergeDistance },
                uSmoothness: { value: this.settings.smoothness },
                uAmbientIntensity: { value: this.settings.ambientIntensity },
                uDiffuseIntensity: { value: this.settings.diffuseIntensity },
                uSpecularIntensity: { value: this.settings.specularIntensity },
                uSpecularPower: { value: this.settings.specularPower },
                uFresnelPower: { value: this.settings.fresnelPower },
                uBackgroundColor: { value: this.settings.backgroundColor },
                uSphereColor: { value: this.settings.sphereColor },
                uLightColor: { value: this.settings.lightColor },
                uLightPosition: { value: this.settings.lightPosition },
                uContrast: { value: this.settings.contrast },
                uFogDensity: { value: this.settings.fogDensity },
                uAnimationSpeed: { value: this.settings.animationSpeed },
                uMovementScale: { value: this.settings.movementScale },
                uMouseProximityEffect: { value: this.settings.mouseProximityEffect },
                uMinMovementScale: { value: this.settings.minMovementScale },
                uMaxMovementScale: { value: this.settings.maxMovementScale },
                uCursorGlowIntensity: { value: this.settings.cursorGlowIntensity },
                uCursorGlowRadius: { value: this.settings.cursorGlowRadius },
                uCursorGlowColor: { value: this.settings.cursorGlowColor }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                
                uniform float uTime;
                uniform vec2 uResolution;
                uniform vec2 uActualResolution;
                uniform float uPixelRatio;
                uniform vec2 uMousePosition;
                uniform vec3 uCursorSphere;
                uniform float uCursorRadius;
                uniform int uSphereCount;
                uniform float uFixedTopLeftRadius;
                uniform float uFixedBottomRightRadius;
                uniform float uSmallTopLeftRadius;
                uniform float uSmallBottomRightRadius;
                uniform float uMergeDistance;
                uniform float uSmoothness;
                uniform float uAmbientIntensity;
                uniform float uDiffuseIntensity;
                uniform float uSpecularIntensity;
                uniform float uSpecularPower;
                uniform float uFresnelPower;
                uniform vec3 uBackgroundColor;
                uniform vec3 uSphereColor;
                uniform vec3 uLightColor;
                uniform vec3 uLightPosition;
                uniform float uContrast;
                uniform float uFogDensity;
                uniform float uAnimationSpeed;
                uniform float uMovementScale;
                uniform bool uMouseProximityEffect;
                uniform float uMinMovementScale;
                uniform float uMaxMovementScale;
                uniform float uCursorGlowIntensity;
                uniform float uCursorGlowRadius;
                uniform vec3 uCursorGlowColor;
                
                varying vec2 vUv;
                
                const float PI = 3.14159265359;
                const float EPSILON = 0.001;
                const float MAX_DIST = 100.0;
                
                float smin(float a, float b, float k) {
                    float h = max(k - abs(a - b), 0.0) / k;
                    return min(a, b) - h * h * k * 0.25;
                }
                
                float sdSphere(vec3 p, float r) {
                    return length(p) - r;
                }
                
                vec3 screenToWorld(vec2 normalizedPos) {
                    vec2 uv = normalizedPos * 2.0 - 1.0;
                    uv.x *= uResolution.x / uResolution.y;
                    return vec3(uv * 2.0, 0.0);
                }
                
                float getDistanceToCenter(vec2 pos) {
                    float dist = length(pos - vec2(0.5, 0.5)) * 2.0;
                    return smoothstep(0.0, 1.0, dist);
                }
                
                float sceneSDF(vec3 pos) {
                    float result = MAX_DIST;
                    
                    // Статические сферы
              
                    float t = uTime * uAnimationSpeed;
                    
                    // Динамическое масштабирование движения
                    float dynamicMovementScale = uMovementScale;
                    if (uMouseProximityEffect) {
                        float distToCenter = getDistanceToCenter(uMousePosition);
                        float mixFactor = smoothstep(0.0, 1.0, distToCenter);
                        dynamicMovementScale = mix(uMinMovementScale, uMaxMovementScale, mixFactor);
                    }
                    
                    // Движущиеся сферы
                    for (int i = 0; i < 10; i++) {
                        if (i >= uSphereCount) break;
                        
                        float fi = float(i);
                     float speed = 0.15 + fi * 0.05;          // медленнее
float radius = 0.35 + fi * 0.12;         // БОЛЬШИЕ
float orbitRadius = 0.6 + fi * 0.25;     // широкий размах
                        float phaseOffset = fi * PI * 0.35;
                        
                        // Эффект приближения к курсору
                        float distToCursor = length(vec3(0.0) - uCursorSphere);
                        float proximityScale = 1.0 + (1.0 - smoothstep(0.0, 1.0, distToCursor)) * 0.5;
                        orbitRadius *= proximityScale;
                        
                 // Якоря по краям экрана
vec3 anchor;
if (i == 0) anchor = vec3(0.0,  0.0, 0.0); // left
if (i == 1) anchor = vec3( 1.6,  0.0, 0.0); // right
if (i == 2) anchor = vec3( 0.0,  1.2, 0.0); // top
if (i == 3) anchor = vec3( 0.0, -4.2, 0.0); // bottom
if (i >= 4) anchor = vec3(
    sign(sin(fi)) * 1.4,
    sign(cos(fi)) * 1.0,
    0.0
);

// Медленное «дыхание» вокруг якоря
vec3 wobble = vec3(
    sin(t * speed + fi) * 0.25,
    cos(t * speed * 0.9 + fi * 1.3) * 0.25,
    sin(t * speed * 0.6) * 0.15
);

vec3 offset = anchor + wobble;
                        
                        // Притяжение к курсору
                        vec3 toCursor = uCursorSphere - offset;
                        float cursorDist = length(toCursor);
                        if (cursorDist < uMergeDistance && cursorDist > 0.0) {
                            float attraction = (1.0 - cursorDist / uMergeDistance) * 0.3;
                            offset += normalize(toCursor) * attraction;
                        }
                        
                        float movingSphere = sdSphere(pos - offset, radius);
                        
                        // Динамическое сглаживание
                        float blend = 0.05;
                        if (cursorDist < uMergeDistance) {
                            float influence = 1.0 - (cursorDist / uMergeDistance);
                            blend = mix(0.05, uSmoothness, influence * influence * influence);
                        }
                        
                        result = smin(result, movingSphere, blend);
                    }
                    
                    // Сфера курсора
float pulse =
    1.0 +
    sin(uTime * 4.0) * 0.08 +
    sin(uTime * 2.1) * 0.04;

float cursorBall = sdSphere(
    pos - uCursorSphere,
    uCursorRadius * pulse
);                    
                    // Группировка статических сфер
                  
                    result = smin(result, cursorBall, uSmoothness);
                    
                    return result;
                }
                
                vec3 calcNormal(vec3 p) {
                    float eps = 0.001;
                    return normalize(vec3(
                        sceneSDF(p + vec3(eps, 0, 0)) - sceneSDF(p - vec3(eps, 0, 0)),
                        sceneSDF(p + vec3(0, eps, 0)) - sceneSDF(p - vec3(0, eps, 0)),
                        sceneSDF(p + vec3(0, 0, eps)) - sceneSDF(p - vec3(0, 0, eps))
                    ));
                }
                
                float ambientOcclusion(vec3 p, vec3 n) {
                    float occ = 0.0;
                    float weight = 1.0;
                    for (int i = 0; i < 6; i++) {
                        float dist = 0.01 + 0.015 * float(i * i);
                        float h = sceneSDF(p + n * dist);
                        occ += (dist - h) * weight;
                        weight *= 0.85;
                    }
                    return clamp(1.0 - occ, 0.0, 1.0);
                }
                
                float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
                    float result = 1.0;
                    float t = mint;
                    for (int i = 0; i < 20; i++) {
                        if (t >= maxt) break;
                        float h = sceneSDF(ro + rd * t);
                        if (h < EPSILON) return 0.0;
                        result = min(result, k * h / t);
                        t += h;
                    }
                    return result;
                }
                
                float rayMarch(vec3 ro, vec3 rd) {
                    float t = 0.0;
                    
                    for (int i = 0; i < 48; i++) {
                        vec3 p = ro + rd * t;
                        float d = sceneSDF(p);
                        
                        if (d < EPSILON) {
                            return t;
                        }
                        
                        if (t > 5.0) {
                            break;
                        }
                        
                        t += d * 0.9;
                    }
                    
                    return -1.0;
                }
                
                vec3 iridescentColor(vec3 normal, vec3 viewDir) {
    float fresnel = pow(1.0 - dot(normal, viewDir), 2.5);

    float hue = fresnel * 0.9 + uTime * 0.05;
    
    vec3 rainbow = vec3(
        sin(6.2831 * (hue + 0.0)) * 0.5 + 0.5,
        sin(6.2831 * (hue + 0.33)) * 0.5 + 0.5,
        sin(6.2831 * (hue + 0.66)) * 0.5 + 0.5
    );

    return rainbow;
}


                vec3 lighting(vec3 p, vec3 rd, float t) {
                    if (t < 0.0) {
                        return vec3(0.0);
                    }
                    
                    vec3 normal = calcNormal(p);
                    vec3 viewDir = -rd;
                    
                    vec3 iridescence = iridescentColor(normal, viewDir);
vec3 baseColor = mix(vec3(0.9), iridescence, 0.9);
                    
                    float ao = ambientOcclusion(p, normal);
                    
                    vec3 ambient = uLightColor * uAmbientIntensity * ao;
                    
                    vec3 lightDir = normalize(uLightPosition);
                    float diff = max(dot(normal, lightDir), 0.0);
                    
                    float shadow = softShadow(p, lightDir, 0.01, 10.0, 20.0);
                    
                    vec3 diffuse = uLightColor * diff * uDiffuseIntensity * shadow;
                    
                    vec3 reflectDir = reflect(-lightDir, normal);
                    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
                    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
                    
                    vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;
                    
                    vec3 fresnelRim = uLightColor * fresnel * 0.4;
                    
                    // Подсветка от курсора
                    float distToCursor = length(p - uCursorSphere);
                    if (distToCursor < uCursorRadius + 0.4) {
                        float highlight = 1.0 - smoothstep(0.0, uCursorRadius + 0.4, distToCursor);
                        specular += uLightColor * highlight * 0.2;
                        
                        float glow = exp(-distToCursor * 3.0) * 0.15;
                        ambient += uLightColor * glow * 0.5;
                    }
                    
                    vec3 color = (baseColor + ambient + diffuse + specular + fresnelRim) * ao;
                    
                    color = pow(color, vec3(uContrast * 0.9));
                    color = color / (color + vec3(0.8));
                    
                    return color;
                }
                
                float calculateCursorGlow(vec3 worldPos) {
                    float dist = length(worldPos.xy - uCursorSphere.xy);
                    float glow = 1.0 - smoothstep(0.0, uCursorGlowRadius, dist);
                    glow = pow(glow, 2.0);
                    return glow * uCursorGlowIntensity;
                }
                
                void main() {
                    vec2 uv = (gl_FragCoord.xy * 2.0 - uActualResolution.xy) / uActualResolution.xy;
                    uv.x *= uResolution.x / uResolution.y;
                    
                    vec3 ro = vec3(uv * 2.0, -1.0);
                    vec3 rd = vec3(0.0, 0.0, 1.0);
                    
                    float t = rayMarch(ro, rd);
                    
                    vec3 p = ro + rd * t;
                    
                    vec3 color = lighting(p, rd, t);
                    
                    float cursorGlow = calculateCursorGlow(ro);
                    vec3 glowContribution = uCursorGlowColor * cursorGlow;
                    
                    if (t > 0.0) {
                        float fogAmount = 1.0 - exp(-t * uFogDensity);
                        color = mix(color, uBackgroundColor.rgb, fogAmount * 0.3);
                        
                        color += glowContribution * 0.3;
                        
                        gl_FragColor = vec4(color, 1.0);
                    } else {
                        if (cursorGlow > 0.01) {
                            gl_FragColor = vec4(glowContribution, cursorGlow * 0.8);
                        } else {
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                        }
                    }
                }
            `,
            transparent: true
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
    }

    setupEventListeners() {
        window.addEventListener("mousemove", this.onPointerMove.bind(this), { passive: true });
        window.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
        window.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
        window.addEventListener("touchend", this.onTouchEnd.bind(this), { passive: false });
        window.addEventListener("resize", this.onWindowResize.bind(this), { passive: true });
    }

    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.onPointerMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.onPointerMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    onTouchEnd(event) {
        event.preventDefault();
    }

    onPointerMove(event) {
        this.targetMousePosition.x = event.clientX / window.innerWidth;
        this.targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;

        // Конвертируем в мировые координаты
        const normalizedX = this.targetMousePosition.x;
        const normalizedY = this.targetMousePosition.y;
        const worldPos = this.screenToWorldJS(normalizedX, normalizedY);
        this.cursorSphere3D.copy(worldPos);

        // Определяем слияния
        this.activeMerges = 0;
        const fixedPositions = [
            this.screenToWorldJS(0.08, 0.92),
            this.screenToWorldJS(0.25, 0.72),
            this.screenToWorldJS(0.92, 0.08),
            this.screenToWorldJS(0.72, 0.25)
        ];

        let closestDistance = 1000.0;
        fixedPositions.forEach((pos) => {
            const dist = this.cursorSphere3D.distanceTo(pos);
            closestDistance = Math.min(closestDistance, dist);
            if (dist < this.settings.mergeDistance) this.activeMerges++;
        });

        // Динамический радиус курсора
        const proximityFactor = Math.max(
            0,
            1.0 - closestDistance / this.settings.mergeDistance
        );
        const smoothFactor = proximityFactor * proximityFactor * (3.0 - 2.0 * proximityFactor);
        const dynamicRadius =
            this.settings.cursorRadiusMin +
            (this.settings.cursorRadiusMax - this.settings.cursorRadiusMin) * smoothFactor;

        this.material.uniforms.uCursorSphere.value.copy(this.cursorSphere3D);
        this.material.uniforms.uCursorRadius.value = dynamicRadius;
    }

    screenToWorldJS(normalizedX, normalizedY) {
        const uv_x = normalizedX * 2.0 - 1.0;
        const uv_y = normalizedY * 2.0 - 1.0;
        const aspect = window.innerWidth / window.innerHeight;
        return new THREE.Vector3(uv_x * aspect * 2.0, uv_y * 2.0, 0.0);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(pixelRatio);

        this.material.uniforms.uResolution.value.set(width, height);
        this.material.uniforms.uActualResolution.value.set(
            width * pixelRatio,
            height * pixelRatio
        );
        this.material.uniforms.uPixelRatio.value = pixelRatio;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }

    render() {
        // Плавное движение курсора
        this.mousePosition.x +=
            (this.targetMousePosition.x - this.mousePosition.x) * this.settings.mouseSmoothness;
        this.mousePosition.y +=
            (this.targetMousePosition.y - this.mousePosition.y) * this.settings.mouseSmoothness;

        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        this.material.uniforms.uMousePosition.value = this.mousePosition;

        this.renderer.render(this.scene, this.camera);
    }

    applySettings() {
        // Обновляем материал
        this.material.uniforms.uSphereCount.value = this.settings.sphereCount;
        this.material.uniforms.uSmoothness.value = this.settings.smoothness;
        this.material.uniforms.uContrast.value = this.settings.contrast;
        this.material.uniforms.uFogDensity.value = this.settings.fogDensity;
        this.material.uniforms.uBackgroundColor.value = this.settings.backgroundColor;
        this.material.uniforms.uSphereColor.value = this.settings.sphereColor;
        this.material.uniforms.uAmbientIntensity.value = this.settings.ambientIntensity;
        this.material.uniforms.uDiffuseIntensity.value = this.settings.diffuseIntensity;
        this.material.uniforms.uSpecularIntensity.value = this.settings.specularIntensity;
        this.material.uniforms.uSpecularPower.value = this.settings.specularPower;
        this.material.uniforms.uFresnelPower.value = this.settings.fresnelPower;
        this.material.uniforms.uLightColor.value = this.settings.lightColor;
        this.material.uniforms.uLightPosition.value = this.settings.lightPosition;
        this.material.uniforms.uFixedTopLeftRadius.value = this.settings.fixedTopLeftRadius;
        this.material.uniforms.uFixedBottomRightRadius.value = this.settings.fixedBottomRightRadius;
        this.material.uniforms.uSmallTopLeftRadius.value = this.settings.smallTopLeftRadius;
        this.material.uniforms.uSmallBottomRightRadius.value = this.settings.smallBottomRightRadius;
        this.material.uniforms.uCursorRadiusMin = this.settings.cursorRadiusMin;
        this.material.uniforms.uCursorRadiusMax = this.settings.cursorRadiusMax;
        this.material.uniforms.uCursorGlowIntensity.value = this.settings.cursorGlowIntensity;
        this.material.uniforms.uCursorGlowRadius.value = this.settings.cursorGlowRadius;
        this.material.uniforms.uCursorGlowColor.value = this.settings.cursorGlowColor;
        this.material.uniforms.uAnimationSpeed.value = this.settings.animationSpeed;
        this.material.uniforms.uMovementScale.value = this.settings.movementScale;
        this.material.uniforms.uMouseProximityEffect.value = this.settings.mouseProximityEffect;
        this.material.uniforms.uMinMovementScale.value = this.settings.minMovementScale;
        this.material.uniforms.uMaxMovementScale.value = this.settings.maxMovementScale;
        this.material.uniforms.uMergeDistance.value = this.settings.mergeDistance;

        // Обновляем CSS стили контейнера
        const container = document.getElementById('metaballs-container');
        if (container) {
            container.style.mixBlendMode = this.settings.enabled ? this.settings.blendMode : 'normal';
            container.style.opacity = this.settings.enabled ? this.settings.opacity : '0';
        }
    }

    setupControls() {
        // Создаем панель контролов
        const controlsPanel = document.createElement('div');
        controlsPanel.id = 'metaballs-controls';
        controlsPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px;
            color: white;
            font-family: monospace;
            font-size: 11px;
            backdrop-filter: blur(10px);
            z-index: 0;
            width: 300px;
            display: none;
        `;

        controlsPanel.innerHTML = `
            <div style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <h3 style="margin: 0; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: normal;">
                    <span>METABALLS CONTROLS</span>
                    <button id="closeMetaballsPanel" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; line-height: 1;">×</button>
                </h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span>Enable Effect</span>
                    <label class="switch">
                        <input type="checkbox" id="enableMetaballs" ${this.settings.enabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </label>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="margin-bottom: 8px; color: rgba(255,255,255,0.8);">Blend Mode</div>
                <div class="blend-mode-tabs" style="display: flex; margin-bottom: 15px; gap: 4px;">
                    <button class="blend-tab ${this.settings.blendMode === 'difference' ? 'active' : ''}" data-mode="difference">DIFF</button>
                    <button class="blend-tab ${this.settings.blendMode === 'exclusion' ? 'active' : ''}" data-mode="exclusion">EXCL</button>
                    <button class="blend-tab ${this.settings.blendMode === 'color-burn' ? 'active' : ''}" data-mode="color-burn">BURN</button>
                    <button class="blend-tab ${this.settings.blendMode === 'overlay' ? 'active' : ''}" data-mode="overlay">OVER</button>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: rgba(255,255,255,0.8);">Opacity</span>
                    <span id="opacityValue" style="font-family: monospace;">${(this.settings.opacity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" id="opacitySlider" min="0" max="100" step="1" value="${this.settings.opacity * 100}" style="width: 100%;">
            </div>

            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: rgba(255,255,255,0.8);">Blend Smoothness</span>
                    <span id="smoothnessValue" style="font-family: monospace;">${this.settings.smoothness.toFixed(2)}</span>
                </div>
                <input type="range" id="smoothnessSlider" min="0.1" max="1.0" step="0.01" value="${this.settings.smoothness}" style="width: 100%;">
            </div>

            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: rgba(255,255,255,0.8);">Sphere Count</span>
                    <span id="sphereCountValue" style="font-family: monospace;">${this.settings.sphereCount}</span>
                </div>
                <input type="range" id="sphereCountSlider" min="2" max="10" step="1" value="${this.settings.sphereCount}" style="width: 100%;">
            </div>

            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: rgba(255,255,255,0.8);">Animation Speed</span>
                    <span id="speedValue" style="font-family: monospace;">${this.settings.animationSpeed.toFixed(1)}</span>
                </div>
                <input type="range" id="speedSlider" min="0.1" max="3.0" step="0.1" value="${this.settings.animationSpeed}" style="width: 100%;">
            </div>

            <div style="display: flex; gap: 8px; margin-top: 20px;">
                <button id="resetMetaballsBtn" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; font-size: 11px;">Reset</button>
                <button id="randomMetaballsBtn" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; font-size: 11px;">Random</button>
            </div>

            <style>
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;
                }
                
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: .2s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 1px;
                    bottom: 1px;
                    background-color: white;
                    transition: .2s;
                }
                
                input:checked + .slider {
                    background-color: rgba(255,255,255,0.3);
                }
                
                input:checked + .slider:before {
                    transform: translateX(20px);
                }
                
                .blend-tab {
                    flex: 1;
                    padding: 6px 4px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: all 0.2s;
                }
                
                .blend-tab:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .blend-tab.active {
                    background: rgba(255,255,255,0.2);
                    border-color: rgba(255,255,255,0.3);
                    color: white;
                }
                
                input[type="range"] {
                    -webkit-appearance: none;
                    height: 2px;
                    background: rgba(255,255,255,0.2);
                }
                
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    cursor: pointer;
                }
                
                button:hover {
                    background: rgba(255,255,255,0.2) !important;
                }
            </style>
        `;

        document.body.appendChild(controlsPanel);
        this.setupControlListeners();

        // Создаем кнопку для открытия панели
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleMetaballsControls';
        toggleBtn.textContent = 'META';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            font-family: monospace;
            font-size: 11px;
            cursor: pointer;
            z-index: 1000;
            text-transform: uppercase;
        `;

        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('metaballs-controls');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.body.appendChild(toggleBtn);
    }

    setupControlListeners() {
        // Переключатель включения
        document.getElementById('enableMetaballs').addEventListener('change', (e) => {
            this.settings.enabled = e.target.checked;
            this.applySettings();
        });

        // Кнопки режимов наложения
        document.querySelectorAll('.blend-tab').forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.settings.blendMode = mode;
                
                document.querySelectorAll('.blend-tab').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                this.applySettings();
            });
        });

        // Слайдеры
        const sliders = [
            { id: 'opacitySlider', key: 'opacity', valueId: 'opacityValue', format: v => `${(v * 100).toFixed(0)}%` },
            { id: 'smoothnessSlider', key: 'smoothness', valueId: 'smoothnessValue', format: v => v.toFixed(2) },
            { id: 'sphereCountSlider', key: 'sphereCount', valueId: 'sphereCountValue', format: v => v },
            { id: 'speedSlider', key: 'animationSpeed', valueId: 'speedValue', format: v => v.toFixed(1) }
        ];

        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            
            element.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                
                if (slider.key === 'opacity') {
                    value = value / 100;
                }
                
                this.settings[slider.key] = value;
                valueElement.textContent = slider.format(value);
                this.applySettings();
            });
        });

        // Кнопки
        document.getElementById('resetMetaballsBtn').addEventListener('click', () => {
            this.resetToDefaults();
        });

        document.getElementById('randomMetaballsBtn').addEventListener('click', () => {
            this.setRandomValues();
        });

        document.getElementById('closeMetaballsPanel').addEventListener('click', () => {
            document.getElementById('metaballs-controls').style.display = 'none';
        });
    }

    resetToDefaults() {
        this.settings = {
            enabled: true,
            blendMode: 'difference',
            opacity: 0.4,
            sphereCount: 6,
            smoothness: 0.3,
            contrast: 2.0,
            fogDensity: 0.12,
            backgroundColor: new THREE.Color(0x050505),
            sphereColor: new THREE.Color(0x000000),
            ambientIntensity: 0.02,
            diffuseIntensity: 0.6,
            specularIntensity: 1.8,
            specularPower: 8,
            fresnelPower: 1.2,
            lightColor: new THREE.Color(0xffffff),
            lightPosition: new THREE.Vector3(1, 1, 1),
            fixedTopLeftRadius: 0.8,
            fixedBottomRightRadius: 0.9,
            smallTopLeftRadius: 0.3,
            smallBottomRightRadius: 0.35,
            cursorRadiusMin: 0.08,
            cursorRadiusMax: 0.15,
            cursorGlowIntensity: 0.4,
            cursorGlowRadius: 1.2,
            cursorGlowColor: new THREE.Color(0xffffff),
            animationSpeed: 0.6,
            movementScale: 1.2,
            mouseSmoothness: 0.1,
            mergeDistance: 1.5,
            mouseProximityEffect: true,
            minMovementScale: 0.3,
            maxMovementScale: 1.0
        };

        this.updateControlUI();
        this.applySettings();
    }

    setRandomValues() {
        this.settings.smoothness = 0.2 + Math.random() * 0.6;
        this.settings.sphereCount = 2 + Math.floor(Math.random() * 8);
        this.settings.animationSpeed = 0.2 + Math.random() * 2.5;
        this.settings.opacity = 0.2 + Math.random() * 0.6;
        
        const blendModes = ['difference', 'exclusion', 'color-burn', 'overlay'];
        this.settings.blendMode = blendModes[Math.floor(Math.random() * blendModes.length)];

        this.updateControlUI();
        this.applySettings();
    }

    updateControlUI() {
        document.getElementById('enableMetaballs').checked = this.settings.enabled;
        
        document.querySelectorAll('.blend-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.settings.blendMode) {
                btn.classList.add('active');
            }
        });
        
        document.getElementById('opacitySlider').value = this.settings.opacity * 100;
        document.getElementById('opacityValue').textContent = `${(this.settings.opacity * 100).toFixed(0)}%`;
        
        document.getElementById('smoothnessSlider').value = this.settings.smoothness;
        document.getElementById('smoothnessValue').textContent = this.settings.smoothness.toFixed(2);
        
        document.getElementById('sphereCountSlider').value = this.settings.sphereCount;
        document.getElementById('sphereCountValue').textContent = this.settings.sphereCount;
        
        document.getElementById('speedSlider').value = this.settings.animationSpeed;
        document.getElementById('speedValue').textContent = this.settings.animationSpeed.toFixed(1);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.metaballsRenderer = new MetaballsRenderer();
});