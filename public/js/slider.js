
  const images = [
    "../images/desert.png",
    "../images/mesa.png",
    "../images/plains.png"
  ];

  const headers = [
    "Wüste",
    "Mesa",
    "Plains"
];

    const texts = [
    "Die Wüste besteht an der Oberfläche hauptsächlich aus Sand, unter dem sich Sandstein befindet. Es wachsen nur Kakteen und tote Büsche. Tiere gibt es nur wenige. Darunter fallen Hasen und Kamele.",
    "Die Mesa ist eine ebene, mit Sandstein bedeckte Region, die oft in der Wüste vorkommt. Sie ist bekannt für ihre hohen Wände und ihre hohe Wahrscheinlichkeit Mienenschächte zu enthalten.",
    "Die Plains sind breite, flache Gebiete, die von Gras und Bäumen bewachsen sind. Sie sind bekannt für ihre friedliche Atmosphäre und hohe Anzahl an Tieren wie Kühe und Schafe."
]; //note to me: add more bioms

  const mobs = [
    "../images/camel.jpg",
    "../images/platzhalter.jpg",
    "../images/cow.jpg",
  ];

  const structures = [
    "../images/desert_temple.jpg",
    "../images/mineshaft.jpg",
    "../images/village.jpg",
  ];

  const plants = [
    "../images/cactus.png",
    "../images/dead_bush.png",
    "../images/oak_tree.png",
  ];

let index = 0;

function showImage() {
  document.getElementById("slide").src = images[index];
  document.querySelector(".slider-text h2").innerText = headers[index];
  document.querySelector(".slider-text p").innerText = texts[index];
  document.querySelector(".intents-mobs img").src = mobs[index];
  document.querySelector(".intents-structures img").src = structures[index];
  document.querySelector(".intents-plants img").src = plants[index];
}

  function next() {
    index = (index + 1) % images.length;
    showImage();
  }

  function prev() {
    index = (index - 1 + images.length) % images.length;
    showImage();
  }