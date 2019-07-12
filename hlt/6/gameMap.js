const constants = require('./constants');
const { Ship, Dropoff, Shipyard } = require('./entity');
const { Direction, Position } = require('./positionals');
const logging = require('./logging');

/** Player object, containing all entities/metadata for the player. */
class Player {
  constructor(playerId, shipyard, halite=0) {
    this.id = playerId;
    this.shipyard = shipyard;
    this.haliteAmount = halite;
    this._ships = new Map();
    this._dropoffs = new Map();
  }

  /** Get a single ship by its ID. */
  getShip(shipId) {
    return this._ships.get(shipId);
  }

  /** Get a list of the player's ships. */
  getShips() {
    const result = [];
    for (const ship of this._ships.values()) {
      result.push(ship);
    }
    return result;
  }

  /** Get a single dropoff by its ID. */
  getDropoff(dropoffId) {
    return this._dropoffs.get(dropoffId);
  }

  /** Get a list of the player's dropoffs. */
  getDropoffs() {
    const result = [];
    for (const dropoff of this._dropoffs.values()) {
      result.push(dropoff);
    }
    return result;
  }

  /** Check whether a ship with a given ID exists. */
  hasShip(shipId) {
    return this._ships.has(shipId);
  }

  /**
  * Create a player object using input from the game engine.
  * @private
  */
  static async _generate(getLine) {
    const line = await getLine();
    const [ playerId, shipyardX, shipyardY ] = line
    .split(/\s+/)
    .map(x => parseInt(x, 10));
    return new Player(playerId,
      new Shipyard(playerId, -1, new Position(shipyardX, shipyardY)));
    }

