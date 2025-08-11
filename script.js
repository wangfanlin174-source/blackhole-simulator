// 黑洞模拟器核心代码
class BlackHoleSimulator {
    constructor() {
        this.canvas = document.getElementById('blackholeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.webglCanvas = document.getElementById('bhWebglCanvas');
        this.gl = null;
        this.webglReady = false;
        this.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.activeDPR = this.devicePixelRatio; // 可动态降级
        this.resizeCanvasToDPR();
        this.isRunning = false;
        this.animationId = null;
        
        // 黑洞参数（位置在DPR设置后重置到中心）
        this.blackHole = {
            x: this.canvas.width / this.devicePixelRatio / 2,
            y: this.canvas.height / this.devicePixelRatio / 2,
            mass: 10, // 太阳质量
            spin: 0.5,
            radius: 45
        };

        // 背景恒星
        this.stars = this.generateStars(250);
        
        // 粒子系统
        this.particles = [];
        this.maxParticles = 500;
        this.effectiveMaxParticles = this.maxParticles;
        this.simulationSpeed = 1.0;
        
        // 显示选项
        this.showGravityField = true;
        this.showTrajectories = true;
        this.showAccretionDisk = true;
        this.renderQuality = 3; // 高质量
        // 动态质量与帧率监控
        this.dynamicQuality = 3; // 1=低 2=中 3=高
        this.frameTimeAvgMs = 16.7;
        this.frameCount = 0;
        this.lastRafTs = performance.now();
        this.lastDrawTs = this.lastRafTs;
        this.targetFps = 60; // 动态调整（60/30/20）

        // 离屏星空画布，降低每帧绘制开销
        this.starCanvas = document.createElement('canvas');
        this.starCtx = this.starCanvas.getContext('2d');
        this.starfieldRedrawIntervalFrames = 240; // 根据质量自适应调整
        
        // 控制元素
        this.initializeControls();
        this.createParticles();
        this.buildStarfieldCanvas();
        this.updateBlackHoleInfo();
        this.setupEventListeners();
        
        // 初始化覆盖层信息
        this.initializeOverlay();
        
        // 开始渲染循环
        this.render();

        // 监听窗口尺寸变化
        window.addEventListener('resize', () => {
            const prevCenter = { x: this.blackHole.x, y: this.blackHole.y };
            this.resizeCanvasToDPR();
            // 保持黑洞大致在画布中心
            this.blackHole.x = (this.canvas.width / this.devicePixelRatio) / 2;
            this.blackHole.y = (this.canvas.height / this.devicePixelRatio) / 2;
            this.stars = this.generateStars(250);
            this.createParticles();
            this.buildStarfieldCanvas();
        });

        // 初始化 WebGL
        this.initWebGL();
        
        // 检测移动设备并显示提示
        this.detectMobileDevice();
        
        // 滚动性能优化
        this.setupScrollOptimization();
        
        // 导航栏滚动效果
        this.setupNavScrollEffect();
    }

    resizeCanvasToDPR() {
        const rect = this.canvas.getBoundingClientRect();
        const cssWidth = rect.width || this.canvas.width;
        const cssHeight = rect.height || this.canvas.height;
        this.canvas.width = Math.floor(cssWidth * this.devicePixelRatio);
        this.canvas.height = Math.floor(cssHeight * this.devicePixelRatio);
        this.ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    }
    
    initializeControls() {
        // 质量控制
        const massSlider = document.getElementById('mass');
        const massValue = document.getElementById('massValue');
        massSlider.addEventListener('input', (e) => {
            this.blackHole.mass = parseInt(e.target.value);
            massValue.textContent = e.target.value;
            this.updateBlackHoleInfo();
            this.createParticles(); // 重新生成粒子
        });
        
        // 自转控制
        const spinSlider = document.getElementById('spin');
        const spinValue = document.getElementById('spinValue');
        spinSlider.addEventListener('input', (e) => {
            this.blackHole.spin = parseFloat(e.target.value);
            spinValue.textContent = e.target.value;
        });
        
        // 粒子数量控制
        const particlesSlider = document.getElementById('particles');
        const particlesValue = document.getElementById('particlesValue');
        particlesSlider.addEventListener('input', (e) => {
            this.maxParticles = parseInt(e.target.value);
            this.effectiveMaxParticles = this.maxParticles; // 用户变更时同步
            particlesValue.textContent = e.target.value;
            this.createParticles();
        });
        
        // 模拟速度控制
        const speedSlider = document.getElementById('speed');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.simulationSpeed = parseFloat(e.target.value);
            speedValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
        
        // 渲染质量控制
        const qualitySlider = document.getElementById('quality');
        const qualityValue = document.getElementById('qualityValue');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                const quality = parseInt(e.target.value);
                const qualityText = ['低', '中', '高'][quality - 1];
                qualityValue.textContent = qualityText;
                this.renderQuality = quality;
            });
        }
        
        // 背景恒星数量控制
        const starsSlider = document.getElementById('stars');
        const starsValue = document.getElementById('starsValue');
        if (starsSlider && starsValue) {
            starsSlider.addEventListener('input', (e) => {
                const starsCount = parseInt(e.target.value);
                starsValue.textContent = starsCount;
                this.stars = this.generateStars(starsCount);
            });
        }
        
        // 显示选项控制
        const showGravityField = document.getElementById('showGravityField');
        const showTrajectories = document.getElementById('showTrajectories');
        const showAccretionDisk = document.getElementById('showAccretionDisk');
        
        if (showGravityField) {
            showGravityField.addEventListener('change', (e) => {
                this.showGravityField = e.target.checked;
            });
        }
        
        if (showTrajectories) {
            showTrajectories.addEventListener('change', (e) => {
                this.showTrajectories = e.target.checked;
            });
        }
        
        if (showAccretionDisk) {
            showAccretionDisk.addEventListener('change', (e) => {
                this.showAccretionDisk = e.target.checked;
            });
        }
        
        // 快捷操作按钮
        const randomizeBtn = document.getElementById('randomizeBtn');
        const presetBtn = document.getElementById('presetBtn');
        const screenshotBtn = document.getElementById('screenshotBtn');
        
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.randomizeParameters();
            });
        }
        
        if (presetBtn) {
            presetBtn.addEventListener('click', () => {
                this.showPresetMenu();
            });
        }
        
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }
    }
    
    createParticles() {
        this.particles = [];
        const canvasWidth = this.canvas.width / this.devicePixelRatio;
        const canvasHeight = this.canvas.height / this.devicePixelRatio;
        
        const targetCount = this.effectiveMaxParticles || this.maxParticles;
        for (let i = 0; i < targetCount; i++) {
            // 在画布边缘随机生成粒子
            let x, y;
            const side = Math.floor(Math.random() * 4); // 0: 上, 1: 右, 2: 下, 3: 左
            
            switch (side) {
                case 0: // 上边
                    x = Math.random() * canvasWidth;
                    y = -10;
                    break;
                case 1: // 右边
                    x = canvasWidth + 10;
                    y = Math.random() * canvasHeight;
                    break;
                case 2: // 下边
                    x = Math.random() * canvasWidth;
                    y = canvasHeight + 10;
                    break;
                case 3: // 左边
                    x = -10;
                    y = Math.random() * canvasHeight;
                    break;
            }
            
            // 给粒子一个朝向黑洞的初始速度
            const dx = this.blackHole.x - x;
            const dy = this.blackHole.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.3 + Math.random() * 1.0;
            
            this.particles.push({
                x: x,
                y: y,
                vx: (dx / distance) * speed,
                vy: (dy / distance) * speed,
                mass: 0.1 + Math.random() * 0.3,
                size: 0.8 + Math.random() * 1.6,
                color: this.getRandomParticleColor(),
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    generateStars(count) {
        const stars = [];
        const w = this.canvas.width / this.devicePixelRatio;
        const h = this.canvas.height / this.devicePixelRatio;
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.2 + 0.3,
                a: Math.random() * 0.7 + 0.3
            });
        }
        return stars;
    }
    
    getRandomParticleColor() {
        const colors = [
            '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateParticles() {
        const G = 0.1; // 引力常数
        const eventHorizon = this.blackHole.radius * 1.8;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 计算到黑洞的距离
            const dx = this.blackHole.x - particle.x;
            const dy = this.blackHole.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果粒子进入事件视界，移除它
            if (distance < eventHorizon) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // 计算引力
            const force = (G * this.blackHole.mass * particle.mass) / Math.max(distance * distance, 25);
            let ax = (dx / distance) * force;
            let ay = (dy / distance) * force;
            
            // 应用自转效应（克尔黑洞效应）
            if (this.blackHole.spin > 0) {
                const spinForce = this.blackHole.spin * 0.12;
                const perpendicularX = -dy / distance;
                const perpendicularY = dx / distance;
                ax += perpendicularX * spinForce;
                ay += perpendicularY * spinForce;
            }
            
            // 更新速度和位置
            particle.vx += ax * this.simulationSpeed;
            particle.vy += ay * this.simulationSpeed;
            particle.x += particle.vx * this.simulationSpeed;
            particle.y += particle.vy * this.simulationSpeed;
            
            // 粒子生命周期管理
            particle.life -= 0.0008 * this.simulationSpeed;
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
            
            // 边界检查
            const wCss = this.canvas.width / this.devicePixelRatio;
            const hCss = this.canvas.height / this.devicePixelRatio;
            if (particle.x < -50 || particle.x > wCss + 50 ||
                particle.y < -50 || particle.y > hCss + 50) {
                this.particles.splice(i, 1);
            }
        }
        
        // 如果粒子数量不足，补充新的粒子
        const cap = this.effectiveMaxParticles || this.maxParticles;
        if (this.particles.length < cap * 0.8) {
            this.addNewParticles();
        }
    }
    
    addNewParticles() {
        const cap = this.effectiveMaxParticles || this.maxParticles;
        const needed = cap - this.particles.length;
        for (let i = 0; i < needed; i++) {
            this.addSingleParticle();
        }
    }
    
    addSingleParticle() {
        const canvasWidth = this.canvas.width / this.devicePixelRatio;
        const canvasHeight = this.canvas.height / this.devicePixelRatio;
        const side = Math.floor(Math.random() * 4);
        
        let x, y;
        switch (side) {
            case 0: x = Math.random() * canvasWidth; y = -10; break;
            case 1: x = canvasWidth + 10; y = Math.random() * canvasHeight; break;
            case 2: x = Math.random() * canvasWidth; y = canvasHeight + 10; break;
            case 3: x = -10; y = Math.random() * canvasHeight; break;
        }
        
        const dx = this.blackHole.x - x;
        const dy = this.blackHole.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.5 + Math.random() * 1.5;
        
        this.particles.push({
            x: x,
            y: y,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            mass: 0.1 + Math.random() * 0.3,
            size: 1 + Math.random() * 2,
            color: this.getRandomParticleColor(),
            life: 1.0,
            maxLife: 1.0
        });
    }
    
    render() {
        // 更新模拟时间
        const currentTime = performance.now();
        if (this.isRunning) {
            this.simulationTime += (currentTime - this.lastTime) * 0.001 * this.simulationSpeed;
        }
        this.lastTime = currentTime;
        
        const useWebGL = this.webglReady && this.useRealism;
        if (useWebGL) {
            this.drawWebGLFrame();
        } else {
            // 清除画布
            this.ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // 背景恒星
            this.drawStars();
            // 绘制引力场效果与吸积盘
            if (this.shouldDrawHeavy()) {
                this.drawGravityField();
                this.drawAccretionDisk();
            }
            // 更新和绘制粒子
            if (this.isRunning) {
                this.updateParticles();
            }
            this.drawParticles();
            // 绘制黑洞
            this.drawBlackHole();
            // 绘制事件视界
            if (this.shouldDrawHeavy()) {
                this.drawEventHorizon();
            }
        }
        
        // 自适应质量（基于上一帧耗时）
        const nowTs = performance.now();
        const frameMs = Math.max(0.1, nowTs - this.lastRafTs);
        this.lastRafTs = nowTs;
        this.updateAdaptiveQuality(frameMs);

        // 帧率限制：不足时间片直接跳过绘制，降低主线程压力
        const timeSinceDraw = nowTs - this.lastDrawTs;
        const frameBudget = 1000 / this.targetFps;
        if (timeSinceDraw < frameBudget) {
            this.animationId = requestAnimationFrame(() => this.render());
            return;
        }
        this.lastDrawTs = nowTs;

        // 更新覆盖层信息（每帧更新）
        this.updateOverlayInfo();
        
        // 继续渲染循环
        this.animationId = requestAnimationFrame(() => this.render());
    }

    shouldDrawHeavy() {
        if (!this.frameIndex) this.frameIndex = 0;
        this.frameIndex++;
        // 高质量每帧绘制， 中质量每2帧， 低质量每3帧
        const mod = this.dynamicQuality === 3 ? 1 : (this.dynamicQuality === 2 ? 2 : 3);
        return (this.frameIndex % mod) === 0;
    }

    // 根据帧耗时自适应质量，保障交互流畅
    updateAdaptiveQuality(frameMs) {
        // 指数滑动平均，降低波动
        this.frameTimeAvgMs = this.frameTimeAvgMs * 0.9 + frameMs * 0.1;
        this.frameCount++;

        // 动态调节质量档位
        if (this.frameTimeAvgMs > 22 && this.dynamicQuality > 1) {
            this.dynamicQuality -= 1; // 降级
        } else if (this.frameTimeAvgMs < 15 && this.dynamicQuality < 3) {
            this.dynamicQuality += 1; // 升级
        }

        // 质量映射
        this.currentSegments = this.dynamicQuality === 3 ? 100 : (this.dynamicQuality === 2 ? 70 : 40);
        this.starfieldRedrawIntervalFrames = this.dynamicQuality === 3 ? 240 : (this.dynamicQuality === 2 ? 360 : 600);

        // 动态目标帧率
        if (this.frameTimeAvgMs > 28) this.targetFps = 20;
        else if (this.frameTimeAvgMs > 20) this.targetFps = 30;
        else this.targetFps = 60;

        // 动态DPR降级（保障交互优先）
        const desiredDpr = (this.frameTimeAvgMs > 26) ? 1.25 : (this.frameTimeAvgMs > 20 ? 1.5 : this.devicePixelRatio);
        if (Math.abs((this.activeDPR || 1) - desiredDpr) > 0.05) {
            this.activeDPR = desiredDpr;
            // 重新应用DPR到画布
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.floor(rect.width * this.activeDPR);
            this.canvas.height = Math.floor(rect.height * this.activeDPR);
            this.ctx.setTransform(this.activeDPR, 0, 0, this.activeDPR, 0, 0);
            // 相关资源需重建
            this.buildStarfieldCanvas();
        }

        // 粒子上限按质量缩放，避免过载
        const scale = this.dynamicQuality === 3 ? 1.0 : (this.dynamicQuality === 2 ? 0.7 : 0.45);
        this.effectiveMaxParticles = Math.max(100, Math.floor(this.maxParticles * scale));

        // 按一定帧间隔重建一次星空离屏缓存，避免每帧重绘
        if (this.frameCount % this.starfieldRedrawIntervalFrames === 0) {
            this.buildStarfieldCanvas();
        }
    }

    initWebGL() {
        if (!this.webglCanvas) return;
        try {
            this.gl = this.webglCanvas.getContext('webgl') || this.webglCanvas.getContext('experimental-webgl');
            if (!this.gl) return;
        } catch (e) { return; }
        this.webglReady = false;

    }

    setupWebGLProgram() {
        const gl = this.gl;
        if (!gl) return;
        // 顶点着色器：全屏矩形
        const vsSource = `
        attribute vec2 aPos;
        void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
        `;
        // 片元着色器：更真实的黑洞光线近似（EHT 风格）
        const fsSource = `
        precision highp float;
        uniform vec2 uRes;
        uniform float uTime;
        
        // 更真实的黑洞着色器
        float sdCircle(vec2 p, float r){ return length(p) - r; }
        float noise(vec2 p) { return fract(sin(dot(p,vec2(12.9898,78.233))) * 43758.5453); }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));
          for (int i = 0; i < 5; ++i) {
            v += a * noise(p); p = rot * p * 2.0 + shift; a *= 0.5;
          }
          return v;
        }
        
        void main(){
          vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
          uv.x *= uRes.x / uRes.y;
          float t = uTime * 0.2;
          // 黑洞阴影（EHT 风格）
          float rHole = 0.18;
          float d = sdCircle(uv, rHole);
          vec3 col = vec3(0.01,0.01,0.02);
          
          // 光子环（多层）
          float ring1 = smoothstep(0.0, 0.005, abs(length(uv) - (rHole*1.5)));
          float ring2 = smoothstep(0.0, 0.003, abs(length(uv) - (rHole*2.2)));
          col += ring1 * vec3(1.0,0.8,0.4) * 0.8;
          col += ring2 * vec3(0.8,0.6,0.3) * 0.4;
          
          // 吸积盘（更真实）
          vec2 p = mat2(cos(0.15),-sin(0.15), sin(0.15),cos(0.15)) * uv;
          float disk = smoothstep(0.4, 0.38, abs(p.y));
          float diskEdge = smoothstep(0.0, 0.02, abs(p.y) - 0.38);
          float grad = smoothstep(0.15, 0.85, abs(p.x));
          
          // 多普勒增亮 + 湍流
          float doppler = 0.4 + 0.6 * clamp(1.2 - (p.x+0.5), 0.0, 1.0);
          float turb = fbm(p * 8.0 + t * 0.5) * 0.3;
          vec3 diskCol = mix(vec3(1.0,0.7,0.4), vec3(1.0,0.4,0.2), grad);
          diskCol += turb * vec3(0.2,0.1,0.0);
          
          col = mix(col, diskCol, disk * 0.9);
          col += diskEdge * vec3(0.8,0.5,0.2) * 0.6;
          
          // 引力透镜效果
          float lens = smoothstep(0.8, 0.3, length(uv));
          col *= 0.7 + 0.3 * lens;
          
          // 背景星场
          vec2 starUV = uv * 3.0;
          float stars = 0.0;
          for(int i = 0; i < 20; i++) {
            vec2 star = vec2(noise(vec2(float(i),0.0)), noise(vec2(0.0,float(i))));
            float dist = length(starUV - star);
            stars += smoothstep(0.02, 0.0, dist) * 0.4;
          }
          col += stars * vec3(0.8,0.8,1.0);
          
          // 中心黑洞
          col = mix(col, vec3(0.0), smoothstep(0.0, 0.02, -d));
          
          // 最终调色
          col = pow(col, vec3(0.8));
          gl_FragColor = vec4(col, 1.0);
        }
        `;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource); gl.compileShader(vs);
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource); gl.compileShader(fs);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        this.webglProg = prog;
        this.uRes = gl.getUniformLocation(prog, 'uRes');
        this.uTime = gl.getUniformLocation(prog, 'uTime');

        const quad = new Float32Array([
            -1,-1,  1,-1, -1, 1,
            -1, 1,  1,-1,  1, 1,
        ]);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
        this.aPos = gl.getAttribLocation(prog, 'aPos');
    }

    drawWebGLFrame() {
        const gl = this.gl; if (!gl || !this.webglProg) return;
        gl.viewport(0,0,this.webglCanvas.width,this.webglCanvas.height);
        gl.clearColor(0.02,0.02,0.05,1.0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.webglProg);
        gl.uniform2f(this.uRes, this.webglCanvas.width, this.webglCanvas.height);
        gl.uniform1f(this.uTime, performance.now()*0.001);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    drawGravityField() {
        // 多层引力场效果
        for (let i = 0; i < 3; i++) {
            const radius = this.blackHole.radius * (2 + i * 1.5);
            const gradient = this.ctx.createRadialGradient(
                this.blackHole.x, this.blackHole.y, 0,
                this.blackHole.x, this.blackHole.y, radius
            );
            const alpha = 0.06 - i * 0.02;
            const hue = 15 + i * 20; // 从橙红到黄
            gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
            gradient.addColorStop(0.4, `hsla(${hue}, 100%, 60%, ${alpha * 0.6})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 引力波涟漪效果
        const time = Date.now() * 0.001;
        for (let i = 0; i < 2; i++) {
            const waveRadius = this.blackHole.radius * 3 + Math.sin(time * 2 + i * Math.PI) * 20;
            this.ctx.strokeStyle = `rgba(255, 150, 100, ${0.3 - i * 0.1})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.blackHole.x, this.blackHole.y, waveRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawStars() {
        // 直接绘制离屏缓存，避免每帧生成大量渐变与路径
        this.ctx.drawImage(this.starCanvas, 0, 0);
    }

    // 构建星空与星云的离屏缓存
    buildStarfieldCanvas() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w <= 0 || h <= 0) return;
        this.starCanvas.width = w;
        this.starCanvas.height = h;
        const ctx = this.starCtx;
        ctx.clearRect(0, 0, w, h);

        // 背景渐变（静态）
        const grad1 = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.8);
        grad1.addColorStop(0, 'rgba(100, 50, 150, 0.10)');
        grad1.addColorStop(0.5, 'rgba(150, 100, 200, 0.05)');
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        const grad2 = ctx.createRadialGradient(w * 0.7, h * 0.8, 0, w * 0.7, h * 0.8, w * 0.6);
        grad2.addColorStop(0, 'rgba(200, 100, 50, 0.08)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);

        // 恒星（数量按质量档位缩放）
        const scale = this.dynamicQuality === 3 ? 1.0 : (this.dynamicQuality === 2 ? 0.7 : 0.5);
        const starsToDraw = Math.floor(this.stars.length * scale);
        for (let i = 0; i < starsToDraw; i++) {
            const s = this.stars[i];
            ctx.save();
            ctx.globalAlpha = s.a;
            const gx = s.x / this.devicePixelRatio;
            const gy = s.y / this.devicePixelRatio;
            const glowRadius = s.r * 3;
            const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowRadius);
            glow.addColorStop(0, `rgba(255,255,255,${s.a * 0.8})`);
            glow.addColorStop(0.5, `rgba(255,255,200,${s.a * 0.4})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(gx, gy, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(gx, gy, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawAccretionDisk() {
        const ctx = this.ctx;
        const x = this.blackHole.x;
        const y = this.blackHole.y;
        const time = Date.now() * 0.001;
        const inner = this.blackHole.radius * 1.2; // 光子球近内缘
        const outer = this.blackHole.radius * 3.2; // 吸积盘外缘

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 12); // 轻微倾角

        // 多层盘体渐变（含多普勒增亮：一侧更亮）
        for (let layer = 0; layer < 3; layer++) {
            const layerInner = inner + layer * 0.3;
            const layerOuter = outer - layer * 0.2;
            const alpha = 0.3 - layer * 0.1;
            
            const grad = ctx.createRadialGradient(0, 0, layerInner, 0, 0, layerOuter);
            grad.addColorStop(0, `rgba(255,210,120,${alpha * 0.3})`);
            grad.addColorStop(0.2, `rgba(255,180,80,${alpha * 0.8})`);
            grad.addColorStop(0.6, `rgba(255,120,60,${alpha * 0.6})`);
            grad.addColorStop(1, `rgba(255,80,40,${alpha * 0.1})`);
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.ellipse(0, 0, layerOuter, layerOuter * 0.35, 0, 0, Math.PI * 2);
            ctx.ellipse(0, 0, layerInner, layerInner * 0.35, 0, 0, Math.PI * 2, true);
            ctx.fill('evenodd');
        }

        // 动态多普勒增亮条带
        const segments = this.currentSegments || 80;
        for (let i = 0; i < segments; i++) {
            const t = i / segments * Math.PI * 2;
            const brightness = 0.6 + 0.4 * Math.cos(t - time * this.blackHole.spin);
            const alpha = 0.2 * brightness;
            
            // 主条带
            ctx.strokeStyle = `rgba(255,200,150,${alpha})`;
            ctx.lineWidth = this.dynamicQuality >= 3 ? 3 : (this.dynamicQuality === 2 ? 2 : 1);
            ctx.shadowColor = `rgba(255,200,150,${alpha * 0.4})`;
            ctx.shadowBlur = this.dynamicQuality >= 3 ? 5 : (this.dynamicQuality === 2 ? 3 : 1);
            ctx.beginPath();
            const rx = outer * Math.cos(t);
            const ry = outer * 0.35 * Math.sin(t);
            ctx.moveTo(rx * 0.92, ry * 0.92);
            ctx.lineTo(rx, ry);
            ctx.stroke();
            
            // 发光条带
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(255,255,200,${alpha * 0.6})`;
            ctx.lineWidth = this.dynamicQuality === 1 ? 0.5 : 1;
            ctx.stroke();
        }

        ctx.restore();

        // 光子环（photon ring）- 多层
        ctx.save();
        for (let ring = 0; ring < 2; ring++) {
            const ringRadius = this.blackHole.radius * (1.5 + ring * 0.3);
            const ringAlpha = 0.8 - ring * 0.3;
            ctx.strokeStyle = `rgba(255, 180, 120, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = `rgba(255, 180, 120, ${ringAlpha * 0.5})`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x, y, this.blackHole.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life / particle.maxLife;
                const lowQ = this.dynamicQuality === 1;
                const midQ = this.dynamicQuality === 2;
                
                // 绘制粒子轨迹（发光效果）
                if (!lowQ && particle.trail && particle.trail.length > 1) {
                    // 轨迹发光
                    this.ctx.shadowColor = particle.color;
                    this.ctx.shadowBlur = midQ ? 4 : 8;
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.lineWidth = midQ ? 2 : 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                    for (let i = 1; i < particle.trail.length; i++) {
                        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                    }
                    this.ctx.stroke();
                    
                    // 轨迹渐变
                    this.ctx.shadowBlur = 0;
                    this.ctx.lineWidth = midQ ? 1 : 1;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.stroke();
                }
                
                // 粒子发光效果（按质量档位简化）
                if (!lowQ) {
                    this.ctx.shadowColor = particle.color;
                    this.ctx.shadowBlur = midQ ? 8 : 15;
                    const glowRadius = particle.size * (midQ ? 1.6 : 2.0);
                    const glowGradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, glowRadius
                    );
                    glowGradient.addColorStop(0, particle.color);
                    glowGradient.addColorStop(0.6, particle.color + '80');
                    glowGradient.addColorStop(1, 'transparent');
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 粒子核心
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, lowQ ? Math.max(0.6, particle.size * 0.8) : particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        });
    }
    
    drawBlackHole() {
        const time = Date.now() * 0.001;
        
        // 黑洞核心（多层引力透镜暗影）
        for (let i = 0; i < (this.dynamicQuality >= 3 ? 3 : (this.dynamicQuality === 2 ? 2 : 1)); i++) {
            const radius = this.blackHole.radius * (0.8 + i * 0.2);
            const gradient = this.ctx.createRadialGradient(
                this.blackHole.x, this.blackHole.y, 0,
                this.blackHole.x, this.blackHole.y, radius
            );
            const alpha = 1.0 - i * 0.3;
            gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
            gradient.addColorStop(0.7, `rgba(0,0,0,${alpha * 0.8})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0.0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.blackHole.x, this.blackHole.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 动态引力透镜发光边缘
        const edgeRadius = this.blackHole.radius + 3 + Math.sin(time * 3) * 2;
        this.ctx.strokeStyle = 'rgba(255, 200, 150, 0.5)';
        this.ctx.lineWidth = this.dynamicQuality === 1 ? 2 : 3;
        this.ctx.shadowColor = 'rgba(255, 200, 150, 0.8)';
        this.ctx.shadowBlur = this.dynamicQuality >= 3 ? 10 : (this.dynamicQuality === 2 ? 6 : 2);
        this.ctx.beginPath();
        this.ctx.arc(this.blackHole.x, this.blackHole.y, edgeRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 内部光子球
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(255, 150, 100, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.arc(this.blackHole.x, this.blackHole.y, this.blackHole.radius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // 黑洞中心脉冲
        const pulseRadius = this.blackHole.radius * 0.3 + Math.sin(time * 5) * 5;
        this.ctx.strokeStyle = `rgba(255, 100, 50, ${0.4 + Math.sin(time * 5) * 0.2})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.blackHole.x, this.blackHole.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawEventHorizon() {
        const time = Date.now() * 0.001;
        
        // 多层事件视界
        for (let i = 0; i < (this.dynamicQuality >= 2 ? 2 : 1); i++) {
            const radius = this.blackHole.radius * (2 + i * 0.5);
            const alpha = 0.4 - i * 0.1;
            const dashLength = 8 - i * 2;
            
            this.ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([dashLength, dashLength]);
            this.ctx.beginPath();
            this.ctx.arc(this.blackHole.x, this.blackHole.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        
        // 动态事件视界警告线
        const warningRadius = this.blackHole.radius * 2.5;
        const warningAlpha = 0.5 + Math.sin(time * 2) * 0.2;
        this.ctx.strokeStyle = `rgba(255, 50, 50, ${warningAlpha})`;
        this.ctx.lineWidth = this.dynamicQuality === 1 ? 2 : 3;
        this.ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
        this.ctx.shadowBlur = this.dynamicQuality >= 3 ? 8 : (this.dynamicQuality === 2 ? 4 : 1);
        this.ctx.beginPath();
        this.ctx.arc(this.blackHole.x, this.blackHole.y, warningRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // 信息视界（Information Horizon）
        const infoRadius = this.blackHole.radius * 3.5;
        this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([15, 10]);
        this.ctx.beginPath();
        this.ctx.arc(this.blackHole.x, this.blackHole.y, infoRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    startSimulation() {
        // 立即设置状态，减少延迟
        this.isRunning = true;
        
        // 使用requestAnimationFrame优化DOM更新
        requestAnimationFrame(() => {
            const startBtn = document.getElementById('startBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            if (startBtn) startBtn.textContent = '运行中...';
            if (startBtn) startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            
            // 更新覆盖层状态
            this.updateOverlayInfo();
        });
    }
    
    pauseSimulation() {
        // 立即设置状态，减少延迟
        this.isRunning = false;
        
        // 使用requestAnimationFrame优化DOM更新
        requestAnimationFrame(() => {
            const startBtn = document.getElementById('startBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            if (startBtn) startBtn.textContent = '继续';
            if (startBtn) startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;
            
            // 更新覆盖层状态
            this.updateOverlayInfo();
        });
    }
    
    resetSimulation() {
        this.isRunning = false;
        this.simulationTime = 0;
        document.getElementById('startBtn').textContent = '开始模拟';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        this.createParticles();
        
        // 更新覆盖层状态
        this.updateOverlayInfo();
    }
    
    updateBlackHoleInfo() {
        // 计算史瓦西半径 (2GM/c²)
        const schwarzschildRadius = (2 * 6.67e-11 * this.blackHole.mass * 1.989e30) / (3e8 * 3e8);
        const radiusKm = (schwarzschildRadius / 1000).toFixed(1);
        
        document.getElementById('schwarzschildRadius').textContent = `${radiusKm} km`;
        document.getElementById('eventHorizon').textContent = `${radiusKm} km`;
        
        // 更新引力强度描述
        let gravityStrength = '弱';
        if (this.blackHole.mass > 50) gravityStrength = '极强';
        else if (this.blackHole.mass > 20) gravityStrength = '强';
        else if (this.blackHole.mass > 10) gravityStrength = '中等';
        
        document.getElementById('gravityStrength').textContent = gravityStrength;
        
        // 更新覆盖层信息
        this.updateOverlayInfo();
    }
    
    initializeOverlay() {
        // 初始化覆盖层元素
        this.overlayElements = {
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            particleCount: document.getElementById('overlayParticleCount'),
            simTime: document.getElementById('overlaySimTime')
        };
        
        // 初始化模拟时间
        this.simulationTime = 0;
        this.lastTime = performance.now();
        
        // 更新初始状态
        this.updateOverlayInfo();
    }
    
    updateOverlayInfo() {
        if (!this.overlayElements) return;
        
        // 更新状态指示器
        if (this.overlayElements.statusIndicator) {
            this.overlayElements.statusIndicator.className = 'status-indicator';
            if (this.isRunning) {
                this.overlayElements.statusIndicator.classList.add('running');
            } else {
                this.overlayElements.statusIndicator.classList.add('paused');
            }
        }
        
        // 更新状态文本
        if (this.overlayElements.statusText) {
            if (this.isRunning) {
                this.overlayElements.statusText.textContent = '模拟运行中';
            } else {
                this.overlayElements.statusText.textContent = '已暂停';
            }
        }
        
        // 更新粒子数量
        if (this.overlayElements.particleCount) {
            this.overlayElements.particleCount.textContent = this.particles.length;
        }
        
        // 更新模拟时间
        if (this.overlayElements.simTime) {
            this.overlayElements.simTime.textContent = `${this.simulationTime.toFixed(1)}s`;
        }
    }
    
    setupEventListeners() {
        // 画布点击事件 - 移动黑洞位置
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 检查是否点击在黑洞附近
            const dx = x - this.blackHole.x;
            const dy = y - this.blackHole.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.blackHole.radius * 3) {
                this.blackHole.x = x;
                this.blackHole.y = y;
            }
        });
        
        // 触摸支持 - 移动黑洞位置和手势控制
        let touchStartY = 0;
        let touchStartTime = 0;
        let touchStartX = 0;
        let isTouchMove = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
            touchStartTime = Date.now();
            isTouchMove = false;
            
            // 检查是否触摸在黑洞附近
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const dx = x - this.blackHole.x;
            const dy = y - this.blackHole.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.blackHole.radius * 3) {
                this.blackHole.x = x;
                this.blackHole.y = y;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            isTouchMove = true;
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // 如果没有移动，直接返回
            if (isTouchMove) return;
            
            const touch = e.changedTouches[0];
            const deltaY = touch.clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            
            // 快速上下滑动切换模拟状态（减少延迟）
            if (Math.abs(deltaY) > 30 && deltaTime < 200) {
                if (deltaY > 0) {
                    // 向下滑动 - 暂停（立即响应）
                    if (this.isRunning) {
                        this.pauseSimulation();
                        // 添加触摸反馈
                        this.showTouchFeedback('暂停', 'down');
                    }
                } else {
                    // 向上滑动 - 开始（立即响应）
                    if (!this.isRunning) {
                        this.startSimulation();
                        // 添加触摸反馈
                        this.showTouchFeedback('开始', 'up');
                    }
                }
            }
        }, { passive: false });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            const step = 10;
            switch (e.key) {
                case 'ArrowUp':
                    this.blackHole.y = Math.max(this.blackHole.radius, this.blackHole.y - step);
                    break;
                case 'ArrowDown':
                    this.blackHole.y = Math.min(this.canvas.height - this.blackHole.radius, this.blackHole.y + step);
                    break;
                case 'ArrowLeft':
                    this.blackHole.x = Math.max(this.blackHole.radius, this.blackHole.x - step);
                    break;
                case 'ArrowRight':
                    this.blackHole.x = Math.min(this.canvas.width - this.blackHole.radius, this.blackHole.x + step);
                    break;
                case ' ':
                    e.preventDefault();
                    if (this.isRunning) {
                        this.pauseSimulation();
                    } else {
                        this.startSimulation();
                    }
                    break;
            }
        });
    }
    
    // 显示触摸反馈
    showTouchFeedback(message, direction) {
        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: ${direction === 'up' ? '20%' : '60%'};
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 122, 255, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 600;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // 显示反馈
        requestAnimationFrame(() => {
            feedback.style.opacity = '1';
        });
        
        // 自动隐藏
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 200);
        }, 800);
    }
    
    // 滚动性能优化
    setupScrollOptimization() {
        // 使用 requestAnimationFrame 优化滚动事件，减少卡顿
        let ticking = false;
        
        const optimizeScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // 滚动时的性能优化
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // 监听滚动事件 - 使用 passive 提高性能
        window.addEventListener('scroll', optimizeScroll, { passive: true });
        
        // 只在画布区域阻止触摸滚动，避免影响页面滚动
        this.canvas.addEventListener('touchmove', (e) => {
            // 只在画布区域阻止默认滚动，避免影响页面滚动
            e.preventDefault();
        }, { passive: false });
        
        // 优化页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面不可见时暂停模拟
                if (this.isRunning) {
                    this.pauseSimulation();
                }
            }
        });
        
        // 添加触摸滚动优化提示
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            console.log('iPad触摸滚动已优化');
        }
    }
    
    // 检测移动设备并显示提示
    detectMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         (window.innerWidth <= 768);
        
        if (isMobile) {
            const mobileTips = document.querySelector('.mobile-tips');
            if (mobileTips) {
                mobileTips.style.display = 'block';
            }
            
            // 检测iPad竖屏模式
            const isIPadPortrait = /iPad/i.test(navigator.userAgent) && 
                                  window.innerWidth <= 1024 && 
                                  window.innerWidth > 768 &&
                                  window.innerHeight > window.innerWidth;
            
            if (isIPadPortrait) {
                // iPad竖屏优化设置
                this.maxParticles = Math.min(this.maxParticles, 400);
                this.simulationSpeed = 1.0;
                
                // 调整画布尺寸以适应竖屏
                this.resizeCanvasToDPR();
                
                // 显示iPad竖屏提示
                if (mobileTips) {
                    mobileTips.innerHTML = `
                        <div class="tip-content">
                            <h4>📱 iPad竖屏模式</h4>
                            <ul>
                                <li>👆 触摸画布移动黑洞位置</li>
                                <li>⬆️ 向上滑动开始模拟</li>
                                <li>⬇️ 向下滑动暂停模拟</li>
                                <li>🔧 使用下方控制台调节参数</li>
                                <li>💡 已优化竖屏布局和性能</li>
                            </ul>
                        </div>
                    `;
                }
            } else {
                // 其他移动设备设置
                this.maxParticles = Math.min(this.maxParticles, 300);
                this.simulationSpeed = 0.8;
            }
        }
    }
    
    setupNavScrollEffect() {
        const topbar = document.querySelector('.topbar');
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // 添加滚动类
            if (currentScrollY > 10) {
                topbar.classList.add('scrolled');
            } else {
                topbar.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        }, { passive: true });
    }
    
    // 随机化参数
    randomizeParameters() {
        // 随机黑洞质量
        const randomMass = Math.floor(Math.random() * 50) + 5;
        document.getElementById('mass').value = randomMass;
        document.getElementById('massValue').textContent = randomMass;
        this.blackHole.mass = randomMass;
        
        // 随机自转速度
        const randomSpin = Math.round(Math.random() * 10) / 10;
        document.getElementById('spin').value = randomSpin;
        document.getElementById('spinValue').textContent = randomSpin;
        this.blackHole.spin = randomSpin;
        
        // 随机粒子数量
        const randomParticles = Math.floor(Math.random() * 1000) + 200;
        document.getElementById('particles').value = randomParticles;
        document.getElementById('particlesValue').textContent = randomParticles;
        this.maxParticles = randomParticles;
        
        // 更新显示
        this.updateBlackHoleInfo();
        this.createParticles();
        
        // 显示提示
        this.showNotification('参数已随机化');
    }
    
    // 预设菜单（禁用弹出，改为无操作，避免底部弹层）
    showPresetMenu() {
        // 如有残留菜单，清理掉
        const exist = document.querySelector('.preset-menu');
        if (exist) exist.remove();
        // 引导：预设已移动到控制台顶部
        this.showNotification('预设已移动到控制台顶部');
        return;
    }
    
    // 应用预设
    applyPreset(preset) {
        // 应用质量
        document.getElementById('mass').value = preset.mass;
        document.getElementById('massValue').textContent = preset.mass;
        this.blackHole.mass = preset.mass;
        
        // 应用自转
        document.getElementById('spin').value = preset.spin;
        document.getElementById('spinValue').textContent = preset.spin;
        this.blackHole.spin = preset.spin;
        
        // 应用粒子数量
        document.getElementById('particles').value = preset.particles;
        document.getElementById('particlesValue').textContent = preset.particles;
        this.maxParticles = preset.particles;
        
        // 更新显示
        this.updateBlackHoleInfo();
        this.createParticles();
        
        // 移除菜单
        document.querySelector('.preset-menu')?.remove();
        
        // 显示提示（居中）
        this.showNotificationCenter(`已应用预设: ${preset.name}`);
    }
    
    // 截图功能
    takeScreenshot() {
        const canvas = this.canvas;
        const link = document.createElement('a');
        link.download = `blackhole-simulation-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        this.showNotification('截图已保存');
    }
    
    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        // 强制定位到顶部居中，避免旧缓存样式导致在底部
        notification.style.position = 'fixed';
        notification.style.top = '16px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.zIndex = '9999';
        notification.style.pointerEvents = 'none';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // 居中通知（用于应用预设等场景）
    showNotificationCenter(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.zIndex = '9999';
        notification.style.pointerEvents = 'none';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 50);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250);
        }, 1200);
    }
}

// 页面加载完成后初始化模拟器
document.addEventListener('DOMContentLoaded', () => {
    // 添加加载动画
    const startBtn = document.getElementById('startBtn');
    startBtn.innerHTML = '<span class="loading"></span> 初始化中...';
    startBtn.disabled = true;
    
    // 延迟初始化以显示加载效果
    setTimeout(() => {
        const simulator = new BlackHoleSimulator();
        
        // 启用按钮
        startBtn.innerHTML = '开始模拟';
        startBtn.disabled = false;
        
        // 添加一些初始粒子动画
        setTimeout(() => {
            simulator.startSimulation();
        }, 1000);
        
        // 全局访问
        window.blackHoleSimulator = simulator;
    }, 1500);
    
    // 主题切换
    // 苹果风：默认浅色，移除开关
    document.body.classList.add('light');
    localStorage.setItem('bh_theme', 'light');

    // 顶部CTA映射到开始按钮
    const cta = document.getElementById('ctaStart');
    if (cta) {
        cta.addEventListener('click', () => {
            const btn = document.getElementById('startBtn');
            if (btn) btn.click();
            // 平滑滚动到演示区
            const showcase = document.getElementById('showcase');
            showcase && showcase.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // 取消标题动画，保持稳态排版
});

// 添加粒子数量显示
setInterval(() => {
    if (window.blackHoleSimulator) {
        const particleCount = window.blackHoleSimulator.particles.length;
        const maxParticles = window.blackHoleSimulator.maxParticles;
        document.getElementById('particlesValue').textContent = `${particleCount}/${maxParticles}`;
    }
}, 1000);
