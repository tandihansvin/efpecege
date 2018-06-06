// Data store
let jsonData;
const offsetX = 30;
const offsetY = 7;

// Session store
let level = 1;
let state = 0; // 0: loading; 1: playing; 2: lose; 3: win;

// Meshes
let player, platform;
let rightSmall, leftSmall;
let listOfBox = [];
let exit;

// Scene globals
let camera;

//controller
let up, dn, lf, rg;
let direction;

function createMat(scene,pic){
    let mat = new BABYLON.StandardMaterial(pic, scene);
    mat.diffuseTexture = new BABYLON.Texture(pic, scene);
    mat.alpha = 1;
    return mat;
}

function createBackground(scene){
    let mat = new BABYLON.StandardMaterial("Mat", scene);
    mat.alpha = 0;

    let plane = BABYLON.MeshBuilder.CreatePlane("plane", {height: 18, width: 60}, scene);
    plane.material = mat;
    plane.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, restitution: 0.3, friction: 0, move: false });

    let inviPlane = BABYLON.MeshBuilder.CreatePlane("plane2", {height: 18, width: 60}, scene);
    inviPlane.position.z = -1;
    inviPlane.material = mat;
    inviPlane.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, restitution: 0.3, friction: 0, move: false });
}

function createSkybox(scene){
    let skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:250.0}, scene);
    let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/greenhaze", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
}

function createScene(engine){
    //creating scene
    let scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), new BABYLON.OimoJSPlugin());

    // Camera
    camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 4, new BABYLON.Vector3(-6, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(-16,3,-16));

    // Light
    let light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 0, -1), scene);

    //background
    createBackground(scene);
    createSkybox(scene);
    return scene;
}

function createPlayer(start, scene) {
    player = new BABYLON.Mesh.CreateBox("player", 1, scene);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {mass:0.1, restitution:0, friction:0},scene);
    player.position = new BABYLON.Vector3(start[0]-offsetX, offsetY-start[1], -0.5);

    // Invisible texture
    let inv = new BABYLON.StandardMaterial("invisible", scene);
    inv.alpha = 0;

    // Add small for collision detection
    leftSmall = new BABYLON.Mesh.CreateBox("Lsmall", 0.5, scene);
    leftSmall.parent = player;
    leftSmall.translate(BABYLON.Axis.X, -0.5, BABYLON.Space.LOCAL);
    leftSmall.material = inv;

    rightSmall = new BABYLON.Mesh.CreateBox("Rsmall", 0.5, scene);
    rightSmall.parent = player;
    rightSmall.translate(BABYLON.Axis.X, 0.5, BABYLON.Space.LOCAL);
    rightSmall.material = inv;

    // Texture
    let mat = new BABYLON.StandardMaterial("awesm", scene);
    mat.diffuseTexture = new BABYLON.Texture("textures/player.png", scene);
    mat.diffuseTexture.hasAlpha = true;
    mat.backFaceCulling = false;
    player.material = mat;
}

function createExit(end, scene) {
    exit = new BABYLON.Mesh.CreateBox("exit", 1, scene);
    exit.position = new BABYLON.Vector3(end[0]-offsetX, offsetY-end[1], -0.5);
    exit.physicsImpostor = new BABYLON.PhysicsImpostor(exit, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution:0, friction:0},scene);
    exit.physicsImpostor.registerOnPhysicsCollide(player.physicsImpostor, function(main, collided){
        handleWin(scene);
    });

    exit.material = createMat(scene, "textures/goal.png");
}

function createPlatform(box, boxSize, scene){
    platform = new BABYLON.Mesh.CreateBox("platform", 1, scene);
    platform.scaling = new BABYLON.Vector3(boxSize[0], boxSize[1], 1);
    platform.position = new BABYLON.Vector3(box[0]-offsetX, offsetY-box[1], -0.5);
    platform.physicsImpostor = new BABYLON.PhysicsImpostor(platform, BABYLON.PhysicsImpostor.BoxImpostor, {mass:20, restitution:0, friction:0},scene);

    platform.material = createMat(scene, "textures/gold.png")
}

function createBox(scene,x,y,z){
    let box = new BABYLON.Mesh.CreateBox('box', 1, scene);
    box.position = new BABYLON.Vector3(x,y,z);
    box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution:0, friction:0},scene);
    // box.physicsImpostor.registerOnPhysicsCollide(small.physicsImpostor, turnBackBox);
    listOfBox.push(box);

    box.material = createMat(scene, "textures/wood.png")
}

