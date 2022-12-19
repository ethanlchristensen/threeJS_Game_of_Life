import * as THREE from  "https://cdn.skypack.dev/three@0.132.2";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const N = 20; // NxN board size
let mode = 1; // 2D (1) or 3D (2)

let life_range_3D = [4, 5];
let death_range_3D = [5, 5];

let l = -(N / 2) + 0.5; // lower bound
let u = N / 2 - 0.5; // upper bound

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(10, 15, -22);

orbit.update();

scene.background = new THREE.Color(`rgb(255, 255, 255)`);

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(N, N),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false,
        color: 0xFFFFFF,
        transparent: true,
    })
);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.position.y -= 0.1;
planeMesh.name = "PLANE";
scene.add(planeMesh);


let grid = new THREE.GridHelper(N, N, 0x000000, 0x000000);
grid.name = "GRID";
scene.add(grid);

const grid2 = new THREE.GridHelper(N, N, 0x000000, 0x000000);
grid2.rotation.x = Math.PI/2;
grid2.visible = false;
scene.add(grid2);
const grid3 = new THREE.GridHelper(N, N, 0x000000, 0x000000);
grid3.rotation.x = Math.PI/2;
grid3.rotation.z = Math.PI/2;
grid3.visible = false;
scene.add(grid3);

/*for (let i = l; i < u; i++) {
    let gridLayer = grid.clone();
    gridLayer.position.y = i;
    gridLayer.name = gridLayer.name + (++gridId).toString();
    scene.add(gridLayer);
}
for (let i = l; i < u; i++) {
    let gridLayer = grid.clone();
    gridLayer.rotation.x = Math.PI/2;
    gridLayer.position.z = i + 0.5;
    gridLayer.name = (++gridId).toString();
    scene.add(gridLayer);
}*/

console.log(scene);

const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        color: 0xEEEEEE,
    })
);
const Mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
    })
);
Mesh.rotateX(-Math.PI / 2);
highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(0.5, 0, 0.5);
scene.add(highlightMesh);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener("mousemove", function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
        highlightMesh.visible = true;
        const intersect = intersects[0];
        const highlightPos = new THREE.Vector3()
            .copy(intersect.point)
            .floor()
            .addScalar(0.5);

        highlightMesh.position.set(highlightPos.x, -0.07, highlightPos.z);

        const objectExist = boxes.find(function (object) {
            return (
                object.position.x === highlightMesh.position.x &&
                object.position.z === highlightMesh.position.z
            );
        });

        if (!objectExist && highlightPos.x >= l && highlightPos.x <= u && highlightPos.z >= l && highlightPos.z <= u) highlightMesh.material.color.setHex(0x10FF10);
        else highlightMesh.material.color.setHex(0xFF1010);
        if (solving) {
            highlightMesh.material.color.setHex(0xFF1010);
        }
    } else {
        highlightMesh.visible = false;
    }
});

// Defining the different type of boxes
const binaryBox2D = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.1, 0.75),
    new THREE.MeshBasicMaterial({
        color: 0x000000,
    }),
);
binaryBox2D.add(new THREE.LineSegments(new THREE.EdgesGeometry(binaryBox2D.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));

const binaryBox3D = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.50,
    }),
);
binaryBox3D.add(new THREE.LineSegments(new THREE.EdgesGeometry(binaryBox3D.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));


// Intialization
let objects = [];
let cells3D = [];
let cells2D = [];
let boxes = [];

// Initialize cells;
for (let i = 0; i < N; i++) { // 3D 
    let layer = [];
    for (let j = 0; j < N; j++) {
        let row = [];
        for (let k = 0; k < N; k++) {
            row.push(0);
        }
        layer.push(row);
    }
    cells3D.push(layer);
}

for (let i = 0; i < N; i++) { // 2D
    let tmp = [];
    for (let j = 0; j < N; j++) {
        tmp.push(0);
    }
    cells2D.push(tmp);
}

let solving = false;
let cellId = 0;

// Possible directions
const directions3D = [
    [-1, 0, 0],
    [1, 0, 0],
    [0, -1, 0],
    [0, 1, 0],
    [1, 1, 0],
    [-1, -1, 0],
    [1, -1, 0],
    [-1, 1, 0],

    [-1, 0, 1],
    [1, 0, 1],
    [0, -1, 1],
    [0, 1, 1],
    [1, 1, 1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [0, 0, 1],

    [-1, 0, -1],
    [1, 0, -1],
    [0, -1, -1],
    [0, 1, -1],
    [1, 1, -1],
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [0, 0, -1]
];

const directions2D = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1]
];

