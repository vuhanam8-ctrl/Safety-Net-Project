Slime Mold Food Simulation
Version 1.0 - 22 July 2026


OVERVIEW

Slime Mold Food Simulation is a generative p5.js artwork inspired by the
movement and feeding behaviour of slime mold. The program begins with a
group of small balls that move around the canvas, sense nearby conditions
and respond to food objects.

The balls leave permanent visible trails as they move. A separate temporary
layer allows them to sense wider areas around those trails without
remaining trapped on a single path.

Food objects appear at random positions and release expanding waves. These
waves can recruit a small number of balls to search for the food. When one
of them reaches the food, the food becomes active and attracts other nearby
balls. After enough balls gather around it, the food is consumed. The
attached balls disperse, new balls are produced and another food object
appears after a random delay.


USAGE NOTES

1. Open the project in a web browser by following the installation
   instructions below.

2. The simulation starts automatically. No keyboard or mouse input is
   required.

3. White balls represent the normal moving particles.

4. there are balls called scouts that have been selected by a wave created by the food object (orange ball).

5. Yellow balls means the white balls have attached to the food object and will disperse after 25 white balls enter food radius.

6. A thin blue circle represents the wave emitted by inactive food.

The simulation is generative, so its movements, food positions and resulting
trail patterns will be different each time it runs.


INSTALLATION INSTRUCTIONS

1. Open a terminal in this project directory.
2. Start a local server using one of the following options:

   Option A — Live Server
   Right-click index.html, then select Open with Live Server.

   Option B — Python
   Open a terminal in the project folder and run: python -m http.server 8000 | for MacBook: python3 -m http.server 8000

3. Open your browser and navigate to `http://localhost:8000/index.html`.


DOCUMENTATION



LICENSE INFORMATION

Licensed under the GNU General Public License v3.0. See LICENSE.txt for the
complete license text.

CREDITS

Slime Mold Food Simulation was created by VU HAI NAM as a creative coding
project using JavaScript and p5.js.

CONTACT

Author: Vu Hai Nam - s4118255
Email: vuhanam8@gmail.com
