# Conway's Game of Life ~ 2D or 3D

This is project aiming to practice using threeJS. This is an implementatio of Conway's Game of Life. This is completed in both 2D ans 3D, and these modes can be toggled.


## Usage

This project is mostly controlled by keyboard, with some optional mouse input.
- Click, Hold, and Drag to change the viewpoint
- Use scrollwheel to zoom in and out

### 2D Mode
- Press `1` on the keyboard to toggle 2D mode (this is the default mode)
- Click anywhere on the board where you can see the green highlight square to place / remove a cell
- Once you have placed your cells, press `Enter` on the keyboard to begin running the simulation
- Once the game has reached a static state, you can place more cells. This is indicated by the grid no longer being red, and the highlight square being green
- Press `c` on the keyboard to clear the board, or stop a running simulation
- Press `r` to generate a random layout and run the simulation

### 3D mode
- Press `2` on the keyboard to toggle this mode. You will know this mode is enabled because 3-dimensional guide grids will appear
- This mode does not allow maual placement of cells (yet)
- To run this mode, simply press `r` to generate a random baord and run the simulation.
- There are four know living and death conditions that produce decent results visually, these options can be toggled with the following keys -> `6`, `7`, `8`, `9`, and can be pressed whne there isn't a solution running
- Each of these describe a different number of necessary neighboring cells to stay alive, or for a dead cell to come back to life
- Again, `c` can be pressed to clear a running solution, allowing you to choose new living / death conditions and rerunning the simulation