// Animate the highlight mesh
function animate(time) {
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);
    objects.forEach(function (object) {
        object.rotation.x = time / 1;
        object.rotation.z = time / 1;
        object.position.y = 0.5 + 0.5 * Math.abs(Math.sin(time / 1000));
    });
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Register window resizing
window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard controls
window.addEventListener('keypress', (event) => {
    if (event.code == "Enter") {
        if (!solving)  {
            if (mode == 1) {
                run2D();
            } else if (mode == 2) {
                run3D();
            }
        }
    } else if (event.code == 'KeyR') {
        if (!solving) {
            if (mode == 1) {
                populateBoard2D();
                run2D();
            } else if (mode == 2) {
                populateBoard3D();
                run3D();
            }
        }
    } else if (event.code == 'KeyC') {
        if (mode == 1) {
            solving = false;
            clear_cells_2D();
        } else if (mode == 2) {
            solving = false;
            clear_cells_3D();
        }
        solving = false; 1
    } else if (event.code == "Digit1") {
        if (!solving) {
            mode = 1;
            clear_cells_3D();
            highlightMesh.material.visible = true;
            grid.visible = true;
            grid2.visible = false;
            grid3.visible = false;
        }
    } else if (event.code == "Digit2") {
        if (!solving) {
            clear_cells_2D();
            grid2.visible = true;
            grid3.visible = true;
            highlightMesh.material.visible = false;
            mode = 2; 
        }
    } else if (event.code == "Digit6") {
        if (mode == 2 && !solving) {
            life_range_3D = [4, 5];
            death_range_3D = [5, 5];
        }
    } else if (event.code == "Digit7") {
        if (mode == 2 && !solving) {
            life_range_3D = [5, 7];
            death_range_3D = [6, 6];
        }
    } else if (event.code == "Digit8") {
        if (mode == 2 && !solving) {
            life_range_3D = [5, 6];
            death_range_3D = [5, 5];
        }
    } else if (event.code == "Digit9") {
        if (mode == 2 && !solving) {
            life_range_3D = [6, 8];
            death_range_3D = [5, 5];
        }
    }
});

// Register cell placements on the board
window.addEventListener('click', async function () {
    if (mode == 1) {
        function boxExists(bs, mesh_x, mesh_z) {
            if (boxes.length == 0) {
                return false;
            }
            for (let i = 0; i < bs.length; i++) {
                if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                    return true;
                }
            }
            return false;
        }

        function boxIndex(bs, mesh_x, mesh_z) {
            for (let i = 0; i < bs.length; i++) {
                if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                    return i;
                }
            }
            return -1;
        }


        if (intersects.length > 0 && !solving) {
            if (highlightMesh.position.x >= l && highlightMesh.position.x <= u && highlightMesh.position.z >= l && highlightMesh.position.z <= u) {
                if (!(boxExists(boxes, highlightMesh.position.x, highlightMesh.position.z))) {
                    let cellClone = null;
                    cellClone = binaryBox2D.clone();
                    cellClone.position.x = highlightMesh.position.x;
                    cellClone.position.z = highlightMesh.position.z;
                    cellClone.position.y += 0.1;
                    cellClone.name = (++cellId).toString();
                    boxes.push(cellClone);
                    cells2D[cellClone.position.x + u][cellClone.position.z + u] = cellClone;
                    scene.add(cellClone);
                } else { // removing a block
                    let index = boxIndex(boxes, highlightMesh.position.x, highlightMesh.position.z);
                    let boxToDelete = boxes[index];
                    if (index != -1) {
                        boxes.splice(index, 1);
                        scene.remove(boxToDelete);
                    } else {
                        console.log("Tried to get a box that doesn't exist . . .");
                    }
                }
            }
        }
    }
});

// Intialize the game board
function populateBoard3D() {
    if (!solving) {
        clear_cells_3D();
        for (let i = l; i < u + 1; i++) {
            for (let j = l; j < u + 1; j++) {
                for (let k = l; k < u + 1; k++) {
                    if (Math.random() < 0.5) {
                        let cell = binaryBox3D.clone();
                        cell.position.x = i;
                        cell.position.z = j;
                        cell.position.y = k;
                        cell.name = (++cellId).toString();
                        cells3D[i + u][j + u][k + u] = cell;
                        scene.add(cell);
                        if ((i >= (-0.5 * (N / 10)) && i <= (0.5 * (N / 10))) && (j >= (-0.5 * (N / 10)) && j <= (0.5 * (N / 10))) && (k >= (-0.5 * (N / 10)) && k <= (0.5 * (N / 10)))) {
                            scene.getObjectByName(cell.name).material = new THREE.MeshBasicMaterial({
                                color: 0x000000,
                                transparent: true,
                                opacity: 0.90,
                            });
                        } else if ((i >= (-2.5 * (N / 10)) && i <= (2.5 * (N / 10))) && (j >= (-2.5 * (N / 10)) && j <= (2.5 * (N / 10))) && (k >= (-2.5 * (N / 10)) && k <= (2.5 * (N / 10)))) {
                            scene.getObjectByName(cell.name).material = new THREE.MeshBasicMaterial({
                                color: 0x505050,
                                transparent: true,
                                opacity: 0.90,
                            });
                        } else if ((i >= (-3.5 * (N / 10)) && i <= (3.5 * (N / 10))) && (j >= (-3.5 * (N / 10)) && j <= (3.5 * (N / 10))) && (k >= (-3.5 * (N / 10)) && k <= (3.5 * (N / 10)))) {
                            scene.getObjectByName(cell.name).material = new THREE.MeshBasicMaterial({
                                color: 0x909090,
                                transparent: true,
                                opacity: 0.90,
                            });
                        }

                        boxes.push(cell);
                    }
                }
            }
        }
    }
}

