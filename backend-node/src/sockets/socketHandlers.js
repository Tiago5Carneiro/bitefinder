const Group = require("../models/Group");
const RestaurantService = require("../services/restaurantService");
const { validateRestaurantVote } = require("../middleware/validation");

function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join group room
    socket.on("join_group", async (data) => {
      try {
        const { group_code, username } = data;

        if (!group_code || !username) {
          socket.emit("error", { message: "Group code and username required" });
          return;
        }

        // Verify user is member of the group
        const members = await Group.getMembers(group_code);
        const isMember = members.some((member) => member.username === username);

        if (!isMember) {
          socket.emit("error", {
            message: "User is not a member of this group",
          });
          return;
        }

        socket.join(group_code);
        socket.groupCode = group_code;
        socket.username = username;

        // Notify other members
        socket.to(group_code).emit("user_joined", {
          username,
          message: `${username} joined the group`,
        });

        // Send updated member list
        const updatedMembers = await Group.getMembers(group_code);
        io.to(group_code).emit("members_update", { members: updatedMembers });

        console.log(`${username} joined group ${group_code}`);
      } catch (error) {
        console.error("Join group error:", error);
        socket.emit("error", { message: "Failed to join group" });
      }
    });

    // Leave group room
    socket.on("leave_group", async (data) => {
      try {
        const { group_code, username } = data;

        if (socket.groupCode === group_code) {
          socket.leave(group_code);

          // Notify other members
          socket.to(group_code).emit("member_left", {
            username,
            message: `${username} left the group`,
          });

          // Send updated member list
          const updatedMembers = await Group.getMembers(group_code);
          io.to(group_code).emit("members_update", { members: updatedMembers });

          socket.groupCode = null;
          socket.username = null;

          console.log(`${username} left group ${group_code}`);
        }
      } catch (error) {
        console.error("Leave group error:", error);
        socket.emit("error", { message: "Failed to leave group" });
      }
    });

    // Handle restaurant voting
    socket.on("restaurant_vote", async (data) => {
      try {
        const { group_code, restaurant_id, username, liked } = data;

        // Validate data
        const validationError = validateRestaurantVote(data);
        if (validationError) {
          socket.emit("error", { message: validationError });
          return;
        }

        // Verify user is in the group
        if (socket.groupCode !== group_code || socket.username !== username) {
          socket.emit("error", { message: "Invalid group or user" });
          return;
        }

        // Process the vote
        const result = await RestaurantService.voteRestaurant(
          group_code,
          restaurant_id,
          username,
          liked
        );

        // Notify all group members of the vote
        io.to(group_code).emit("restaurant_vote_update", {
          restaurant_id,
          username,
          liked,
          timestamp: new Date().toISOString(),
        });

        // Check if it's a match
        if (result.isMatch) {
          // Notify all members of the match
          io.to(group_code).emit("restaurant_match", {
            message: "Restaurant match found!",
            restaurant: result.restaurant,
            matched_at: new Date().toISOString(),
          });

          console.log(
            `Restaurant match found for group ${group_code}: ${result.restaurant.name}`
          );
        }
      } catch (error) {
        console.error("Restaurant vote error:", error);
        socket.emit("error", { message: "Failed to process vote" });
      }
    });

    // Handle group dissolution by host
    socket.on("group_dissolved_by_host", async (data) => {
      try {
        const { group_code, username } = data;

        // Verify user is the host
        const group = await Group.findByCode(group_code);
        if (!group || group.creator_username !== username) {
          socket.emit("error", {
            message: "Only group host can dissolve the group",
          });
          return;
        }

        // Update group status
        await Group.updateStatus(group_code, "inactive");

        // Notify all members
        io.to(group_code).emit("group_dissolved", {
          message: "Group has been dissolved by the host",
          dissolved_by: username,
          timestamp: new Date().toISOString(),
        });

        // Remove all sockets from the room
        const sockets = await io.in(group_code).fetchSockets();
        for (const socket of sockets) {
          socket.leave(group_code);
          socket.groupCode = null;
          socket.username = null;
        }

        console.log(`Group ${group_code} dissolved by ${username}`);
      } catch (error) {
        console.error("Group dissolution error:", error);
        socket.emit("error", { message: "Failed to dissolve group" });
      }
    });

    // Handle member leaving
    socket.on("member_leaving", async (data) => {
      try {
        const { group_code, username } = data;

        if (socket.groupCode === group_code && socket.username === username) {
          // Remove member from group
          await Group.removeMember(group_code, username);

          // Leave socket room
          socket.leave(group_code);

          // Notify other members
          socket.to(group_code).emit("member_left", {
            username,
            message: `${username} left the group`,
          });

          // Send updated member list
          const updatedMembers = await Group.getMembers(group_code);
          io.to(group_code).emit("members_update", { members: updatedMembers });

          socket.groupCode = null;
          socket.username = null;

          console.log(`${username} left group ${group_code}`);
        }
      } catch (error) {
        console.error("Member leaving error:", error);
        socket.emit("error", { message: "Failed to leave group" });
      }
    });

    // Handle ready status changes
    socket.on("ready_status_change", async (data) => {
      try {
        const { group_code, username, is_ready } = data;

        if (socket.groupCode === group_code && socket.username === username) {
          await Group.updateMemberReadyStatus(group_code, username, is_ready);

          // Notify all members of ready status change
          io.to(group_code).emit("member_ready_update", {
            username,
            is_ready,
            timestamp: new Date().toISOString(),
          });

          // Check if all members are ready
          const members = await Group.getMembers(group_code);
          const allReady =
            members.length > 1 && members.every((member) => member.is_ready);

          if (allReady) {
            await Group.updateStatus(group_code, "selecting");
            io.to(group_code).emit("all_members_ready", {
              message:
                "All members are ready! Starting restaurant selection...",
              timestamp: new Date().toISOString(),
            });
          }

          console.log(
            `${username} ready status changed to ${is_ready} in group ${group_code}`
          );
        }
      } catch (error) {
        console.error("Ready status change error:", error);
        socket.emit("error", { message: "Failed to update ready status" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        if (socket.groupCode && socket.username) {
          // Notify other members
          socket.to(socket.groupCode).emit("member_disconnected", {
            username: socket.username,
            message: `${socket.username} disconnected`,
          });

          console.log(
            `${socket.username} disconnected from group ${socket.groupCode}`
          );
        }

        console.log(`User disconnected: ${socket.id}`);
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    });
  });

  console.log("🔌 Socket.IO handlers configured");
}

module.exports = setupSocketHandlers;