function createMeshes(scene, lvl) {
    createPlayer(jsonData[lvl]["start"], scene);
    createExit(jsonData[lvl]["end"], scene);
    createPlatform(jsonData[lvl]["box"], jsonData[lvl]["boxSize"], scene);
    // Generate block
    for(let i=0;i<jsonData[lvl]["maze"].length;i++){
        for(let j=0;j<jsonData[lvl]["maze"][i].length;j++){
            if (jsonData[lvl]["maze"][i][j] == 'x') {
                createBox(scene, j-offsetX, offsetY-i,-0.5);
            }
        }
    }
}

function destroyMeshes() {
    // Dispose objects
    if (player) player.dispose();
    if (platform) platform.dispose();
    if (exit) exit.dispose();
    for(let i=0;i<listOfBox.length;i++){
        listOfBox[i].dispose();
    }

    // Clear vars
    player = undefined;
    platform = undefined;
    exit = undefined;
    listOfBox = [];
}

function renderLevel(scene, lvl){
    state = 0;
    destroyMeshes();
    createMeshes(scene, lvl);
    direction = 1;
    state = 1;
}

function platformMovement(){
    const PLATFORM_SPEED = 8;

    let impostor = platform.physicsImpostor;

    let xav = 0, yav = 0;

    if (lf) xav = -PLATFORM_SPEED;
    else if (rg) xav =  PLATFORM_SPEED;

    if (up) yav =  PLATFORM_SPEED;
    else if (dn) yav = -PLATFORM_SPEED;

    impostor.setLinearVelocity(new BABYLON.Vector3(xav, yav, 0));
    impostor.setAngularVelocity(new BABYLON.Quaternion(0,0,0,0));

    camera.setTarget(new BABYLON.Vector3(platform.position.x,0,0));
    camera.setPosition(new BABYLON.Vector3(platform.position.x,3,-16));
}

function checkCollision(){
    function chk(item) {
        if(leftSmall.intersectsMesh(item,true) && direction == -1){
            direction *= -1;
        }
        else if(rightSmall.intersectsMesh(item,true) && direction == 1){
            direction *= -1;
        }
    }


    for(let i=0;i<listOfBox.length;i++){
        chk(listOfBox[i]);
    }
    chk(platform);
}

function playerMovement(){
    const PLAYER_SPEED = 1;
    checkCollision();
    let plv = player.physicsImpostor.getLinearVelocity();

    player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(PLAYER_SPEED * direction, -4, 0));

    if(player.position.y < -offsetY){
        state = 2;
        handleLose();
    }
}

function handleLose(){
    // Reset positions
    let start = jsonData[level]["start"];
    player.position = new BABYLON.Vector3(start[0]-offsetX, offsetY-start[1], -0.5);

    let box = jsonData[level]["box"];
    platform.position = new BABYLON.Vector3(box[0]-offsetX, offsetY-box[1], -0.5);

    direction = 1;
    state = 1;
}

function handleWin(scene){
    if (state === 1){
        state=3;

        $("#renderCanvas").hide();
        $("#win").show();
    }
}

function bindInput() {
    window.onkeydown = function(event){
        let code = event.keyCode;
        if(code==37){     //left
            lf=1;
        }
        else if(code==39){ //right
            rg=1;
        }
        else if(code==38){  //up
            up=1;
        }
        else if(code==40){  //down
            dn=1;
        }
    };
    window.onkeyup = function(event){
        let code = event.keyCode;
        if(code==37){     //left
            lf=0;
        }
        else if(code==39){ //right
            rg=0;
        }
        else if(code==38){  //up
            up=0;
        }
        else if(code==40){  //down
            dn=0;
        }
    };
}

function bindLevelSelector(scene) {
    $("a").click(function() {

        level = $(this).html();
        renderLevel(scene, level);

        $("#renderCanvas").show();
        $("#win").hide();
    });
}

function loadJSON(scene){
    let url = "http://localhost:8000/level.json";
    let message = $.get(url);
    message.done(function(data){
        jsonData=data;
        renderLevel(scene,level);
    });
}

function loadBGM(scene) {
    music = new BABYLON.Sound("Music", "colors.mp3", scene, null, { loop: true, autoplay: true });
}

window.addEventListener('DOMContentLoaded', function(){
    let canvas = document.getElementById('renderCanvas');
    let engine = new BABYLON.Engine(canvas, true);
    let scene = createScene(engine);

    loadBGM(scene);
    loadJSON(scene);
    bindInput();
    bindLevelSelector(scene);

    engine.runRenderLoop(function(){
        if (state === 1){
            scene.render();
            platformMovement();
            playerMovement();
        }
    });

    window.addEventListener('resize', function() {
        engine.resize();
    });
});