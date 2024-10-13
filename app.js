const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayersDbObjToResponseObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

const convertMatchDetailsDbObjToResponseObj = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;

  const playersArray = await db.all(getPlayersQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayersDbObjToResponseObj(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;

  const playerData = await db.get(getPlayerQuery);

  response.send(convertPlayersDbObjToResponseObj(playerData));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE
         player_details
    SET
        player_name='${playerName}'
    WHERE 
        player_id=${playerId};
  `;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
  SELECT * FROM match_details WHERE match_id=${matchId};
  `;

  const matchDetailsArray = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsDbObjToResponseObj(matchDetailsArray));
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getMatchesOfPlayerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details  WHERE player_id=${playerId};`;

  const matchDetailsArray = await db.all(getMatchesOfPlayerQuery);

  response.send(
    matchDetailsArray.map((eachMatch) =>
      convertMatchDetailsDbObjToResponseObj(eachMatch)
    )
  );
});

//API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const getPlayersOfMatchQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`;

  const playerDetailsArray = await db.all(getPlayersOfMatchQuery);

  response.send(
    playerDetailsArray.map((eachMatch) =>
      convertPlayersDbObjToResponseObj(eachMatch)
    )
  );
});

//API  7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerStatsQuery = `
    SELECT 
        player_id AS playerId,player_name AS playerName,SUM(score) AS totalScore, SUM(fours) AS totalFours , SUM(sixes) AS totalSixes 
    FROM 
        player_match_score 
    NATURAL JOIN 
         player_details 
    WHERE 
        player_id=${playerId};`;

  const stats = await db.get(getPlayerStatsQuery);

  console.log(stats);

  response.send(stats)
});
module.exports = app;
