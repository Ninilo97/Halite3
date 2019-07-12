const hlt = require('./hlt/5');
const { Direction } = require('./hlt/5/positionals');
const { Position } = require('./hlt/5/positionals');
const logging = require('./hlt/5/logging');
const game = new hlt.Game();

game.initialize().then(async () => {
  const { gameMap, me } = game;

  await game.ready('5');
  var sy=[];
  var mapProMax=[];
  var rangePS=5;
  var destination;
  var i;
  var count=0;
  var safeMove;
  var x=1;
  var sydl=[];

  //Find Poisition of nearest dropoff/shipyard
  function closest(shipp){
    var ans=gameMap.calculateDistance(me.shipyard.position,shipp.position);
    var val=me.shipyard.position;
    for (const dropoff of me.getDropoffs()){
      if(gameMap.calculateDistance(shipp.position,dropoff.position)<ans){
        ans=gameMap.calculateDistance(shipp.position,dropoff.position);
        val=dropoff.position;
      }
    }
    return val;
  }
  //If ship on dropoff/shipyard Position return true
  function closestPos(shipp){
    if(shipp.position.equals(me.shipyard.position)){
      return true;
    }
    for (const dropoff of me.getDropoffs()){
      if(shipp.position.equals(dropoff.position)){
        return true;
      }
    }
    return false
  }
  //If none of the position in + has structure return true
  function dosc(shipp){
    if(gameMap.get(shipp.position).hasStructure ||
    gameMap.get(shipp.position.directionalOffset(Direction.getAllCardinals()[0])).hasStructure ||
    gameMap.get(shipp.position.directionalOffset(Direction.getAllCardinals()[1])).hasStructure ||
    gameMap.get(shipp.position.directionalOffset(Direction.getAllCardinals()[2])).hasStructure ||
    gameMap.get(shipp.position.directionalOffset(Direction.getAllCardinals()[3])).hasStructure){
      return false;
    }
    return true;
  }

  while (true) {
    await game.updateFrame();
    var creatd=0;
    const commandQueue = [];
    /*Shipyard blocking
    Navigate with opponent ships
    Ship going in-out-in-out on dropoff
    If more halite is collected then reduce cutoff 50->10 48x48 4x
    Adjust turnNumber to produce ship - based on available halite
    Stratergize ship production
    haliteAmount==MAX_HALITE?
    Generate first 5 in 6 moves
    */
    var mehaliteAmount=me.haliteAmount;
    count=0;
    for (const ship of me.getShips()) {
      const cship=closest(ship);
      //If ship at shipyard reset sy flag
      if(closestPos(ship)){
        sy[ship.id]=0;
      }
      if(sydl[ship.id]===undefined){
        sydl[ship.id]=0;
      }
      if(!ship.position.equals(cship)){
        sydl[ship.id]=0;
      }
      else{
        sydl[ship.id]+=1;
      }
      //If end game then set sy flag and goto shipyard
      if(game.turnNumber>hlt.constants.MAX_TURNS-0.08*hlt.constants.MAX_TURNS){
        destination = cship;
        safeMove = gameMap.naiveUnsafeNavigate(ship, destination);
        commandQueue.push(ship.move(safeMove));
      }
      else{
        //If ship is 90% full goto shipyard
        if(ship.haliteAmount>0.9*hlt.constants.MAX_HALITE || sy[ship.id]===1){
          destination = cship;
          safeMove = gameMap.naiveNavigate(ship, destination);
          commandQueue.push(ship.move(safeMove));
          sy[ship.id]=1;
        }
        //If ship is stuck at dropoff/shipyard move west
        else if(sydl[ship.id]>4){
          safeMove = Direction.West;
          commandQueue.push(ship.move(safeMove));
          sydl[ship.id]=0;
        }
        //Else find best move using proSearch()
        else if(gameMap.get(ship.position).haliteAmount<(0.05*hlt.constants.MAX_HALITE)*x){
          //Search with dropoff condition
          if(game.turnNumber<0.7*hlt.constants.MAX_TURNS && mehaliteAmount>4000 && gameMap.get(ship).structure===null && creatd===0 && gameMap.calculateDistance(ship.position,cship)>15 && dosc(ship)){
            i=gameMap.proSearch(ship,rangePS,0);
          }
          //Search without dropoff condition
          else{
            i=gameMap.proSearch(ship,rangePS,1);
          }
          //Transverse accordingly
          if(i===4){
            creatd++;
            commandQueue.push(ship.makeDropoff());
            mehaliteAmount-=4000;
            //const destination = new Position(xx*2,yy*2);
          }
          else{
            destination = ship.position.directionalOffset(Direction.getAllCardinals()[i]);
            safeMove = gameMap.naiveNavigate(ship, destination);
            commandQueue.push(ship.move(safeMove));
          }
        }
      }
    }
    if (mehaliteAmount >= hlt.constants.SHIP_COST && !gameMap.get(me.shipyard).isOccupied && game.turnNumber < 0.7*hlt.constants.MAX_TURNS) {
      commandQueue.push(me.shipyard.spawn());
      mehaliteAmount-=1000;
    }
    await game.endTurn(commandQueue);
  }
});
/*
const mapPro=[];
for (let i = 0; i < gameMap.width/2; i++) {
const row = [];
mapPro.push(row);
}
for(var xx=0;xx<gameMap.width/2;xx++){
for(var yy=0;yy<gameMap.height/2;yy++){
let tot=gameMap._cells[yy*2][xx*2].haliteAmount+gameMap._cells[yy*2][xx*2+1].haliteAmount+gameMap._cells[yy*2+1][xx*2].haliteAmount+gameMap._cells[yy*2+1][xx*2+1].haliteAmount;
mapPro[xx].push(tot);
}
mapProMax.push(Math.max(...mapPro[xx]));
}
var xx = mapProMax.indexOf(Math.max(...mapProMax));
var yy = mapPro[xx].indexOf(Math.max(...mapPro[xx]));
*/
/*
var tot=0;
for(var xx=0;xx<gameMap.width;xx++){
for(var yy=0;yy<gameMap.height;yy++){
tot+=gameMap._cells[yy][xx].haliteAmount;
}
}
tot=Math.floor(tot/(gameMap.width*gameMap.height));
*/
