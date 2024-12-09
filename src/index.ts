import { WebSocket, WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();


const WS_PORT = parseInt(process.env.WS_PORT || "8080", 10);

const wss = new WebSocketServer({
  port: WS_PORT,
  verifyClient: (info, done) => {
    const origin = info.origin;
    const allowedOrigins = ["*"];
    if (allowedOrigins.includes(origin)) {
      done(true); 
    } else {
      done(false, 403, "Origin not allowed");
    }
  },
});


console.log(`WebSocket server running on port ${WS_PORT}`);

type Player = {
  socket: WebSocket;
  username: string;
};

type Arena = {
  players: Player[];
  currentRound?: Round;
  submissions: { username: string; answer: number[] }[];
  roundResults: { roundNumber: number; winner?: string }[];
};

const arenas: Record<string, Arena> = {};

type Round = {
  number: number;
  gridSize: string;
  pattern: number[];
};

const rounds: Record<string, Round[]> = {
  "3x3": [{ number: 1, gridSize: "3x3", pattern: [2, 4, 5] }],
  "3x4": [{ number: 2, gridSize: "3x4", pattern: [1, 3, 6, 7] }],
  "4x4": [{ number: 3, gridSize: "4x4", pattern: [0, 4, 5, 8, 10, 15] }],
};

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const data = JSON.parse(message.toString());

    if (data.event === "create-arena") {
      const arenaId = `arena_${Math.random().toString(36).substring(7)}`;

      await client.arena.create({
        data: {
          id: arenaId,
          player1: data.username,
        },
      });

      arenas[arenaId] = {
        players: [{ socket: ws, username: data.username }],
        submissions: [],
        roundResults: [],
      };

      ws.send(JSON.stringify({ event: "arena-created", arenaId }));
    }

    if (data.event === "join-arena") {
      const arenaId = data.arenaId;

      const arena = await client.arena.findUnique({
        where: {
          id: arenaId,
        },
      });

      if (!arena) {
        ws.send(JSON.stringify({ event: "error", message: "Arena not found" }));
        return;
      }

      if (arena.player2) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Only two players are allowed!",
          })
        );
        return;
      }

      await client.arena.update({
        where: { id: arenaId },
        data: { player2: data.username, status: "ready" },
      });

      if (!arenas[arenaId]) {
        arenas[arenaId] = { players: [], submissions: [], roundResults: [] };
      }

      arenas[arenaId].players.push({ socket: ws, username: data.username });

      arenas[arenaId].players.forEach((player) =>
        player.socket.send(
          JSON.stringify({
            event: "arena_ready",
            players: arenas[arenaId].players.map((p) => p.username),
          })
        )
      );
    }


    if (data.event === "start-game") {
      const arenaId = data.arenaId;
      const arena = arenas[arenaId];
    
      if (!arena) {
        ws.send(JSON.stringify({ event: "error", message: "Arena not found" }));
        return;
      }
    
      const firstRound = rounds["3x3"][0];
      arena.currentRound = firstRound;
      arena.submissions = [];
      arena.roundResults = [];
    
      arena.players.forEach((player) => {
        player.socket.send(
          JSON.stringify({ event: "countdown", message: "3, 2, 1..." })
        );
      });
    
      setTimeout(() => {
        arena.players.forEach((player) => {
          player.socket.send(
            JSON.stringify({
              event: "round-start",
              gridSize: firstRound.gridSize,
              pattern: firstRound.pattern,
            })
          );
        });
    
        setTimeout(() => {
          arena.players.forEach((player) => {
            player.socket.send(JSON.stringify({ event: "pattern-clear" }));
          });
        }, 2000);
      }, 3000);
    }
  
    if (data.event === "submit-answer") {
      const arenaId = data.arenaId;
      const arena = arenas[arenaId];
    
      if (!arena || !arena.currentRound) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Arena not found or round inactive",
          })
        );
        return;
      }
    
      const { username, answer } = data;
      const roundPattern = arena.currentRound.pattern;
    
      const existingRoundResult = arena.roundResults?.find(
        (result) => result.roundNumber === arena.currentRound?.number
      );
    
      if (existingRoundResult?.winner) {
        ws.send(
          JSON.stringify({
            event: "round-already-won",
            message: `This round has already been won by ${existingRoundResult.winner}.`,
          })
        );
        return;
      }
    
      arena.submissions = arena.submissions || [];
      const alreadySubmitted = arena.submissions.some(
        (sub) => sub.username === username
      );
      if (alreadySubmitted) {
        ws.send(
          JSON.stringify({
            event: "duplicate-submission",
            message: "You have already submitted an answer for this round.",
          })
        );
        return;
      }
    
      arena.submissions.push({ username, answer });
    
      if (JSON.stringify(answer) === JSON.stringify(roundPattern)) {
        const roundNumber = arena.currentRound.number;
        arena.roundResults.push({ roundNumber, winner: username });
    
        arena.players.forEach((player) => {
          player.socket.send(
            JSON.stringify({
              event: "round-result",
              message: `${username} wins round ${roundNumber}!`,
            })
          );
        });

        setTimeout(() => {
          if (roundNumber === 1) {
            startSecondRound(arenaId);
          } else if (roundNumber === 2) {
            startThirdRound(arenaId);
          } else {
            endGame(arenaId);
          }
        }, 3000);
      } else {
        ws.send(
          JSON.stringify({
            event: "wrong-answer",
            message: "Your answer is incorrect!",
          })
        );
    
        if (
          arena.submissions.length === 2 &&
          !arena.roundResults.some(
            (result) => result.roundNumber === arena.currentRound?.number
          )
        ) {
          retryRound(arenaId);
        }
      }
    }
    
  });
});



