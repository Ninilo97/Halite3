const hlt = require('./hlt/6');
const { Direction } = require('./hlt/6/positionals');
const { Position } = require('./hlt/6/positionals');
const logging = require('./hlt/6/logging');
const game = new hlt.Game();

game.initialize().then(async () => {
  const { gameMap, me } = game;
  const noOfPlayers=nOP();
  const size=gameMap.width;
  const totl=total();
  const avgHal = val = totl/(gameMap.width*gameMap.height);
  var posNull=[];

  //Find number of shipyard neibouring cells that are occupied
  function fullCheck(){
    let ans=0;
    if(gameMap.get(me.shipyard.position.directionalOffset(Direction.North)).isOccupied){
      ans++;
    }
    if(gameMap.get(me.shipyard.position.directionalOffset(Direction.South)).isOccupied){
      ans++;
    }
    if(gameMap.get(me.shipyard.position.directionalOffset(Direction.East)).isOccupied){
      ans++;
    }
    if(gameMap.get(me.shipyard.position.directionalOffset(Direction.West)).isOccupied){
      ans++;
    }
    return ans;
  }
  //Find number of players
  function nOP(){
    var ans=0;
    for(let player of game.players){
      ans++;
    }
    return ans;
  }
  //Find Poisition of nearest dropoff/shipyard
  function closest(shipp){
    let ans=gameMap.calculateDistance(me.shipyard.position,shipp.position);
    let val=me.shipyard.position;
    for (const dropoff of me.getDropoffs()){
      if(gameMap.calculateDistance(shipp.position,dropoff.position)<ans){
        ans=gameMap.calculateDistance(shipp.position,dropoff.position);
        val=dropoff.position;
      }
    }
    return val;
  }
  //Find Poisition of nearest dropoff/shipyard
  function closestO(shipp){
    let ans=999;
    let val;
    for(const player of game.players.values()) {
      if(player.id!==me.id){
        if(gameMap.calculateDistance(shipp.position,player.shipyard.position)<ans){
          ans=gameMap.calculateDistance(player.shipyard.position,shipp.position);
          val=player.shipyard.position;
        }
        for (const dropoff of player.getDropoffs()){
          if(gameMap.calculateDistance(shipp.position,dropoff.position)<ans){
            ans=gameMap.calculateDistance(shipp.position,dropoff.position);
            val=dropoff.position;
          }
        }
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
  //Find total remaining halite`
  function total(){
    let tot=0;
    for(var xx=0;xx<gameMap.height;xx++){
      for(var yy=0;yy<gameMap.width;yy++){
        tot+=gameMap._cells[xx][yy].haliteAmount;
      }
    }
    return tot;
  }
  //Find parameters like maxCollect and deepCollect
  function paraFind(tot){
    var dC=0;
    var mC=0;
    var cs=0;
    var mdo=0;
    if(noOfPlayers<4){
      switch (size) {
        case 32:
        if(avgHal<100){
          cs=45;
          dC=tot<30?5:10;
          mC=tot<10?1000:(tot<60?400:200);
        }
        else if(avgHal<200){
          cs=50;
          dC=tot<60?1:(tot<80?3:5);
          mC=tot<10?900:(tot<85?1000:600);
        }
        else if(avgHal<300){
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:1000;
        }
        else{
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:(tot<85?1000:600);
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 40:
        if(avgHal<100){
          cs=45;
          dC=tot<65?1:2;
          mC=tot<10?900:(tot<65?1000:800);
        }
        else if(avgHal<170){
          cs=50;
          dC=tot<65?1:3;
          mC=tot<10?900:1000;
        }
        else if(avgHal<250){
          cs=50;
          dC=tot<62?1:2.5;
          mC=tot<10?900:1000;
        }
        else{
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:(tot<85?1000:600);
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 48:
        if(avgHal<100){
          cs=35;
          dC=tot<40?2:5;
          mC=tot<40?1000:(tot<65?800:600);
        }
        else if(avgHal<170){
          cs=35;
          dC=tot<50?1:3;
          mC=tot<60?1000:800;
        }
        else if(avgHal<250){
          cs=35;
          dC=tot<62?1:2.5;
          mC=tot<10?900:1000;
        }
        else{
          cs=35;
          dC=tot<90?1:2;
          mC=1000;
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 56:
        if(avgHal<100){
          cs=22;
          dC=tot<10?3:6;
          mC=1000;
        }
        else if(avgHal<145){
          cs=32;
          dC=tot<60?1:2.5;
          mC=tot<75?1000:800;
        }
        else if(avgHal<195){
          cs=38;
          dC=tot<60?1:3;
          mC=tot<70?1000:800;
        }
        else if(avgHal<250){
          cs=40;
          dC=tot<65?1:2.5;
          mC=1000;
        }
        else{
          cs=40;
          dC=tot<95?1:2;
          mC=1000;
        }
        if(val<70){
          mdo=20;
        }
        else if(val<100){
          mdo=14;
        }
        else if(val<150){
          mdo=12;
        }
        else if(val<200){
          mdo=11;
        }
        else if(val<250){
          mdo=10;
        }
        else mdo=8;
        break;
        case 64:
        if(avgHal<100){
          cs=22;
          dC=tot<10?3:6;
          mC=1000;
        }
        else if(avgHal<145){
          cs=32;
          dC=tot<60?1:2.5;
          mC=tot<75?1000:800;
        }
        else if(avgHal<195){
          cs=36;
          dC=tot<60?1:3;
          mC=tot<70?1000:800;
        }
        else if(avgHal<250){
          cs=38;
          dC=tot<65?1:2.5;
          mC=1000;
        }
        else{
          cs=40;
          dC=tot<95?1:2;
          mC=1000;
        }
        if(game.turnNumber>0.7*hlt.constants.MAX_TURNS){
          cs=10;
        }
        if(val<70){
          mdo=20;
        }
        else if(val<100){
          mdo=14;
        }
        else if(val<150){
          mdo=12;
        }
        else if(val<200){
          mdo=11;
        }
        else if(val<250){
          mdo=10;
        }
        else mdo=8;
        break;
      }
    }
    else{
      switch (size) {
        case 32:
        if(avgHal<100){
          cs=45;
          dC=tot<30?5:10;
          mC=tot<10?1000:(tot<60?400:200);
        }
        else if(avgHal<200){
          cs=50;
          dC=tot<60?1:(tot<80?3:5);
          mC=tot<10?900:(tot<85?1000:600);
        }
        else if(avgHal<300){
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:1000;
        }
        else{
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:(tot<85?1000:600);
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 40:
        if(avgHal<100){
          cs=45;
          dC=tot<65?1:2;
          mC=tot<10?900:(tot<65?1000:800);
        }
        else if(avgHal<170){
          cs=50;
          dC=tot<65?1:3;
          mC=tot<10?900:1000;
        }
        else if(avgHal<250){
          cs=50;
          dC=tot<62?1:2.5;
          mC=tot<10?900:1000;
        }
        else{
          cs=50;
          dC=tot<60?1:2;
          mC=tot<10?900:(tot<85?1000:600);
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 48:
        if(avgHal<100){
          cs=35;
          dC=tot<40?2:5;
          mC=tot<40?1000:(tot<65?800:600);
        }
        else if(avgHal<170){
          cs=35;
          dC=tot<50?1:3;
          mC=tot<60?1000:800;
        }
        else if(avgHal<250){
          cs=35;
          dC=tot<62?1:2.5;
          mC=tot<10?900:1000;
        }
        else{
          cs=35;
          dC=tot<90?1:2;
          mC=1000;
        }
        if(val<100){
          mdo=15;
        }
        else if(val<150){
          mdo=14;
        }
        else if(val<200){
          mdo=13;
        }
        else if(val<250){
          mdo=12;
        }
        else if(val<300){
          mdo=11;
        }
        else mdo=8;
        break;
        case 56:
        if(avgHal<100){
          cs=22;
          dC=tot<10?3:6;
          mC=1000;
        }
        else if(avgHal<145){
          cs=32;
          dC=tot<60?1:2.5;
          mC=tot<75?1000:800;
        }
        else if(avgHal<195){
          cs=38;
          dC=tot<80?1:3;
          mC=tot<80?1000:800;
        }
        else if(avgHal<250){
          cs=40;
          dC=tot<65?1:2.5;
          mC=1000;
        }
        else{
          cs=40;
          dC=tot<95?1:2;
          mC=1000;
        }
        if(val<70){
          mdo=20;
        }
        else if(val<100){
          mdo=14;
        }
        else if(val<150){
          mdo=12;
        }
        else if(val<200){
          mdo=11;
        }
        else if(val<250){
          mdo=10;
        }
        else mdo=8;
        break;
        case 64:
        if(avgHal<100){
          cs=22;
          dC=tot<10?3:6;
          mC=1000;
        }
        else if(avgHal<135){
          cs=30;
          dC=tot<40?1:2.5;
          mC=tot<75?1000:800;
        }
        else if(avgHal<145){
          cs=36;
          dC=tot<40?1:2.5;
          mC=tot<75?1000:800;
        }
        else if(avgHal<195){
          cs=36;
          dC=tot<60?1:3;
          mC=tot<70?1000:800;
        }
        else if(avgHal<250){
          cs=38;
          dC=tot<65?1:2.5;
          mC=1000;
        }
        else if(avgHal<350){
          cs=38;
          dC=tot<65?1:2.5;
          mC=1000;
        }
        else{
          cs=42.5;
          dC=tot<95?1:2;
          mC=1000;
        }
        if(game.turnNumber>0.7*hlt.constants.MAX_TURNS){
          cs=10;
        }
        if(val<70){
          mdo=20;
        }
        else if(val<100){
          mdo=14;
        }
        else if(val<150){
          mdo=12;
        }
        else if(val<200){
          mdo=11;
        }
        else if(val<250){
          mdo=10;
        }
        else mdo=8;
        break;
      }
    }
    return [dC,mC,cs,mdo];
  }
  //Find dropoff distance from nearest dropoff/
  function posNulll(dosy){
    posNull.push(dosy.position);
    // posNull.push(dosy.position.directionalOffset(Direction.North));
    // posNull.push(dosy.position.directionalOffset(Direction.South));
    // posNull.push(dosy.position.directionalOffset(Direction.East));
    // posNull.push(dosy.position.directionalOffset(Direction.West));
    return posNull;
  }

  var sy=[];
  var rangePS=7;
  var destination;
  var safeMove;
  var sydl=[];
  posNull=posNulll(me.shipyard);
  /*
  Shipyard blocking
  Navigate with opponent ships
  Increment search range to max
  Improve stratergy for end game shipyard/dropoff navigation
  */
  //1545855080 L
  await game.ready('6');
  while (true) {
    await game.updateFrame();
    const tot=(1-(total()/totl))*100;
    const [deepCollect,maxCollect,cs,maxDO]=paraFind(tot);
    if(game.turnNumber===1){
      logging.debug("avgHal,deepCollect,maxCollect,cs,maxDO");
      logging.debug(avgHal,deepCollect,maxCollect,cs,maxDO);
    }
    var mehaliteAmount=me.haliteAmount;
    const commandQueue = [];
    var creatd=0;
    for(let i of posNull){
      const pos=gameMap.get(i);
      if(pos.isOccupied){
        if(pos.ship.owner!==me.id){
          pos.ship=null;
        }
      }
    }
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
      else if(game.turnNumber>20){
        sydl[ship.id]+=1;
      }
      if(ship.haliteAmount>=Math.floor(gameMap.get(ship.position).haliteAmount*0.1)){
        //If end game then set sy flag and goto shipyard
        if(game.turnNumber>0.92*hlt.constants.MAX_TURNS){
          destination = cship;
          safeMove = gameMap.naiveUnsafeNavigate(ship, destination);
          commandQueue.push(ship.move(safeMove));
        }
        else{
          const maxDL=Math.max(...sydl.filter(Number));
          const minDL=Math.min(...sydl.filter(Number));
          //If ship is stuck at dropoff/shipyard move west
          if(maxDL>4 && ship.position.equals(closest(ship).directionalOffset(Direction.East))){
            gameMap.get(ship.position).markSafe();
            safeMove = Direction.West;
            commandQueue.push(ship.move(safeMove));
            const temp = sydl.indexOf(Math.max(...sydl.filter(Number)));
            sydl[temp]=-1;
          }
          else if(minDL<0 && ship.position.equals(closest(ship).directionalOffset(Direction.West))){
              gameMap.get(ship.position).markSafe();
              safeMove = Direction.East;
              commandQueue.push(ship.move(safeMove));
              const temp = sydl.indexOf(Math.max(...sydl.filter(Number)));
              sydl[temp]=-0;
          }
          //If ship is 100% full goto shipyard
          else if(sy[ship.id]===1 || ship.haliteAmount>=maxCollect){
            destination = cship;
            safeMove = gameMap.naiveNavigate(ship, destination);
            commandQueue.push(ship.move(safeMove));
            sy[ship.id]=1;
          }
          //Else find best move using proSearch()
          else if(gameMap.get(ship.position).haliteAmount<50/deepCollect){
            //Search with dropoff condition
            if(mehaliteAmount>4000 && creatd===0 && gameMap.calculateDistance(ship.position,cship)>maxDO && gameMap.calculateDistance(ship.position,closestO(ship))>2){
              i=gameMap.proSearch(ship,rangePS,cship,0);
            }
            //Search without dropoff condition
            else{
              i=gameMap.proSearch(ship,rangePS,cship,1);
            }
            //Transverse accordingly
            if(i===4){
              creatd++;
              //gameMap.get(ship.position).
              commandQueue.push(ship.makeDropoff());
              posNull=posNulll(ship);
              mehaliteAmount-=4000;
            }
            else{
              destination = ship.position.directionalOffset(Direction.getAllCardinals()[i]);
              safeMove = gameMap.naiveNavigate(ship, destination);
              commandQueue.push(ship.move(safeMove));
            }
          }
        }
      }
    }
    const fullness=game.turnNumber>10?fullCheck():0;
    if (mehaliteAmount >= 1000 && tot<cs && !gameMap.get(me.shipyard).isOccupied && fullness<3) {
      commandQueue.push(me.shipyard.spawn());
      mehaliteAmount-=1000;
    }
    else if(game.turnNumber<6){commandQueue.push(me.shipyard.spawn());}
    await game.endTurn(commandQueue);

  }
});