// Run the game of life based on the current board state
async function run3D() {
    if (!solving) {
        solving = true;
        while (!empty()) {
            console.log("Running");
            await sleep(150);
            let next_gen = cells3D.map(function (arr) {
                return arr.slice();
            });
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    for (let k = 0; k < N; k++) {
                        //Grab all the neighbors for a given cell
                        let neighbors = 0;
                        directions3D.forEach(d => {
                            if (d[0] + i < N && d[0] + i >= 0 && d[1] + j < N && d[1] + j >= 0 && d[2] + k < N && d[2] + k >= 0) {
                                if (cells3D[i + d[0]][j + d[1]][k + d[2]] != 0) {
                                    neighbors++;
                                }
                            }
                        });

                        // Update the next generation
                        if (cells3D[i][j][k] != 0) { // ALIVE
                            if (neighbors >= life_range_3D[0] && neighbors <= life_range_3D[1]) {
                                next_gen[i][j][k] = cells3D[i][j][k];
                            } else {
                                next_gen[i][j][k] = 0;
                            }
                        } else { //DEAD
                            if (neighbors >= death_range_3D[0] && neighbors <= death_range_3D[1]) {
                                if (cells3D[i][j][k] != 0) {
                                    let cell = binaryBox3D.clone();
                                    cell.position.x = cells3D[i][j][k].position.x;
                                    cell.position.z = cells3D[i][j][k].position.z;
                                    cell.position.y = cells3D[i][j][k].position.y
                                    cell.name = (++cellId).toString();
                                    next_gen[i][j][k] = cell;
                                } else { // cell could be 0, and thus doesn't have a prior x,y value . . .
                                    let cell = binaryBox3D.clone();
                                    cell.position.x = l + i;
                                    cell.position.z = l + j;
                                    cell.position.y = l + k;
                                    cell.name = (++cellId).toString();
                                    next_gen[i][j][k] = cell;
                                }
                            } else {
                                next_gen[i][j][k] = cells3D[i][j][k];
                            }
                        }
                    }
                }
            }
            boxes.forEach(box => {
                scene.remove(scene.getObjectByName(box.name));
            });
            boxes = [];
            cells3D = next_gen;
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    for (let k = 0; k < N; k++) {
                        if (cells3D[i][j][k] != 0) {
                            if ((cells3D[i][j][k].position.x >= (-0.5 * (N / 10)) && cells3D[i][j][k].position.x <= (0.5 * (N / 10))) && (cells3D[i][j][k].position.z >= (-0.5 * (N / 10)) && cells3D[i][j][k].position.z <= (0.5 * (N / 10))) && (cells3D[i][j][k].position.y >= (-0.5 * (N / 10)) && cells3D[i][j][k].position.y <= (0.5 * (N / 10)))) {
                                cells3D[i][j][k].material = new THREE.MeshBasicMaterial({
                                    color: 0x000000,
                                    transparent: true,
                                    opacity: 0.90,
                                });
                            } else if ((cells3D[i][j][k].position.x >= (-2.5 * (N / 10)) && cells3D[i][j][k].position.x <= (2.5 * (N / 10))) && (cells3D[i][j][k].position.z >= (-2.5 * (N / 10)) && cells3D[i][j][k].position.z <= (2.5 * (N / 10))) && (cells3D[i][j][k].position.y >= (-2.5 * (N / 10)) && cells3D[i][j][k].position.y <= (2.5 * (N / 10)))) {
                                cells3D[i][j][k].material = new THREE.MeshBasicMaterial({
                                    color: 0x505050,
                                    transparent: true,
                                    opacity: 0.90,
                                });
                            } else if ((cells3D[i][j][k].position.x >= (-3.5 * (N / 10)) && cells3D[i][j][k].position.x <= (3.5 * (N / 10))) && (cells3D[i][j][k].position.z >= (-3.5 * (N / 10)) && cells3D[i][j][k].position.z <= (3.5 * (N / 10))) && (cells3D[i][j][k].position.y >= (-3.5 * (N / 10)) && cells3D[i][j][k].position.y <= (3.5 * (N / 10)))) {
                                cells3D[i][j][k].material = new THREE.MeshBasicMaterial({
                                    color: 0x909090,
                                    transparent: true,
                                    opacity: 0.90,
                                });
                            }
                            scene.add(cells3D[i][j][k]);
                            boxes.push(cells3D[i][j][k]);
                        }
                    }
                }
            }

        }
        solving = false;
        console.log("Done solving, board is empty!");
    }

    function empty() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                for (let k = 0; k < N; k++) {
                    if (cells3D[i][j][k] != 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

// Reset everything
function clear_cells_3D() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            for (let k = 0; k < N; k++) {
                if (cells3D[i][j][k] != 0) {
                    scene.remove(scene.getObjectByName(cells3D[i][j][k].name));
                    cells3D[i][j][k] = 0;
                }
            }
        }
    }
    boxes = [];

    console.log(scene);
}

