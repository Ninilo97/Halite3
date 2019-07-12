const hlt = require('./hlt/3');
const { Direction } = require('./hlt/3/positionals');
const logging = require('./hlt/3/logging');

const game = new hlt.Game();

function createArray(len, itm) {
  var arr1 = [itm],
  arr2 = [];
  while (len > 0) {
    if (len & 1) arr2 = arr2.concat(arr1);
    arr1 = arr1.concat(arr1);
    len >>>= 1;
  }
  return arr2;
}

game.initialize().then(async () => {

  const { gameMap, me } = game;
  gameMap.get(me.shipyard).expand=4;
  const ndes=[];
  var map = {};
  ndes[0] = Object.assign({},gameMap.get(me.shipyard));
  var i=0,x=-1;
  for(var y=0;y<100;y++){
    x++;
    switch (ndes[x].expand) {
      case 0:
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
      ndes[i].expand=0;
      break;
      case 1:
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
      ndes[i].expand=1;
      break;
      case 2:
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
      ndes[i].expand=0;
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
      ndes[i].expand=1;
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[2]);
      ndes[i].expand=2;
      break;
      case 3:
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
      ndes[i].expand=0;
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
      ndes[i].expand=1;
      i++;
      ndes[i] = Object.assign({},ndes[x]);
      ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[3]);
      ndes[i].expand=3;
      break;
      case 4:
      ndes[1] = Object.assign({},ndes[0]);
      ndes[1].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[0]);
      ndes[1].expand=0;
      ndes[2] = Object.assign({},ndes[0]);
      ndes[2].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[1]);
      ndes[2].expand=1;
      ndes[3] = Object.assign({},ndes[0]);
      ndes[3].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[2]);
      ndes[3].expand=2;
      ndes[4] = Object.assign({},ndes[0]);
      ndes[4].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[3]);
      ndes[4].expand=3;
      i=4;
    }
  }
  ndes.splice(0,1);
  // At this point "game" variable is populated with initial map data.
  // This is a good place to do computationally expensive start-up pre-processing.
  // As soon as you call "ready" function below, the 2 second per turn timer will start.
  await game.ready('3');
  var ass=createArray(50, null);
  var preMov=createArray(50, null);
  while (true) {
    await game.updateFrame();

    const commandQueue = [];
    if (me.haliteAmount >= hlt.constants.SHIP_COST && !gameMap.get(me.shipyard).isOccupied) {
      commandQueue.push(me.shipyard.spawn());
    }
    for (const ship of me.getShips()) {
      if(ass[ship.id]===null && ndes.length>0) {
        //const assPos=Math.floor(Math.random() * ndes.length);
        ass[ship.id]=ndes[0].position;
        ndes.splice(0,1);
      }

      //If ship not on AC
      if(!ship.position.equals(gameMap.get(ass[ship.id]).position)){
        //If AC.halite > 10 go to AC
        if(gameMap.get(ass[ship.id]).haliteAmount>4) {
          const destination = gameMap.get(ass[ship.id]).position;
          const safeMove = gameMap.naiveNavigate(ship, destination);
          if(preMov[ship.id]===null){preMov[ship.id] = ship.position.directionalOffset(safeMove);}
          else if(preMov[ship.id]===ship.position.directionalOffset(safeMove)){
            while(true){
              const direction = Direction.getAllCardinals()[Math.floor(4 * Math.random())];
              if(!safeMove===direction){
                break;
              }
            }
            const destination = ship.position.directionalOffset(direction);
            const safeMove = gameMap.naiveNavigate(ship, destination);
          }
          else {preMov[ship.id]=ship.position.directionalOffset(safeMove)}
          commandQueue.push(ship.move(safeMove));
        }
        //Else go to shipyard
        else{
          ass[ship.id] = me.shipyard.position;
        }
      }
      //If ship at AC
      else if (ship.position.equals(gameMap.get(ass[ship.id]).position) && gameMap.get(ship.position).haliteAmount<50) {
        //If AC.halite > 10 Wait
        //Else go to shipyard
        ass[ship.id] = me.shipyard.position;
      }

      if(ass[ship.id]===me.shipyard.position){
        if(ship.position.equals(me.shipyard.position)){
          ass[ship.id]=null;
          break;
        }
        const destination = me.shipyard.position;
        const safeMove = gameMap.naiveNavigate(ship, destination);
        if(preMov[ship.id]===null){preMov[ship.id] = ship.position.directionalOffset(safeMove);}
        else if(preMov[ship.id]===ship.position.directionalOffset(safeMove)){
          while(true){
            const direction = Direction.getAllCardinals()[Math.floor(4 * Math.random())];
            if(!safeMove===direction){
              break;
            }
          }
          const destination = ship.position.directionalOffset(direction);
          const safeMove = gameMap.naiveNavigate(ship, destination);
        }
        else {preMov[ship.id]=ship.position.directionalOffset(safeMove)}
        commandQueue.push(ship.move(safeMove));
      }
    }
    await game.endTurn(commandQueue);
  }
});
