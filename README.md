# Halite3

Source Code for all version of Halite 3 bots (User:[ninilo97](https://2018.halite.io/user/?user_id=7596)) 

## Version Details

MyBot2 - Random direction and return to base if 75% full
MyBot3 - Random direction with range=2 scan and a bit optimized logic for return to base. (Beware : Horribly written code)
MyBot4 - ProSearch function to scan nearby cells (written in gameMap), endgame-kamikaze and 90% full return to base added.
MyBot5 - Dropoff creation logic added. Return to nearest dropoff logic added. Range=5 scanner added. Kamikaze-if-stuck logic added.
MyBot6 - Hyperparameter optimized for all possible maps sizes and halite density added. Rudimentary pass ship swap function added (Fails in rare cases ~4ships lost per 100 created). Range=7 scanner added (in gameMap).

## Final Version Details

First makes sure no other player blocks myShipyard by marking myShipyard as empty if occupied by other player's ships.
If ship at myShipyard increase its counter (this check is for stuck condition)
Move only if ShipHalite is greater than 10% of current CellHalite at ShipPosition (to avoid warnings during tests)
Kamikaze to nearest dropoff/shipyard if end of game is near.
If ship is stuck swap position with ship at west direction.
If ship is full return to shipyard else do one of the following:
  1. Scan all cells within Range=7 if density of area is high create a dropoff
  2. Scan all cells within Range=7 and select the unoccupied cell with highest halite.

For ship creation:
  1. First 6 moves keep creating ships.
  2. If X% of map is mined don't create anymore ships.
  3. Atleast 1 cell adjacent to shipyard must be empty.

Following hyperparameters are used to optimise all possible number of players and size of maps:
  1. DeepCollect - How much halite should remain in current cell before finding next target location
  2. maxCollect - Minimun number of halite required for ship to return to nearest shipyard/dropoff
  3. cs - Cutoff percentage of map mined for ship creation to stop
  4. maxDo - Used to determine how far dropoffs should be placed from dropoff/shipyards.

## Final Stats

Rank : 207/4014
Medal : Platinum Tier (Top 5%)
