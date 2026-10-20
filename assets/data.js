/* CosmicTouch data: planets + quiz bank. Facts are unchanged from the original site. */
(function () {
  "use strict";

  /* tone = the Gumdrop colour of the planet's card, picked to contrast with the planet itself; keys double as URL slugs */
  var PLANETS = [
    { key: "mercury", n: "Mercury", tone: "yellow", d: 4879,   y: 88,    r: 57.9,   t: 167,
      f: "Mercury is the smallest planet and closest to the Sun.",
      x: "Its rocky surface is covered with craters." },
    { key: "venus",   n: "Venus",   tone: "violet", d: 12104,  y: 225,   r: 108.2,  t: 464,
      f: "Venus is the hottest planet.",
      x: "Its thick atmosphere traps heat." },
    { key: "earth",   n: "Earth",   tone: "orange", d: 12742,  y: 365,   r: 149.6,  t: 15,
      f: "Earth is our home and the only world currently known to support life.",
      x: "Liquid water covers most of its surface." },
    { key: "mars",    n: "Mars",    tone: "teal", d: 6779,   y: 687,   r: 227.9,  t: -65,
      f: "Mars is known as the Red Planet.",
      x: "Iron-rich dust gives it a reddish appearance." },
    { key: "jupiter", n: "Jupiter", tone: "violet", d: 139820, y: 4333,  r: 778.6,  t: -110,
      f: "Jupiter is the largest planet.",
      x: "It has enormous storms, including the Great Red Spot." },
    { key: "saturn",  n: "Saturn",  tone: "teal",   d: 116460, y: 10759, r: 1433.5, t: -140,
      f: "Saturn is famous for its rings.",
      x: "Its rings contain countless pieces of ice and rock." },
    { key: "uranus",  n: "Uranus",  tone: "orange",   d: 50724,  y: 30687, r: 2872.5, t: -195,
      f: "Uranus rotates on its side.",
      x: "Methane in its atmosphere helps give it a blue-green color." },
    { key: "neptune", n: "Neptune", tone: "yellow", d: 49244,  y: 60190, r: 4495.1, t: -200,
      f: "Neptune is the most distant planet from the Sun.",
      x: "It is an ice giant with extremely fast winds." }
  ];

  /* [question, answers, index of the right answer] */
  var QUIZ = [
    ["Which planet is closest to the Sun?", ["Earth", "Mercury", "Mars", "Neptune"], 1],
    ["Which planet is hottest?", ["Venus", "Mars", "Jupiter", "Uranus"], 0],
    ["Which planet is our home?", ["Saturn", "Venus", "Earth", "Mercury"], 2],
    ["Which planet is called the Red Planet?", ["Neptune", "Mars", "Uranus", "Venus"], 1],
    ["Which planet is largest?", ["Earth", "Saturn", "Jupiter", "Neptune"], 2],
    ["Which planet has famous rings?", ["Saturn", "Mercury", "Mars", "Earth"], 0],
    ["Which planet rotates on its side?", ["Venus", "Uranus", "Jupiter", "Mars"], 1],
    ["Which planet is farthest from the Sun?", ["Saturn", "Earth", "Neptune", "Mercury"], 2],
    ["How many planets are in our solar system?", ["7", "8", "9", "10"], 1],
    ["Which planet is our nearest planetary neighbor in this list?", ["Mars", "Jupiter", "Neptune", "Saturn"], 0]
  ];

  var TONES = ["orange", "teal", "yellow", "violet", "lime"];

  window.CT = window.CT || {};
  window.CT.data = { PLANETS: PLANETS, QUIZ: QUIZ, TONES: TONES };
})();
