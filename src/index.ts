import express from "express";
import  {WebSocket,  WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const app = express();
const client = new PrismaClient();
const wss = new WebSocketServer({ port: 8080 });

type Player = {
  socket: WebSocket;
  username: string;
};

type Submission = {
    username: string;
    answer: number[];
  };
  
  type Arena = {
    players: Player[];
    submissions: Submission[]; 
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
    "4x4": [{ number: 3, gridSize: "4x4", pattern: [0, 5, 10, 15] }],
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
        submissions: []
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
        arenas[arenaId] = { players: [], submissions:[] };
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
              player.socket.send(
                JSON.stringify({ event: "pattern-clear" }) 
              );
            });
          }, 2000);
        }, 3000); 
      }
  

      if (data.event === "submit-answer") {
        const arenaId = data.arenaId;
        const arena = arenas[arenaId];
  
        if (!arena) {
          ws.send(JSON.stringify({ event: "error", message: "Arena not found" }));
          return;
        }
  
        const { username, answer } = data;
         
      if (!arena.submissions) {
        arena.submissions = [];
      }

      const hasAlreadySubmitted = arena.submissions.some(
        (submission) => submission.username === username
      );
      if (hasAlreadySubmitted) {
        ws.send(
          JSON.stringify({
            event: "duplicate-submission",
            message: "You have already submitted your answer for this round.",
          })
        );
        return;
      }
       
       arena.submissions.push({ username, answer });

       if (arena.submissions.length === 1) {
         
         if (JSON.stringify(answer) === JSON.stringify(rounds.pattern)) {
        
           concludeRound(arenaId, username);
           return;
         }
       } else if (arena.submissions.length === 2) {
      
         const secondSubmission = arena.submissions[1];
 
         if (JSON.stringify(secondSubmission.answer) === JSON.stringify(rounds.pattern)) {
           concludeRound(arenaId, secondSubmission.username);
           return;
         } else {
           
           retryRound(arenaId);
           return;
         }
       }
     }
  });
});



function concludeRound(arenaId: string, winner: string) {
    const arena = arenas[arenaId];
    if (!arena) return;
  
   
    arena.players.forEach((player) => {
      player.socket.send(
        JSON.stringify({
          event: "round-result",
          message: `${winner} wins the round!`,
        })
      );
    });
   
  setTimeout(() => {
    startNextRound(arenaId);
  }, 3000);
}


function retryRound(arenaId: string) {
  const arena = arenas[arenaId];
  if (!arena) return;

  arena.players.forEach((player) => {
    player.socket.send(
      JSON.stringify({
        event: "round-retry",
        message: "Both answers were incorrect! Retrying the round...",
      })
    );
  });
    
   arena.submissions = [];

 }
 

 function startNextRound(arenaId: string) {
   const arena = arenas[arenaId];
   if (!arena) return;
 
   const nextRoundNumber = 1+ 1;
   const nextRound = rounds[`3x${3 + nextRoundNumber}`][0]; 
 
   if (nextRound) {
    
     arena.submissions = [];
   
 
     arena.players.forEach((player) => {
       player.socket.send(
         JSON.stringify({
           event: "countdown",
           message: "Next round starting in 3, 2, 1...",
         })
       );
     });
     setTimeout(() => {
        arena.players.forEach((player) => {
          player.socket.send(
            JSON.stringify({
              event: "round-start",
              gridSize: nextRound.gridSize,
              pattern: nextRound.pattern,
            })
          );
        });
  
        setTimeout(() => {
          arena.players.forEach((player) => {
            player.socket.send(JSON.stringify({ event: "pattern-clear" }));
          });
        }, 2000);
      }, 3000);
    } else {

      arena.players.forEach((player) => {
        player.socket.send(
          JSON.stringify({ event: "game-over", message: ` wins the game!` })
        );
      });
      delete arenas[arenaId]; 
    }
  }
