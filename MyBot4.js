const hlto = require('./hlt/4');
const { Direction } = require('./hlt/4/positionals');
const logging = require('./hlt/4/logging');
const game = new hlto.Game();
game.initialize().then(async () => {
  const { gameMap, me } = game;
  await game.ready('4');
  var sy=[];
  while (true) {
    await game.updateFrame();
    const commandQueue = [];
    if (me.haliteAmount >= hlto.constants.SHIP_COST && !gameMap.isOccupied2(me.shipyard) && game.turnNumber < 0.7*hlto.constants.MAX_TURNS) {
      commandQueue.push(me.shipyard.spawn());
    }
    for (const ship of me.getShips()) {
      //If ship at shipyard reset sy flag
      if(ship.position.equals(me.shipyard.position)){
        sy[ship.id]=0;
      }
      //If end game then set sy flag and goto shipyard
      if(game.turnNumber>hlto.constants.MAX_TURNS-0.08*hlto.constants.MAX_TURNS){
        const destination = me.shipyard.position;
        const safeMove = gameMap.naiveUnsafeNavigate(ship, destination);
        commandQueue.push(ship.move(safeMove));
      }
      else{
        //If ship is 90% full goto shipyard
        if(ship.haliteAmount>0.9*hlto.constants.MAX_HALITE || sy[ship.id]===1){
          const destination = me.shipyard.position;
          const safeMove = gameMap.naiveNavigate(ship, destination);
          commandQueue.push(ship.move(safeMove));
          sy[ship.id]=1;
        }
        //Else find best move using proSearch()
        else if(gameMap.get(ship.position).haliteAmount<0.05*hlto.constants.MAX_HALITE){
          var i=gameMap.proSearch(ship,3);
          const destination = ship.position.directionalOffset(Direction.getAllCardinals()[i]);
          const safeMove = gameMap.naiveNavigate(ship, destination);
          commandQueue.push(ship.move(safeMove));
        }
      }
    }
    await game.endTurn(commandQueue);
  }
});
