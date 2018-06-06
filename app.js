// Level offset
const offsetX = 30;
const offsetY = 7; 

// Mesh globals
let player;
let small;
let platform;
let listOfBox = [];

let loaded = false; // Flag to check if json is loaded

let direction = 1;

let state;
let jsonData;
let level = "2";

function createMat(scene,pic){
    let mat = new BABYLON.StandardMaterial("materialTex", scene);
    mat.diffuseTexture = new BABYLON.Texture(pic, scene);
    mat.alpha = 1;
    return mat;
}

function createPlayer(start, scene) {
    player = new BABYLON.Mesh.CreateBox("player", 1, scene);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {mass:0.1, restitution:0, friction:0},scene);
    player.position = new BABYLON.Vector3(start[0]-offsetX, offsetY-start[1], -0.5);

    // Add small for collision detection
    leftSmall = new BABYLON.Mesh.CreateBox("Lsmall", 0.5, scene);
    leftSmall.parent = player;
    leftSmall.translate(BABYLON.Axis.X, -0.5, BABYLON.Space.LOCAL);

    rightSmall = new BABYLON.Mesh.CreateBox("Rsmall", 0.5, scene);
    rightSmall.parent = player;
    rightSmall.translate(BABYLON.Axis.X, 0.5, BABYLON.Space.LOCAL);
}

function createExit(end, scene) {
    let exit = new BABYLON.Mesh.CreateBox("exit", 1, scene);
    exit.position = new BABYLON.Vector3(end[0]-offsetX, offsetY-end[1], -0.5);
    exit.physicsImpostor = new BABYLON.PhysicsImpostor(exit, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution:0, friction:0},scene);
    exit.physicsImpostor.registerOnPhysicsCollide(player.physicsImpostor, function(main, collided){
        console.log('you win !!');
    });
}

// function turnBackBox(main, collided){
//     console.log("TURN BACK BOX");
// }

function createPlatform(box, boxSize, scene){
    platform = new BABYLON.Mesh.CreateBox("platform", 1, scene);
    platform.scaling = new BABYLON.Vector3(boxSize[0], boxSize[1], 1);
    platform.position = new BABYLON.Vector3(box[0]-offsetX, offsetY-box[1], -0.5);
    platform.physicsImpostor = new BABYLON.PhysicsImpostor(platform, BABYLON.PhysicsImpostor.BoxImpostor, {mass:20, restitution:0, friction:0},scene);
    // platform.physicsImpostor.registerOnPhysicsCollide(small.physicsImpostor, turnBackBox);
    listOfBox.push(platform);
}

function createBox(scene,x,y,z){
    let box = new BABYLON.Mesh.CreateBox('box', 1, scene);
    box.position = new BABYLON.Vector3(x,y,z);
    box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution:0, friction:0},scene);
    // box.physicsImpostor.registerOnPhysicsCollide(small.physicsImpostor, turnBackBox);
    listOfBox.push(box);
}

function createBackground(scene){
    let plane = BABYLON.MeshBuilder.CreatePlane("plane", {height: 18, width: 60}, scene);
    let planeMat = createMat(scene, 'http://localhost:8000/tanah.jpg');
    plane.material = planeMat;
    plane.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, restitution: 0.3, friction: 0, move: false });

    //invisible plane
    let mat = new BABYLON.StandardMaterial("Mat", scene);
    mat.alpha = 0;
    let inviPlane = BABYLON.MeshBuilder.CreatePlane("plane2", {height: 18, width: 60}, scene);
    inviPlane.position.z = -1;
    inviPlane.material = mat;
    inviPlane.setPhysicsState(BABYLON.PhysicsEngine.PlaneImpostor, { mass: 0, restitution: 0.3, friction: 0, move: false }); 
}

function checkCollision(){
    for(let i=0;i<listOfBox.length;i++){
        if(leftSmall.intersectsMesh(listOfBox[i],true) && direction == -1){
            direction *= -1;
            break;
        }
        else if(rightSmall.intersectsMesh(listOfBox[i],true) && direction == 1){
            direction *= -1;
            break;
        }
    }
}

function resetPosition(scene){
    let start = jsonData[level]["start"];
    player.position = new BABYLON.Vector3(start[0]-offsetX, offsetY-start[1], -0.5);

    let box = jsonData[level]["box"];
    platform.position = new BABYLON.Vector3(box[0]-offsetX, offsetY-box[1], -0.5);
    
    direction = 1;
    loaded = true;
    state = "playing";
}

window.addEventListener('DOMContentLoaded', function(){
    let canvas = document.getElementById('renderCanvas');
    state = "playing";

    let engine = new BABYLON.Engine(canvas, true);

    //creating scene
    let scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), new BABYLON.OimoJSPlugin());

    let camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 4, new BABYLON.Vector3(-16, 0, 0), scene);
    // camera.attachControl(canvas, true);
    camera.setPosition(new BABYLON.Vector3(-16,3,-16));
    let light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 0, -1), scene);
    
    //background
    createBackground(scene);

    //generate maze
    let url = "http://localhost:8000/level.json";
    let message = $.get(url);
    message.done(function(data){
        jsonData=data;
        createPlayer(jsonData[level]["start"], scene);
        createExit(jsonData[level]["end"], scene);
        createPlatform(jsonData[level]["box"], jsonData[level]["boxSize"], scene);
        // Generate block
        for(let i=0;i<jsonData[level]["maze"].length;i++){
            for(let j=0;j<jsonData[level]["maze"][i].length;j++){
                if (jsonData[level]["maze"][i][j] == 'x') {
                    createBox(scene, j-offsetX, offsetY-i,-0.5);
                } 
            }
        }
        resetPosition(scene);
    });

    let lf,rg,up,dn;
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

    // Add gravity to player box
    function playerMovement(){
        const PLAYER_SPEED = 1;
        checkCollision();
        let plv = player.physicsImpostor.getLinearVelocity();
        
        player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(PLAYER_SPEED * direction, -4, 0));

        if(player.position.y < -offsetY){
            state = "falling";
        }
    }

    engine.runRenderLoop(function(){
        scene.render();
        if(loaded){
            platformMovement();
            playerMovement();
            if(state=="falling") {
                loaded=false;
                resetPosition(scene);
            }
        }
    });
});