// Retry round if both the players failed 
function retryRound(arenaId: string) {
  const arena = arenas[arenaId];
  if (!arena) return;
  arena.submissions = []; 
  arena.players.forEach((player) => {
    player.socket.send(
      JSON.stringify({
        event: "round-retry",
        message: "Both players gave incorrect answers. Retrying the round...",
      })
    );
  });

   setTimeout(() => {
    arena.players.forEach((player) => {
      player.socket.send(
        JSON.stringify({
          event: "round-start",
          gridSize: arena.currentRound?.gridSize,
          pattern: arena.currentRound?.pattern,
        })
      );
    });

    setTimeout(() => {
      arena.players.forEach((player) => {
        player.socket.send(JSON.stringify({ event: "pattern-clear" }));
      });
    }, 2000);
  }, 3000);
}



function startSecondRound(arenaId: string) {
  const arena = arenas[arenaId];
  if (!arena) return;

  const secondRound = rounds["3x4"][0];
  arena.currentRound = secondRound;
  arena.submissions = [];

  arena.players.forEach((player) => {
    player.socket.send(
      JSON.stringify({ event: "countdown", message: "Round 2 starting in 3, 2, 1..." })
    );
  });

  setTimeout(() => {
    arena.players.forEach((player) => {
      player.socket.send(
        JSON.stringify({
          event: "round-start",
          gridSize: secondRound.gridSize,
          pattern: secondRound.pattern,
        })
      );
    });

    setTimeout(() => {
      arena.players.forEach((player) => {
        player.socket.send(JSON.stringify({ event: "pattern-clear" }));
      });
    }, 2000);
  }, 3000);
}



function startThirdRound(arenaId: string) {
  const arena = arenas[arenaId];
  if (!arena) return;

  const thirdRound = rounds["4x4"][0];
  arena.currentRound = thirdRound;
  arena.submissions = [];

  arena.players.forEach((player) => {
    player.socket.send(
      JSON.stringify({ event: "countdown", message: "Round 3 starting in 3, 2, 1..." })
    );
  });

  setTimeout(() => {
    arena.players.forEach((player) => {
      player.socket.send(
        JSON.stringify({
          event: "round-start",
          gridSize: thirdRound.gridSize,
          pattern: thirdRound.pattern,
        })
      );
    });

    setTimeout(() => {
      arena.players.forEach((player) => {
        player.socket.send(JSON.stringify({ event: "pattern-clear" }));
      });
    }, 2000);
  }, 3000);
}


function endGame(arenaId: string) {
  const arena = arenas[arenaId];
  if (!arena) return;

  const winners = arena.roundResults.map((result) => result.winner);
  const overallWinner =
    winners.filter((winner) => winner === arena.players[0].username).length >
    winners.filter((winner) => winner === arena.players[1].username).length
      ? arena.players[0].username
      : arena.players[1].username;

  arena.players.forEach((player) => {
    player.socket.send(
      JSON.stringify({ event: "game-over", message: `${overallWinner} wins the game!` })
    );
  });

  delete arenas[arenaId];
}