function populateBoard2D() {
    if (!solving) {
        clear_cells_2D();
        for (var i = l; i < u + 1; i++) {
            for (var j = l; j < u + 1; j++) {
                if (Math.random() < 0.5) {
                    cells2D[i + u][j + u] = 0;
                    let cell = binaryBox2D.clone();
                    cell.position.x = i;
                    cell.position.z = j;
                    cell.position.y += 0.1;
                    cell.name = (++cellId).toString();
                    cells2D[i + u][j + u] = cell;
                    scene.add(cell);
                    boxes.push(cell);
                }
            }
        }
    }
}

async function run2D() {
    if (!solving) {
        solving = true;
        scene.remove(grid);
        grid = new THREE.GridHelper(N, N, 0xFF0000, 0xFF0000);
        grid.position.y -= 0.075;
        scene.add(grid);
        highlightMesh.material.color.setHex(0xFF1010);

        while (!empty()) {
            await sleep(75);
            let next_gen = cells2D.map(function (arr) {
                return arr.slice();
            });
            let prev = cells2D.map(function (arr) {
                return arr.slice();
            });
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    // GRAB NEIGHBORS
                    let neighbors = 0;
                    directions2D.forEach(direction => {
                        if (direction[0] + i < N && direction[0] + i >= 0 && direction[1] + j < N && direction[1] + j >= 0) {
                            if (cells2D[i + direction[0]][j + direction[1]] != 0) {
                                neighbors += 1;
                            }
                        }
                    });

                    // UPDATE THE NEXT GENERATION
                    if (cells2D[i][j] != 0) { // alive
                        if (neighbors == 2 || neighbors == 3) { //stay alive
                            next_gen[i][j] = cells2D[i][j]
                        } else { // die
                            next_gen[i][j] = 0;
                        }
                    } else { // dead
                        if (neighbors == 3) {
                            if (cells2D[i][j] != 0) {
                                let cell = binaryBox2D.clone();
                                cell.position.x = cells2D[i][j].position.x;
                                cell.position.z = cells2D[i][j].position.z;
                                cell.position.y += 0.1;
                                cell.name = (++cellId).toString();
                                next_gen[i][j] = cell;
                            } else { // cell could be 0, and thus doesn't have a prior x,y value . . .
                                let cell = binaryBox2D.clone();
                                cell.position.x = l + i;
                                cell.position.z = l + j;
                                cell.position.y += 0.1;
                                cell.name = (++cellId).toString();
                                next_gen[i][j] = cell;
                            }
                        } else {
                            next_gen[i][j] = cells2D[i][j];
                        }
                    }
                }
            }
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    scene.remove(scene.getObjectByName(cells2D[i][j].name));
                    boxes = [];
                }
            }
            cells2D = next_gen
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    if (cells2D[i][j] != 0) {
                        scene.add(cells2D[i][j]);
                        boxes.push(cells2D[i][j]);
                    }
                }
            }
            if (JSON.stringify(next_gen) === JSON.stringify(prev)) {
                solving = false;
                break;
            }
        }
        highlightMesh.material.color.setHex(0x10FF10);
        scene.remove(grid);
        grid = new THREE.GridHelper(N, N, 0x000000, 0x000000);
        grid.position.y -= 0.075;
        scene.add(grid);
        solving = false;
    }

    function empty() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (cells2D[i][j] != 0) {
                    return false;
                }
            }
        }
        return true;
    }
}

function clear_cells_2D() {
    boxes.forEach(box => {
        scene.remove(scene.getObjectByName(box.name));
    });
    for(let i = 0; i < N; i++) {
        for(let j = 0; j < N; j++) {
            cells2D[i][j] = 0;
        }
    }
    boxes = [];
}