    /**
    * Update the player object for the current turn using input from
    * the game engine.
    * @private
    */
    async _update(numShips, numDropoffs, halite, getLine) {
      this.haliteAmount = halite;
      this._ships = new Map();
      for (let i = 0; i < numShips; i++) {
        const [ shipId, ship ] = await Ship._generate(this.id, getLine);
        this._ships.set(shipId, ship);
      }
      this._dropoffs = new Map();
      for (let i = 0; i < numDropoffs; i++) {
        const [ dropoffId, dropoff ] = await Dropoff._generate(this.id, getLine);
        this._dropoffs.set(dropoffId, dropoff);
      }
    }
  }

  /** A cell on the game map. */
  class MapCell {
    constructor(position, halite) {
      this.position = position;
      this.haliteAmount = halite;
      this.ship = null;
      this.structure = null;
      this.expand = null;
      this.inspi = 1;
    }


    expandType() {
      if (this.expand) {
        return this.expand.constructor;
      }
      return null;
    }
    /**
    * @returns {Boolean} whether this cell has no ships or structures.
    */
    get isEmpty() {
      return !this.isOccupied && !this.hasStructure;
    }

    /**
    * @returns {Boolean} whether this cell has any ships.
    */
    get isOccupied() {
      return this.ship !== null;
    }


    /**
    * @returns {Boolean} whether this cell has any structures.
    */
    get hasStructure() {
      return this.structure !== null;
    }

    /**
    * @returns The type of the structure in this cell, or null.
    */
    get structureType() {
      if (this.hasStructure) {
        return this.structure.constructor;
      }
      return null;
    }


    /**
    * Mark this cell as unsafe (occupied) for navigation.
    *
    * Use in conjunction with {@link GameMap#getSafeMove}.
    *
    * @param {Ship} ship The ship occupying this cell.
    */

    markUnsafe(ship) {
      this.ship = ship;
    }

    markSafe() {
      this.ship = null;
    }

    equals(other) {
      return this.position.equals(other.position);
    }

    toString() {
      return `MapCell(${this.position}, halite=${this.haliteAmount})`;
    }
  }

  /**
  * The game map.
  *
  * Can be indexed by a position, or by a contained entity.
  * Coordinates start at 0. Coordinates are normalized for you.
  */
  class GameMap {
    constructor(cells, width, height) {
      this.width = width;
      this.height = height;
      this._cells = cells;
    }

    /**
    * Getter for position object or entity objects within the game map
    * @param location the position or entity to access in this map
    * @returns the contents housing that cell or entity
    */
    get(...args) {
      if (args.length === 2) {
        return this._cells[args[1]][args[0]];
      }
      let [ location ] = args;
      if (location instanceof Position) {
        location = this.normalize(location);
        return this._cells[location.y][location.x];
      }
      else if (location.position) {
        return this.get(location.position);
      }
      return null;
    }

    /**
    * Compute the Manhattan distance between two locations.
    * Accounts for wrap-around.
    * @param source The source from where to calculate
    * @param target The target to where calculate
    * @returns The distance between these items
    */
    calculateDistance(source, target) {
      source = this.normalize(source);
      target = this.normalize(target);
      const delta = source.sub(target).abs();
      return Math.min(delta.x, this.width - delta.x) +
      Math.min(delta.y, this.height - delta.y);
    }

    /**
    * Normalized the position within the bounds of the toroidal map.
    * i.e.: Takes a point which may or may not be within width and
    * height bounds, and places it within those bounds considering
    * wraparound.
    * @param {Position} position A position object.
    * @returns A normalized position object fitting within the bounds of the map
    */
    normalize(position) {
      let x = ((position.x % this.width) + this.width) % this.width;
      let y = ((position.y % this.height) + this.height) % this.height;
      return new Position(x, y);
    }

    /**
    * Determine the relative direction of the target compared to the
    * source (i.e. is the target north, south, east, or west of the
      * source). Does not account for wraparound.
      * @param {Position} source The source position
      * @param {Position} target The target position
      * @returns {[Direction | null, Direction | null]} A 2-tuple whose
      * elements are: the relative direction for each of the Y and X
      * coordinates (note the inversion), or null if the coordinates
      * are the same.
      */
      static _getTargetDirection(source, target) {
        return [
          target.y > source.y ? Direction.South :
          (target.y < source.y ? Direction.North : null),
          target.x > source.x ? Direction.East :
          (target.x < source.x ? Direction.West : null),
        ];
      }

      /**
      * Return a list of Direction(s) that move closer to the
      * destination, if any.
      *
      * This does not account for collisions. Multiple directions may
      * be returned if movement in both coordinates is viable.
      *
      * @param {Position} source The (normalized) source position
      * @param {Position} destination The (normalized) target position
      * @returns A list of Directions moving towards the target (if
      * any)
      */
      shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
        return array;
      }

      getUnsafeMoves(source, destination) {
        if (!(source instanceof Position && destination instanceof Position)) {
          throw new Error("source and destination must be of type Position");
        }

        source = this.normalize(source);
        destination = this.normalize(destination);

        const possibleMoves = [];
        const distance = destination.sub(source).abs();
        const [ yDir, xDir ] = GameMap._getTargetDirection(source, destination);

        if (distance.x !== 0) {
          possibleMoves.push(distance.x < (this.width / 2) ? xDir : xDir.invert());
        }
        if (distance.y !== 0) {
          possibleMoves.push(distance.y < (this.height / 2) ? yDir : yDir.invert());
        }

        return this.shuffle(possibleMoves);
      }

      /**
      * Returns a singular safe move towards the destination.
      * @param {Ship} ship - the ship to move
      * @param {Position} destination - the location to move towards
      * @return {Direction}
      */
      naiveNavigate(ship, destination) {
        // No need to normalize destination since getUnsafeMoves does that
        for (const direction of this.getUnsafeMoves(ship.position, destination)) {
          const targetPos = ship.position.directionalOffset(direction);
          if (!this.get(targetPos).isOccupied) {
            this.get(ship.position).markSafe();
            this.get(targetPos).markUnsafe(ship);
            return direction;
          }
        }
        return Direction.Still;
      }

      naiveUnsafeNavigate(ship, destination) {
        for (const direction of this.getUnsafeMoves(ship.position, destination)) {
          const targetPos = ship.position.directionalOffset(direction);
          if(targetPos.x===destination.x && targetPos.y===destination.y){
            return direction;
          }
          if (!this.get(targetPos).isOccupied) {
            this.get(ship.position).markSafe();
            this.get(targetPos).markUnsafe(ship);
            return direction;
          }
        }
        return Direction.Still;
      }

      proSearch(source,n,cship,flag){
        var range = n*n + (n+1)*(n+1);
        this.get(source).expand=4;
        const ndes=[];
        var map = {};
        ndes[0] = Object.assign({},this.get(source));
        var i=0,x=-1;
        for(var y=0;y<range;y++){
          x++;
          switch (ndes[x].expand) {
            case 0:
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
            ndes[i].expand=0;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            break;
            case 1:
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
            ndes[i].expand=1;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            break;
            case 2:
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
            ndes[i].expand=0;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
            ndes[i].expand=1;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[2]);
            ndes[i].expand=2;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            break;
            case 3:
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[0]);
            ndes[i].expand=0;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[1]);
            ndes[i].expand=1;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            i++;
            ndes[i] = Object.assign({},ndes[x]);
            ndes[i].position=ndes[x].position.directionalOffset(Direction.getAllCardinals()[3]);
            ndes[i].expand=3;
            ndes[i].haliteAmount=this.get(ndes[i]).haliteAmount;
            break;
            case 4:
            ndes[1] = Object.assign({},ndes[0]);
            ndes[1].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[0]);
            ndes[1].expand=0;
            ndes[1].haliteAmount=this.get(ndes[1]).haliteAmount;
            ndes[2] = Object.assign({},ndes[0]);
            ndes[2].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[1]);
            ndes[2].expand=1;
            ndes[2].haliteAmount=this.get(ndes[2]).haliteAmount;
            ndes[3] = Object.assign({},ndes[0]);
            ndes[3].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[2]);
            ndes[3].expand=2;
            ndes[3].haliteAmount=this.get(ndes[3]).haliteAmount;
            ndes[4] = Object.assign({},ndes[0]);
            ndes[4].position=ndes[0].position.directionalOffset(Direction.getAllCardinals()[3]);
            ndes[4].expand=3;
            ndes[4].haliteAmount=this.get(ndes[4]).haliteAmount;
            i=4;
          }
        }
        ndes.splice(0,1);
        //1-5
        //2-13
        //3-25
        //4-41
        //5-61
        //6-85
        //7-113

        ndes[60].haliteAmount=Math.max(ndes[99].haliteAmount,ndes[84].haliteAmount,ndes[86].haliteAmount)+ndes[60].haliteAmount;
        ndes[61].haliteAmount=Math.max(ndes[100].haliteAmount,ndes[85].haliteAmount,ndes[87].haliteAmount)+ndes[61].haliteAmount;
        ndes[62].haliteAmount=Math.max(ndes[86].haliteAmount,ndes[88].haliteAmount)+ndes[62].haliteAmount;
        ndes[63].haliteAmount=Math.max(ndes[87].haliteAmount,ndes[89].haliteAmount)+ndes[63].haliteAmount;
        ndes[64].haliteAmount=Math.max(ndes[88].haliteAmount,ndes[90].haliteAmount)+ndes[64].haliteAmount;
        ndes[65].haliteAmount=Math.max(ndes[89].haliteAmount,ndes[91].haliteAmount)+ndes[65].haliteAmount;
        ndes[66].haliteAmount=Math.max(ndes[90].haliteAmount,ndes[92].haliteAmount)+ndes[66].haliteAmount;
        ndes[67].haliteAmount=Math.max(ndes[91].haliteAmount,ndes[93].haliteAmount)+ndes[67].haliteAmount;
        ndes[68].haliteAmount=Math.max(ndes[92].haliteAmount,ndes[94].haliteAmount)+ndes[68].haliteAmount;
        ndes[69].haliteAmount=Math.max(ndes[93].haliteAmount,ndes[95].haliteAmount)+ndes[69].haliteAmount;
        ndes[70].haliteAmount=Math.max(ndes[94].haliteAmount,ndes[96].haliteAmount)+ndes[70].haliteAmount;
        ndes[71].haliteAmount=Math.max(ndes[95].haliteAmount,ndes[97].haliteAmount)+ndes[71].haliteAmount;
        ndes[72].haliteAmount=Math.max(ndes[96].haliteAmount,ndes[97].haliteAmount,ndes[98].haliteAmount)+ndes[72].haliteAmount;
        ndes[73].haliteAmount=Math.max(ndes[99].haliteAmount,ndes[101].haliteAmount)+ndes[73].haliteAmount;
        ndes[74].haliteAmount=Math.max(ndes[100].haliteAmount,ndes[102].haliteAmount)+ndes[74].haliteAmount;
        ndes[75].haliteAmount=Math.max(ndes[101].haliteAmount,ndes[103].haliteAmount)+ndes[75].haliteAmount;
        ndes[76].haliteAmount=Math.max(ndes[102].haliteAmount,ndes[104].haliteAmount)+ndes[76].haliteAmount;
        ndes[77].haliteAmount=Math.max(ndes[103].haliteAmount,ndes[105].haliteAmount)+ndes[77].haliteAmount;
        ndes[78].haliteAmount=Math.max(ndes[104].haliteAmount,ndes[106].haliteAmount)+ndes[78].haliteAmount;
        ndes[79].haliteAmount=Math.max(ndes[105].haliteAmount,ndes[107].haliteAmount)+ndes[79].haliteAmount;
        ndes[80].haliteAmount=Math.max(ndes[106].haliteAmount,ndes[108].haliteAmount)+ndes[80].haliteAmount;
        ndes[81].haliteAmount=Math.max(ndes[107].haliteAmount,ndes[109].haliteAmount)+ndes[81].haliteAmount;
        ndes[82].haliteAmount=Math.max(ndes[108].haliteAmount,ndes[110].haliteAmount)+ndes[82].haliteAmount;
        ndes[83].haliteAmount=Math.max(ndes[109].haliteAmount,ndes[110].haliteAmount,ndes[111].haliteAmount)+ndes[83].haliteAmount;

        ndes[40].haliteAmount=Math.max(ndes[73].haliteAmount,ndes[60].haliteAmount,ndes[62].haliteAmount)+ndes[40].haliteAmount;
        ndes[41].haliteAmount=Math.max(ndes[74].haliteAmount,ndes[61].haliteAmount,ndes[63].haliteAmount)+ndes[41].haliteAmount;
        ndes[42].haliteAmount=Math.max(ndes[62].haliteAmount,ndes[64].haliteAmount)+ndes[42].haliteAmount;
        ndes[43].haliteAmount=Math.max(ndes[63].haliteAmount,ndes[65].haliteAmount)+ndes[43].haliteAmount;
        ndes[44].haliteAmount=Math.max(ndes[64].haliteAmount,ndes[66].haliteAmount)+ndes[44].haliteAmount;
        ndes[45].haliteAmount=Math.max(ndes[65].haliteAmount,ndes[67].haliteAmount)+ndes[45].haliteAmount;
        ndes[46].haliteAmount=Math.max(ndes[66].haliteAmount,ndes[68].haliteAmount)+ndes[46].haliteAmount;
        ndes[47].haliteAmount=Math.max(ndes[67].haliteAmount,ndes[69].haliteAmount)+ndes[47].haliteAmount;
        ndes[48].haliteAmount=Math.max(ndes[68].haliteAmount,ndes[70].haliteAmount)+ndes[48].haliteAmount;
        ndes[49].haliteAmount=Math.max(ndes[69].haliteAmount,ndes[71].haliteAmount)+ndes[49].haliteAmount;
        ndes[50].haliteAmount=Math.max(ndes[70].haliteAmount,ndes[71].haliteAmount,ndes[72].haliteAmount)+ndes[50].haliteAmount;
        ndes[51].haliteAmount=Math.max(ndes[73].haliteAmount,ndes[75].haliteAmount)+ndes[51].haliteAmount;
        ndes[52].haliteAmount=Math.max(ndes[74].haliteAmount,ndes[76].haliteAmount)+ndes[52].haliteAmount;
        ndes[53].haliteAmount=Math.max(ndes[75].haliteAmount,ndes[77].haliteAmount)+ndes[53].haliteAmount;
        ndes[54].haliteAmount=Math.max(ndes[76].haliteAmount,ndes[78].haliteAmount)+ndes[54].haliteAmount;
        ndes[55].haliteAmount=Math.max(ndes[77].haliteAmount,ndes[79].haliteAmount)+ndes[55].haliteAmount;
        ndes[56].haliteAmount=Math.max(ndes[78].haliteAmount,ndes[80].haliteAmount)+ndes[56].haliteAmount;
        ndes[57].haliteAmount=Math.max(ndes[79].haliteAmount,ndes[81].haliteAmount)+ndes[57].haliteAmount;
        ndes[58].haliteAmount=Math.max(ndes[80].haliteAmount,ndes[82].haliteAmount)+ndes[58].haliteAmount;
        ndes[59].haliteAmount=Math.max(ndes[81].haliteAmount,ndes[82].haliteAmount,ndes[83].haliteAmount)+ndes[59].haliteAmount;

        ndes[24].haliteAmount=Math.max(ndes[51].haliteAmount,ndes[40].haliteAmount,ndes[42].haliteAmount)+ndes[24].haliteAmount;
        ndes[25].haliteAmount=Math.max(ndes[52].haliteAmount,ndes[41].haliteAmount,ndes[43].haliteAmount)+ndes[25].haliteAmount;
        ndes[26].haliteAmount=Math.max(ndes[42].haliteAmount,ndes[44].haliteAmount)+ndes[26].haliteAmount;
        ndes[27].haliteAmount=Math.max(ndes[43].haliteAmount,ndes[45].haliteAmount)+ndes[27].haliteAmount;
        ndes[28].haliteAmount=Math.max(ndes[44].haliteAmount,ndes[46].haliteAmount)+ndes[28].haliteAmount;
        ndes[29].haliteAmount=Math.max(ndes[45].haliteAmount,ndes[47].haliteAmount)+ndes[29].haliteAmount;
        ndes[30].haliteAmount=Math.max(ndes[46].haliteAmount,ndes[48].haliteAmount)+ndes[30].haliteAmount;
        ndes[31].haliteAmount=Math.max(ndes[47].haliteAmount,ndes[49].haliteAmount)+ndes[31].haliteAmount;
        ndes[32].haliteAmount=Math.max(ndes[48].haliteAmount,ndes[50].haliteAmount,ndes[49].haliteAmount)+ndes[32].haliteAmount;
        ndes[33].haliteAmount=Math.max(ndes[51].haliteAmount,ndes[53].haliteAmount)+ndes[33].haliteAmount;
        ndes[34].haliteAmount=Math.max(ndes[52].haliteAmount,ndes[54].haliteAmount)+ndes[34].haliteAmount;
        ndes[35].haliteAmount=Math.max(ndes[53].haliteAmount,ndes[55].haliteAmount)+ndes[35].haliteAmount;
        ndes[36].haliteAmount=Math.max(ndes[54].haliteAmount,ndes[56].haliteAmount)+ndes[36].haliteAmount;
        ndes[37].haliteAmount=Math.max(ndes[55].haliteAmount,ndes[57].haliteAmount)+ndes[37].haliteAmount;
        ndes[38].haliteAmount=Math.max(ndes[56].haliteAmount,ndes[58].haliteAmount)+ndes[38].haliteAmount;
        ndes[39].haliteAmount=Math.max(ndes[57].haliteAmount,ndes[59].haliteAmount,ndes[58].haliteAmount)+ndes[39].haliteAmount;

        ndes[12].haliteAmount=Math.max(ndes[33].haliteAmount,ndes[24].haliteAmount,ndes[26].haliteAmount)+ndes[12].haliteAmount;
        ndes[13].haliteAmount=Math.max(ndes[34].haliteAmount,ndes[25].haliteAmount,ndes[27].haliteAmount)+ndes[13].haliteAmount;
        ndes[14].haliteAmount=Math.max(ndes[26].haliteAmount,ndes[28].haliteAmount)+ndes[14].haliteAmount;
        ndes[15].haliteAmount=Math.max(ndes[27].haliteAmount,ndes[29].haliteAmount)+ndes[15].haliteAmount;
        ndes[16].haliteAmount=Math.max(ndes[28].haliteAmount,ndes[30].haliteAmount)+ndes[16].haliteAmount;
        ndes[17].haliteAmount=Math.max(ndes[29].haliteAmount,ndes[31].haliteAmount)+ndes[17].haliteAmount;
        ndes[18].haliteAmount=Math.max(ndes[30].haliteAmount,ndes[32].haliteAmount,ndes[31].haliteAmount)+ndes[18].haliteAmount;
        ndes[19].haliteAmount=Math.max(ndes[33].haliteAmount,ndes[35].haliteAmount)+ndes[19].haliteAmount;
        ndes[20].haliteAmount=Math.max(ndes[34].haliteAmount,ndes[36].haliteAmount)+ndes[20].haliteAmount;
        ndes[21].haliteAmount=Math.max(ndes[35].haliteAmount,ndes[37].haliteAmount)+ndes[21].haliteAmount;
        ndes[22].haliteAmount=Math.max(ndes[36].haliteAmount,ndes[38].haliteAmount)+ndes[22].haliteAmount;
        ndes[23].haliteAmount=Math.max(ndes[37].haliteAmount,ndes[39].haliteAmount,ndes[38].haliteAmount)+ndes[23].haliteAmount;

        ndes[4].haliteAmount=Math.max(ndes[19].haliteAmount,ndes[12].haliteAmount,ndes[14].haliteAmount)+ndes[4].haliteAmount;
        ndes[5].haliteAmount=Math.max(ndes[20].haliteAmount,ndes[13].haliteAmount,ndes[15].haliteAmount)+ndes[5].haliteAmount;
        ndes[6].haliteAmount=Math.max(ndes[14].haliteAmount,ndes[16].haliteAmount)+ndes[6].haliteAmount;
        ndes[7].haliteAmount=Math.max(ndes[15].haliteAmount,ndes[17].haliteAmount)+ndes[7].haliteAmount;
        ndes[8].haliteAmount=Math.max(ndes[16].haliteAmount,ndes[18].haliteAmount,ndes[17].haliteAmount)+ndes[8].haliteAmount;
        ndes[9].haliteAmount=Math.max(ndes[19].haliteAmount,ndes[21].haliteAmount)+ndes[9].haliteAmount;
        ndes[10].haliteAmount=Math.max(ndes[20].haliteAmount,ndes[22].haliteAmount)+ndes[10].haliteAmount;
        ndes[11].haliteAmount=Math.max(ndes[21].haliteAmount,ndes[23].haliteAmount,ndes[22].haliteAmount)+ndes[11].haliteAmount;

        ndes[0].haliteAmount=Math.max(ndes[9].haliteAmount,ndes[4].haliteAmount,ndes[6].haliteAmount)+ndes[0].haliteAmount;
        ndes[1].haliteAmount=Math.max(ndes[10].haliteAmount,ndes[5].haliteAmount,ndes[7].haliteAmount)+ndes[1].haliteAmount;
        ndes[2].haliteAmount=Math.max(ndes[6].haliteAmount,ndes[8].haliteAmount,ndes[7].haliteAmount)+ndes[2].haliteAmount;
        ndes[3].haliteAmount=Math.max(ndes[9].haliteAmount,ndes[10].haliteAmount,ndes[11].haliteAmount)+ndes[3].haliteAmount;
        var mx=[];
        mx.push(ndes[0].haliteAmount);
        mx.push(ndes[1].haliteAmount);
        mx.push(ndes[2].haliteAmount);
        mx.push(ndes[3].haliteAmount);
        var ans;
        if(Math.max.apply(Math,mx)>n*500 && flag===0){
          return 4;
        }
        for(let i in mx){
          if(Math.max.apply(Math,mx)===Math.min.apply(Math,mx)){
            ans = Math.floor(4 * Math.random());
            return ans;
          }
          ans = mx.indexOf(Math.max(...mx));
          if(!this.get(source.position.directionalOffset(Direction.getAllCardinals()[ans])).isOccupied && this.get(source.position.directionalOffset(Direction.getAllCardinals()[ans])).positional!==cship){
            return ans;
          }
          mx.splice(ans,1,0);
        }
        ans = Math.floor(4 * Math.random());
        return ans;
      }

      static async _generate(getLine) {
        const [ mapWidth, mapHeight ] = (await getLine())
        .split(/\s+/)
        .map(x => parseInt(x, 10));
        const gameMap = [];
        for (let i = 0; i < mapHeight; i++) {
          const row = [];
          row.fill(null, 0, mapWidth);
          gameMap.push(row);
        }
        for (let y = 0; y < mapHeight; y++) {
          const cells = (await getLine()).split(/\s+/);
          for (let x = 0; x < mapWidth; x++) {
            gameMap[y][x] = new MapCell(new Position(x, y), parseInt(cells[x], 10));
          }
        }
        return new GameMap(gameMap, mapWidth, mapHeight);
      }

      /**
      * Update this map object from the input given by the game
      * engine.y
      */
      async _update(getLine) {
        // Mark cells as safe for navigation (re-mark unsafe cells
        // later)
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            this.get(x, y).ship = null;
          }
        }

        const numChangedCells = parseInt(await getLine(), 10);
        for (let i = 0; i < numChangedCells; i++) {
          const line = (await getLine());
          const [ cellX, cellY, cellEnergy ] = line
          .split(/\s+/)
          .map(x => parseInt(x, 10));
          this.get(cellX, cellY).haliteAmount = cellEnergy;
        }
      }
    }

    module.exports = {
      Player,
      GameMap,
      MapCell,
    };
