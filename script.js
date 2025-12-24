import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const overlay = document.getElementById('overlay');
const music = document.getElementById('bg-music');

let scene, camera, renderer, controls;
let treeGroup; 
let fallingTexts = []; 
let snowSystem; 

// Check dien thoai
const isMobile = window.innerWidth < 768;
const CONFIG = {
    treeParticles: isMobile ? 6000 : 15000,   
    textCount: isMobile ? 400 : 1000,         
    snowCount: isMobile ? 600 : 1500          
};

// list messaages
const messages = [
    "Giáng Sinh dui dẻ", 
    "Me ri Chít Mết 🎅", 
    "❤️", 
    "Giáng Sinh an lành", 
    "Hạnh phúc nhaaaa ", 
    "Nô En nhưng mà Nô Em",
    "Khư ri sư ma sư",
];

const textTextures = [];

overlay.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 1000);
    if(music) music.play().catch(e => console.log("Click để phát nhạc"));    
    document.fonts.load('bold 50px "Playwrite DE Grund"').then(() => {
        initThreeJS();
    }).catch(err => {
        console.log("Font chưa tải kịp, chạy fallback");
        initThreeJS();
    });
});

function preRenderTextures() {
    messages.forEach(msg => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600; 
        canvas.height = 250;
        
        const fontSize = isMobile ? "bold 40px" : "bold 50px";
        ctx.font = `${fontSize} 'Playwrite DE Grund', cursive`;
        ctx.fillStyle = "#ffffff"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#ffffff"; 
        ctx.shadowBlur = 70; 
        
        ctx.fillText(msg, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        textTextures.push(texture);
    });
}

function createSnowTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 32; canvas.height = 32;
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); // Tâm trắng
    gradient.addColorStop(1, 'rgba(255,255,255,0)'); // Viền trong suốt
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,32,32);
    return new THREE.CanvasTexture(canvas);
}

setInterval(() => {
    const errors = [   
        "❌ DELETING SYSTEM32...",
    ];
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    console.error(randomError); 
    console.warn("Dữ liệu đang bị rò rỉ..."); 
}, 2000);

function initThreeJS() {

    preRenderTextures();   
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 30);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true; 
    controls.autoRotateSpeed = 0.1;

    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    createParticleTree();
    createStraightRain();
    createSnow(); 
    animate();
}

function createParticleTree() {
    const particleCount = 10000;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const cls = [];
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        const h = Math.random() * 15;
        const r = (15 - h) * 0.4;
        const a = Math.random() * Math.PI * 2;
        const randR = r * Math.random(); 
        const x = Math.cos(a) * randR;
        const y = h - 7.5;
        const z = Math.sin(a) * randR;
        pos.push(x, y, z);
        
        const type = Math.random();
        if (type > 0.95) color.setHex(0xff0000);
        else if (type > 0.9) color.setHex(0xffd700);
        else color.setHSL(0.35, 1, 0.5);
        cls.push(color.r, color.g, color.b);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cls, 3));
    const mat = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const tree = new THREE.Points(geo, mat);
    treeGroup.add(tree);
}

function createStraightRain() {
    const count = 1100; 
    const geometry = new THREE.PlaneGeometry(5, 2.0); 

    for(let i=0; i<count; i++) {
        const tex = textTextures[Math.floor(Math.random() * textTextures.length)];
        
        const material = new THREE.MeshBasicMaterial({
            map: tex,
            color: 0xffffff, 
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, 
            depthWrite: false,
            opacity: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);

        const range = 35; 
        mesh.position.set(
            (Math.random() - 0.5) * range * 2, 
            (Math.random() - 0.5) * 30,        
            (Math.random() - 0.5) * range * 2  
        );

        mesh.userData = {
            speed: 0.03 + Math.random() * 0.07, 
        };
        
        scene.add(mesh);
        fallingTexts.push(mesh);
    }
}


function createSnow() {
    const snowCount = 1500; // so luong hat tuyet
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const velocities = []; 

    for (let i = 0; i < snowCount; i++) {
        // Vị trí ngẫu nhiên rộng khắp không gian
        pos.push(
            (Math.random() - 0.5) * 60, // X
            (Math.random() - 0.5) * 50, // Y
            (Math.random() - 0.5) * 60  // Z
        );
        
        velocities.push(0.02 + Math.random() * 0.05);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));

    const mat = new THREE.PointsMaterial({
        size: 0.4, // Kích thước hạt tuyết
        map: createSnowTexture(), 
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0xffffff
    });
    
    snowSystem = new THREE.Points(geo, mat);
    scene.add(snowSystem);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if(treeGroup) {
        treeGroup.rotation.y += 0.005;
    }
    
    // Đổi màu Neon
    const time = Date.now() * 0.0002; 
    const pulse = (Math.sin(time) + 1) / 2; 

    const colorBlue = new THREE.Color(0x00ffff); 
    const colorPink = new THREE.Color(0xff00ff); 
    
    const currentColor = new THREE.Color();
    currentColor.lerpColors(colorBlue, colorPink, pulse);

    const bottomLimit = -15;
    const topLimit = 15;

    fallingTexts.forEach(mesh => {
        mesh.position.y -= mesh.userData.speed;
        if (mesh.position.y < bottomLimit) {
            mesh.position.y = topLimit;
        }
        mesh.material.color.copy(currentColor);
        mesh.lookAt(camera.position); 
    });

    if (snowSystem) {
        const positions = snowSystem.geometry.attributes.position.array;
        const velocities = snowSystem.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            // Trừ trục Y (vị trí i+1) theo tốc độ riêng
            positions[i + 1] -= velocities[i / 3];

            // Nếu chạm đáy (-25), đưa lại lên đỉnh (25)
            if (positions[i + 1] < -25) {
                positions[i + 1] = 25;
            }
        }
        snowSystem.geometry.attributes.position.needsUpdate = true;
        
        snowSystem.rotation.y += 0.001;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});