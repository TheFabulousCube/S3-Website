function allowDrop(ev) {
    ev.preventDefault();
  }

  // select the item element
const item = document.querySelector('mouse');

// attach the dragstart event handler
// item.addEventListener('dragstart', dragStart);

// handle the dragstart



function dragstart(ev) {
    console.log('drag starts . . . ');
    console.log('taget: ' + ev.taget.id);
}
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }

  function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    console.log('data: ',data);
    var imageElement = document.getElementById(data);
    imageElement.style.position = "absolute";
    imageElement.style.left = ev.x+'px';
    imageElement.style.top = ev.y+'px';
  }